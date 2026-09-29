import { createBackup, restoreStaging } from "../../lib/cms/backup";
import { getPool } from "../../lib/cms/db";
try {
  if (process.argv[2] === "restore") {
    if (
      !process.env.CMS_RESTORE_DATABASE_URL ||
      !process.env.CMS_RESTORE_MEDIA_DIR ||
      !process.argv[3]
    )
      throw new Error(
        "Set CMS_RESTORE_DATABASE_URL, CMS_RESTORE_MEDIA_DIR and pass an encrypted backup path",
      );
    console.log(
      await restoreStaging(
        process.argv[3],
        process.env.CMS_RESTORE_DATABASE_URL,
        process.env.CMS_RESTORE_MEDIA_DIR,
      ),
    );
  } else console.log(await createBackup("local-cli"));
} finally {
  await getPool().end();
}
