import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Переменные окружения для MySQL
const { MYSQL_SERVER, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;
// Создаем пулл соединений
const pool = mysql.createPool({
    // Хост
    host: MYSQL_SERVER,
    // Порт
    port: Number(MYSQL_PORT ?? 3306),
    // Пользователь
    user: MYSQL_USER,
    // Пароль
    password: MYSQL_PASSWORD,
    // База данных
    database: MYSQL_DATABASE,

    // Ожидание соединений
    waitForConnections: true,
    // Лимит соединений
    connectionLimit: 10,
    // Максимальное количество соединений в пуле
    maxIdle: 10,
    // Таймаут ожидания соединения
    idleTimeout: 60000,
    // Очередь соединений
    queueLimit: 0,
    // Включение keep alive
    enableKeepAlive: true,
    // Задержка начала keep alive
    keepAliveInitialDelay: 0,
});

// Универсальный запрос к БД с типизацией, который возвращает массив записей
export async function query<T = RowDataPacket>(
    sql: string,
    params?: unknown[] | object
): Promise<T[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(sql, params as never);
    return rows as unknown as T[];
}

// Запрос к БД, который возвращает одну запись или null
export async function queryOne<T = RowDataPacket>(
    sql: string,
    params?: unknown[] | object
): Promise<T | null> {
    const rows = await query<T>(sql, params);
    return rows[0] ?? null;
}

// Запрос к БД для операций INSERT/UPDATE/DELETE, возвращает результат выполнения
export async function execute(
    sql: string,
    params?: unknown[] | object
): Promise<ResultSetHeader> {
    const [result] = await pool.execute<ResultSetHeader>(sql, params as never);
    return result;
}