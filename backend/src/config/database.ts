import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isRemoteHost = !!(process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost');
const isCloudSSL = process.env.DB_SSL === 'true' || process.env.DB_PORT === '4000' || isRemoteHost;
const sslConfig = isCloudSSL ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined;

const dbConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shop',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
  decimalNumbers: true,
  ssl: sslConfig,
};

export const pool = mysql.createPool(dbConfig);

// Dedicated Read-Only Connection Pool for Query Lab (DCL Analyst Role)
// Enforces multipleStatements: false and uses user 'analyst' with SELECT-only grants
const readOnlyConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_ANALYST_USER || process.env.DB_USER || 'root',
  password: process.env.DB_ANALYST_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false, // Physical driver restriction against multi-statement injection
  decimalNumbers: true,
  ssl: sslConfig,
};

export const readOnlyPool = mysql.createPool(readOnlyConfig);

export async function testConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
  try {
    const [rows]: any = await pool.query('SELECT VERSION() as version, DATABASE() as db');
    return {
      connected: true,
      version: rows[0]?.version,
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message,
    };
  }
}

export async function withTransaction<T>(
  callback: (conn: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await callback(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}
