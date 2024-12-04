const mysql = require('mysql2/promise');
require('dotenv').config(); // Load environment variables

// Create connection pools for master and slave databases
const DbConnections = {
  slaveDb_1: mysql.createPool({
    host: process.env.DB1_HOST,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASS,
    database: process.env.DB1_DATABASE,
    port: process.env.DB1_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }),
  slaveDb_2: mysql.createPool({
    host: process.env.DB2_HOST,
    user: process.env.DB2_USER,
    password: process.env.DB2_PASS,
    database: process.env.DB2_DATABASE,
    port: process.env.DB2_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  }),
};

// Test master database connection
(async () => {
  try {
    await DbConnections.slaveDb_1.query('SELECT 1');
    console.log('Connected to slave#1 database');
  } catch (err) {
    console.error('Error connecting to slave#1 database:', err);
  }
})();

// Test slave database connection
(async () => {
  try {
    await DbConnections.slaveDb_2.query('SELECT 1');
    console.log('Connected to slave#2 database');
  } catch (err) {
    console.error('Error connecting to slave#2 database:', err);
  }
})();

module.exports = DbConnections;
