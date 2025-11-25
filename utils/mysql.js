import mysql from 'mysql2/promise';

export const query = async (sql, params) => {
  const pool = mysql.createPool({
    host: 'http://172.25.222.220/',
    port: 3306,
    user: 'rodion',
    password: 'rodion',
    database: 'shat_docs',
  });

  const [results] = await pool.execute(sql, params);
  await pool.end();
  return results;
};