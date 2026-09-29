import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  randomUUID,
} from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import {
  mkdtemp,
  mkdir,
  cp,
  readFile,
  writeFile,
  rm,
  stat,
  open,
  readdir,
} from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import { db, getPool } from "./db";
import { backups } from "./db-schema";
import { mediaRoot } from "./media";
import { logAudit } from "./repository";
const exec = promisify(execFile);
// Ordered for FK-safe restoration. Sessions and login challenges are deliberately not restored.
const tables = [
  "cms_user",
  "cms_account",
  "cms_two_factor",
  "cms_entries",
  "cms_revisions",
  "cms_audit",
  "cms_media",
  "cms_media_refs",
  "cms_redirects",
  "cms_secrets",
  "cms_messages",
  "cms_jobs",
  "cms_system",
  "cms_backups",
] as const;
export const backupRoot = () =>
  process.env.CMS_BACKUP_DIR ?? path.join(process.cwd(), ".cms-backups");
function backupKey() {
  const key = Buffer.from(process.env.CMS_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("Backup encryption key is missing");
  return key;
}
export async function createBackup(actor: string) {
  const id = randomUUID(),
    temp = await mkdtemp(path.join(tmpdir(), "cms-backup-")),
    destination = path.join(backupRoot(), `${id}.cmsbak`);
  const manifest = {
    format: 1,
    createdAt: new Date().toISOString(),
    application: "portfolio-cms",
    schema: 1,
    restoresSessions: false,
  };
  try {
    await db().insert(backups).values({ id, status: "processing", manifest });
    await mkdir(backupRoot(), { recursive: true, mode: 0o700 });
    const client = await getPool().connect();
    const data: Record<string, unknown[]> = {};
    try {
      await client.query("begin isolation level repeatable read read only");
      for (const table of tables)
        data[table] = (await client.query(`select * from "${table}"`)).rows;
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
    await writeFile(path.join(temp, "database.json"), JSON.stringify(data), {
      mode: 0o600,
    });
    await writeFile(
      path.join(temp, "manifest.json"),
      JSON.stringify(manifest),
      { mode: 0o600 },
    );
    await mkdir(path.join(temp, "media"));
    // Media binaries are immutable; copy only assets from this database snapshot.
    for (const row of data.cms_media as { id: string; variants: string[] }[]) {
      await mkdir(path.join(temp, "media", row.id));
      for (const variant of row.variants)
        await cp(
          path.join(mediaRoot(), row.id, variant),
          path.join(temp, "media", row.id, variant),
        );
    }
    const archive = path.join(temp, "payload.tar.gz");
    await exec("tar", [
      "-czf",
      archive,
      "-C",
      temp,
      "database.json",
      "manifest.json",
      "media",
    ]);
    const iv = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", backupKey(), iv);
    await writeFile(destination, Buffer.concat([Buffer.from("CMS1"), iv]), {
      mode: 0o600,
    });
    await pipeline(
      createReadStream(archive),
      cipher,
      createWriteStream(destination, { flags: "a" }),
    );
    const handle = await open(destination, "a");
    try {
      await handle.write(cipher.getAuthTag());
    } finally {
      await handle.close();
    }
    const bytes = (await stat(destination)).size;
    await db()
      .update(backups)
      .set({ status: "ready", bytes })
      .where(eq(backups.id, id));
    await logAudit(actor, "backup.created", id, { bytes });
    return { id, bytes, manifest };
  } catch (e) {
    await rm(destination, { force: true }).catch(() => undefined);
    await db()
      .update(backups)
      .set({ status: "failed" })
      .where(eq(backups.id, id));
    throw e;
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}
export async function restoreStaging(
  file: string,
  stagingUrl: string,
  stagingMedia: string,
) {
  if (!stagingUrl || stagingUrl === process.env.DATABASE_URL)
    throw new Error("A separate staging database is required");
  const staging = new URL(stagingUrl),
    active = new URL(process.env.DATABASE_URL!);
  if (
    decodeURIComponent(staging.pathname) === decodeURIComponent(active.pathname)
  )
    throw new Error("Refusing restore into active database");
  if (path.resolve(stagingMedia) === path.resolve(mediaRoot()))
    throw new Error("A separate staging media directory is required");
  const existing = await readdir(stagingMedia).catch(() => []);
  if (existing.length) throw new Error("Staging media directory must be empty");
  const temp = await mkdtemp(path.join(tmpdir(), "cms-restore-")),
    pool = new Pool({ connectionString: stagingUrl, max: 1 });
  try {
    const size = (await stat(file)).size;
    if (size < 32) throw new Error("Invalid backup");
    const handle = await open(file, "r");
    const header = Buffer.alloc(16),
      tag = Buffer.alloc(16);
    try {
      await handle.read(header, 0, 16, 0);
      await handle.read(tag, 0, 16, size - 16);
    } finally {
      await handle.close();
    }
    if (header.subarray(0, 4).toString() !== "CMS1")
      throw new Error("Unsupported backup format");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      backupKey(),
      header.subarray(4),
    );
    decipher.setAuthTag(tag);
    const archive = path.join(temp, "payload.tar.gz");
    await pipeline(
      createReadStream(file, { start: 16, end: size - 17 }),
      decipher,
      createWriteStream(archive, { mode: 0o600 }),
    );
    const listing = await exec("tar", ["-tzf", archive], {
      maxBuffer: 16 * 1024 * 1024,
    });
    if (
      listing.stdout
        .split("\n")
        .filter(Boolean)
        .some(
          (p) =>
            p.startsWith("/") ||
            p.split("/").includes("..") ||
            !["media", "database.json", "manifest.json"].includes(
              p.split("/")[0],
            ),
        )
    )
      throw new Error("Unsafe archive");
    await exec("tar", ["-xzf", archive, "-C", temp, "--no-same-owner"]);
    const manifest = JSON.parse(
      await readFile(path.join(temp, "manifest.json"), "utf8"),
    );
    if (manifest.format !== 1 || manifest.schema !== 1)
      throw new Error("Backup schema is incompatible");
    const data = JSON.parse(
      await readFile(path.join(temp, "database.json"), "utf8"),
    ) as Record<string, Record<string, unknown>[]>;
    const client = await pool.connect();
    try {
      await client.query("begin");
      for (const table of tables) {
        if (
          Number(
            (await client.query(`select count(*) from "${table}"`)).rows[0]
              .count,
          )
        )
          throw new Error("Staging database must be empty and migrated");
      }
      for (const table of tables) {
        const columns = (
          await client.query(
            "select column_name,data_type from information_schema.columns where table_schema=$1 and table_name=$2",
            ["public", table],
          )
        ).rows as { column_name: string; data_type: string }[];
        for (const row of data[table] ?? []) {
          const keys = Object.keys(row);
          if (keys.some((k) => !columns.some((c) => c.column_name === k)))
            throw new Error("Unknown backup column");
          const values = keys.map((k) =>
            columns.find((c) => c.column_name === k)?.data_type === "jsonb"
              ? JSON.stringify(row[k])
              : row[k],
          );
          await client.query(
            `insert into "${table}" (${keys.map((k) => `"${k}"`).join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")})`,
            values,
          );
        }
      }
      // A restored worker must not send an old queued email automatically.
      await client.query(
        "update cms_jobs set status='unknown', error='Restored backup; operator review required' where status in ('queued','processing')",
      );
      await mkdir(stagingMedia, { recursive: true, mode: 0o700 });
      await cp(path.join(temp, "media"), stagingMedia, { recursive: true });
      await client.query("commit");
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
    return {
      manifest,
      tables: tables.length,
      entries: data.cms_entries.length,
      media: data.cms_media.length,
    };
  } finally {
    await pool.end();
    await rm(temp, { recursive: true, force: true });
  }
}
export async function pruneBackups() {
  const rows = await db().select().from(backups);
  for (const row of rows) {
    if (
      row.status === "ready" &&
      Date.now() - row.createdAt.getTime() > 30 * 86400000
    ) {
      await rm(path.join(backupRoot(), `${row.id}.cmsbak`), { force: true });
      await db()
        .update(backups)
        .set({ status: "expired" })
        .where(eq(backups.id, row.id));
    }
  }
}
