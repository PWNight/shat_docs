#!/usr/bin/env node
/**
 * SQLite backup script with WAL-safe checkpoint.
 * Usage: node scripts/backup-db.mjs [destination]
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

const sourcePath = process.env.SQLITE_PATH
    ? path.resolve(process.env.SQLITE_PATH)
    : path.join(process.cwd(), "data", "shat_docs.sqlite");

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const destination = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.join(process.cwd(), "data", "backups", `shat_docs-${timestamp}.sqlite`);

if (!fs.existsSync(sourcePath)) {
    console.error(`Database not found: ${sourcePath}`);
    process.exit(1);
}

fs.mkdirSync(path.dirname(destination), { recursive: true });

const db = new Database(sourcePath, { readonly: true });
try {
    db.pragma("wal_checkpoint(TRUNCATE)");
    db.backup(destination);
    console.log(`Backup saved to ${destination}`);
} finally {
    db.close();
}
