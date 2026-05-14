import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

/** Совместимость с типизацией запросов (раньше mysql2 RowDataPacket). */
export type RowDataPacket = Record<string, unknown>;

export type ResultSetHeader = {
    affectedRows: number;
    insertId: number;
    info?: string;
};

const dbPath = process.env.SQLITE_PATH
    ? path.resolve(process.env.SQLITE_PATH)
    : path.join(process.cwd(), "data", "shat_docs.sqlite");

let dbInstance: Database.Database | null = null;

function ensureDataDir(): void {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function runMigrations(db: Database.Database): void {
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            isAdmin INTEGER NOT NULL DEFAULT 0,
            isRoot INTEGER NOT NULL DEFAULT 0,
            canAccessAdmin INTEGER NOT NULL DEFAULT 0,
            registration_status TEXT NOT NULL DEFAULT 'pending',
            created_by TEXT NOT NULL DEFAULT (datetime('now')),
            approved_at TEXT,
            approved_by INTEGER,
            FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS "groups" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_by TEXT NOT NULL DEFAULT (datetime('now')),
            fk_user INTEGER NOT NULL,
            FOREIGN KEY (fk_user) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            fk_group INTEGER NOT NULL,
            FOREIGN KEY (fk_group) REFERENCES "groups"(id) ON DELETE CASCADE ON UPDATE CASCADE,
            UNIQUE (full_name, fk_group)
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fk_group INTEGER NOT NULL,
            full_name TEXT NOT NULL,
            full_days_total INTEGER DEFAULT 0,
            full_days_sick INTEGER DEFAULT 0,
            lessons_total INTEGER DEFAULT 0,
            lessons_sick INTEGER DEFAULT 0,
            late INTEGER DEFAULT 0,
            period_month INTEGER,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (fk_group) REFERENCES "groups"(id) ON DELETE CASCADE,
            UNIQUE (fk_group, full_name, period_month)
        );

        CREATE TABLE IF NOT EXISTS grades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fk_group INTEGER NOT NULL,
            full_name TEXT NOT NULL,
            subjects_json TEXT,
            average_score REAL DEFAULT 0,
            period_semester INTEGER,
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (fk_group) REFERENCES "groups"(id) ON DELETE CASCADE,
            UNIQUE (fk_group, full_name, period_semester)
        );

        CREATE TABLE IF NOT EXISTS password_reset_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            resolved_at TEXT,
            resolved_by INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS admin_audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            actor_user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            details TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS auth_sessions (
            session_id TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            user_agent TEXT,
            ip_address TEXT,
            device_label TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
            expires_at TEXT NOT NULL,
            revoked_at TEXT,
            revoked_by_user_id INTEGER,
            revoked_reason TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(revoked_at, expires_at);
        CREATE INDEX IF NOT EXISTS idx_groups_fk_user ON "groups"(fk_user);
        CREATE INDEX IF NOT EXISTS idx_students_fk_group ON students(fk_group);
    `);
}

export function getDb(): Database.Database {
    if (dbInstance) {
        return dbInstance;
    }
    ensureDataDir();
    dbInstance = new Database(dbPath);
    runMigrations(dbInstance);
    return dbInstance;
}

export async function query<T = RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = getDb();
    const stmt = db.prepare(sql);
    return Promise.resolve(stmt.all(...params) as T[]);
}

export async function queryOne<T = RowDataPacket>(
    sql: string,
    params: unknown[] = []
): Promise<T | null> {
    const db = getDb();
    const stmt = db.prepare(sql);
    const row = stmt.get(...params) as T | undefined;
    return Promise.resolve(row ?? null);
}

export async function execute(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
    const db = getDb();
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return Promise.resolve({
        affectedRows: result.changes,
        insertId: Number(result.lastInsertRowid),
    });
}
