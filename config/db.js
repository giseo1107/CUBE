/**
 * MySQL 연결 풀 설정
 * config/db.js
 * 
 * 로컬 개발: .env에 DB_SSL=false (기본값)
 * 클라우드(TiDB): .env에 DB_SSL=true
 */

const mysql = require('mysql2');
require('dotenv').config();

const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// TiDB Cloud 등 SSL 필수 환경
if (process.env.DB_SSL === 'true') {
  poolConfig.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  };
  console.log('🔒 DB 연결: SSL 활성화');
} else {
  console.log('🔓 DB 연결: 로컬 모드');
}

const pool = mysql.createPool(poolConfig);
const promisePool = pool.promise();

module.exports = promisePool;