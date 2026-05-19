import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { env } from "@/env";

/** Совместимость с типизацией запросов (раньше mysql2 RowDataPacket). */
export type RowDataPacket = Record<string, unknown>;

export type ResultSetHeader = {
    affectedRows: number;
    insertId: number;
    info?: string;
};

const dbPath = env.SQLITE_PATH
    ? path.resolve(env.SQLITE_PATH)
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
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

    const migrations: Array<{ id: number; name: string; sql: string }> = [
        {
            id: 1,
            name: "initial_schema",
            sql: `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE CHECK(length(email) <= 254),
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
        CREATE INDEX IF NOT EXISTS idx_groups_name ON "groups"(name);
        CREATE INDEX IF NOT EXISTS idx_students_fk_group ON students(fk_group);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            `,
        },
        {
            id: 2,
            name: "composite_indexes",
            sql: `
        CREATE INDEX IF NOT EXISTS idx_attendance_group_period ON attendance(fk_group, period_month);
        CREATE INDEX IF NOT EXISTS idx_grades_group_period ON grades(fk_group, period_semester);
            `,
        },
        {
            id: 3,
            name: "fk_student_columns",
            sql: `
        ALTER TABLE attendance ADD COLUMN fk_student INTEGER REFERENCES students(id) ON DELETE SET NULL;
        ALTER TABLE grades ADD COLUMN fk_student INTEGER REFERENCES students(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_attendance_fk_student ON attendance(fk_student);
        CREATE INDEX IF NOT EXISTS idx_grades_fk_student ON grades(fk_student);
            `,
        },
        {
            id: 4,
            name: "backfill_fk_student",
            sql: `
        UPDATE attendance
        SET fk_student = (
            SELECT s.id FROM students s
            WHERE s.fk_group = attendance.fk_group AND s.full_name = attendance.full_name
            LIMIT 1
        )
        WHERE fk_student IS NULL;

        UPDATE grades
        SET fk_student = (
            SELECT s.id FROM students s
            WHERE s.fk_group = grades.fk_group AND s.full_name = grades.full_name
            LIMIT 1
        )
        WHERE fk_student IS NULL;
            `,
        },
    ];

    const applied = new Set(
        (db.prepare("SELECT name FROM schema_migrations").all() as Array<{ name: string }>).map((row) => row.name)
    );

    for (const migration of migrations) {
        if (applied.has(migration.name)) continue;
        db.exec(migration.sql);
        db.prepare("INSERT INTO schema_migrations (id, name) VALUES (?, ?)").run(migration.id, migration.name);
    }
}

function normalizeSqliteParam(value: unknown): unknown {
    if (value === undefined) {
        return null;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "boolean") {
        return value ? 1 : 0;
    }
    return value;
}

function normalizeSqliteParams(params: unknown[]): unknown[] {
    return params.map(normalizeSqliteParam);
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

export function query<T = RowDataPacket>(sql: string, params: unknown[] = []): T[] {
    const db = getDb();
    const stmt = db.prepare(sql);
    return stmt.all(...normalizeSqliteParams(params)) as T[];
}

export function queryOne<T = RowDataPacket>(
    sql: string,
    params: unknown[] = []
): T | null {
    const db = getDb();
    const stmt = db.prepare(sql);
    const row = stmt.get(...normalizeSqliteParams(params)) as T | undefined;
    return row ?? null;
}

export function execute(sql: string, params: unknown[] = []): ResultSetHeader {
    const db = getDb();
    const stmt = db.prepare(sql);
    const result = stmt.run(...normalizeSqliteParams(params));
    return {
        affectedRows: result.changes,
        insertId: Number(result.lastInsertRowid),
    };
}

export function transaction<T>(callback: (db: Database.Database) => T): T {
    const db = getDb();
    const tx = db.transaction(callback);
    return tx(db);
}
