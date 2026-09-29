import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  bigint,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { CmsDocument } from "./model";
const time = (name: string) => timestamp(name, { withTimezone: true });
export const user = pgTable("cms_user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
});
export const session = pgTable("cms_session", {
  id: text("id").primaryKey(),
  expiresAt: time("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});
export const account = pgTable("cms_account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: time("access_token_expires_at"),
  refreshTokenExpiresAt: time("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const verification = pgTable("cms_verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: time("expires_at").notNull(),
  createdAt: time("created_at").defaultNow(),
  updatedAt: time("updated_at").defaultNow(),
});
export const twoFactor = pgTable("cms_two_factor", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  verified: boolean("verified").default(false),
  failedVerificationCount: integer("failed_verification_count").default(0),
  lockedUntil: time("locked_until"),
});
export const rateLimit = pgTable("cms_rate_limit", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});
export const sessionPolicy = pgTable("cms_session_policy", {
  sessionId: text("session_id")
    .primaryKey()
    .references(() => session.id, { onDelete: "cascade" }),
  lastActiveAt: time("last_active_at").notNull().defaultNow(),
  reauthenticatedAt: time("reauthenticated_at"),
});
export const entries = pgTable(
  "cms_entries",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    draft: jsonb("draft").$type<CmsDocument>().notNull(),
    published: jsonb("published").$type<CmsDocument>(),
    version: integer("version").notNull().default(1),
    publishedVersion: integer("published_version"),
    scheduledAt: time("scheduled_at"),
    scheduledVersion: integer("scheduled_version"),
    trashedAt: time("trashed_at"),
    createdAt: time("created_at").notNull().defaultNow(),
    updatedAt: time("updated_at").notNull().defaultNow(),
    publishedAt: time("published_at"),
  },
  (t) => [
    uniqueIndex("cms_entries_kind_slug").on(t.kind, t.slug),
    index("cms_entries_schedule").on(t.scheduledAt),
  ],
);
export const revisions = pgTable(
  "cms_revisions",
  {
    id: text("id").primaryKey(),
    entryId: text("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    document: jsonb("document").$type<CmsDocument>().notNull(),
    actor: text("actor").notNull(),
    reason: text("reason").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("cms_revision_version").on(t.entryId, t.version)],
);
export const audit = pgTable("cms_audit", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  details: jsonb("details").notNull().default({}),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const media = pgTable("cms_media", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull(),
  width: integer("width"),
  height: integer("height"),
  alt: text("alt").notNull().default(""),
  caption: text("caption").notNull().default(""),
  labels: jsonb("labels").$type<string[]>().notNull().default([]),
  focalX: integer("focal_x").notNull().default(50),
  focalY: integer("focal_y").notNull().default(50),
  variants: jsonb("variants").$type<string[]>().notNull().default([]),
  createdAt: time("created_at").notNull().defaultNow(),
  trashedAt: time("trashed_at"),
});
export const mediaRefs = pgTable("cms_media_refs", {
  id: text("id").primaryKey(),
  mediaId: text("media_id")
    .notNull()
    .references(() => media.id),
  entryId: text("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" }),
  visibility: text("visibility").notNull(),
});
export const redirects = pgTable("cms_redirects", {
  source: text("source").primaryKey(),
  destination: text("destination").notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const secrets = pgTable("cms_secrets", {
  key: text("key").primaryKey(),
  encrypted: text("encrypted").notNull(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const messages = pgTable("cms_messages", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("unread"),
  notes: text("notes").notNull().default(""),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const jobs = pgTable("cms_jobs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
  status: text("status").notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0),
  runAt: time("run_at").notNull().defaultNow(),
  lockedAt: time("locked_at"),
  error: text("error"),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const system = pgTable("cms_system", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const backups = pgTable("cms_backups", {
  id: text("id").primaryKey(),
  status: text("status").notNull(),
  bytes: bigint("bytes", { mode: "number" }),
  manifest: jsonb("manifest").notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
});
