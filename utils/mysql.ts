import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const { MYSQL_SERVER, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
const pool = mysql.createPool({
    host: MYSQL_SERVER,
    port: Number(MYSQL_PORT ?? 3306),
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE,

    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

// Универсальный запрос к БД с типизацией, который возвращает массив записей
export async function query<T extends RowDataPacket[]>(
    sql: string,
    params?: unknown[] | object
): Promise<T> {
    const [rows] = await pool.execute<T & RowDataPacket[]>(sql, params as never);
    return rows;
}

// Запрос к БД, который возвращает одну запись или null
export async function queryOne<T extends RowDataPacket>(
    sql: string,
    params?: unknown[] | object
): Promise<T | null> {
    const rows = await query<T[]>(sql, params);
    return (rows[0] as T) || null;
}

// Запрос к БД для операций INSERT/UPDATE/DELETE, возвращает результат выполнения
export async function execute(
    sql: string,
    params?: unknown[] | object
): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(sql, params as never);
    return result;
}