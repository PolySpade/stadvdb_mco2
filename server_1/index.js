const cors = require("cors");
const express = require("express");
const DbConnections = require('./dbConnection');
const app = express();

require("dotenv").config();

const router = require("./router/router")

const PORT = process.env.PORT || 4000;

const mysql = require('mysql2/promise');

// const redis = require('redis');
// const redisClient = redis.createClient();

// (async () => {
//   try {
//     await redisClient.connect(); // Explicitly connect the client
//     console.log('Connected to Redis');
//   } catch (err) {
//     console.error('Redis Connection Error:', err);
//   }
// })();


const corsOptions = {
  origin: process.env.ORIGIN, 
  credentials: true, 
  optionSuccessStatus: 200
};

// const DbConnections = {
//   masterDb: mysql.createPool({
//     host: process.env.DB1_HOST,
//     user: process.env.DB1_USER,
//     password: process.env.DB1_PASS,
//     database: process.env.DB1_DATABASE,
//     port: process.env.DB1_PORT,
//   }),
//   slaveDb: mysql.createPool({
//     host: process.env.DB2_HOST,
//     user: process.env.DB2_USER,
//     password: process.env.DB2_PASS,
//     database: process.env.DB2_DATABASE,
//     port: process.env.DB2_PORT,
//   }),
// };

app.use(cors(corsOptions));
app.use(express.json());
// Routes
app.use('/', router);

app.set("dbConnection", DbConnections);

//TODO setup connection to sql
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});

