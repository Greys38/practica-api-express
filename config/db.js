const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conectado exitosamente a la base de datos (api_practica)');
    connection.release();
  } catch (error) {
    console.error('❌ Error de conexión a la base de datos:', error.message);
  }
};

testConnection();

module.exports = pool;