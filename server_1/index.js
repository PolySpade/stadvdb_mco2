const cors = require("cors");
const express = require("express");

const app = express();

require("dotenv").config();

const router = require("./router/router")

const PORT = process.env.PORT || 4000;

const mysql = require('mysql2/promise');

const corsOptions = {
  origin: true, 
  credentials: true, 
  optionSuccessStatus: 200
};

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_DATABASE,
//   port: process.env.DB_PORT
// });

// sample pool
// MySQL connection pools for three databases
const DbConnections = {
  masterDb: mysql.createPool({
    host: process.env.DB1_HOST,
    user: process.env.DB1_USER,
    password: process.env.DB1_PASS,
    database: process.env.DB1_DATABASE,
    port: process.env.DB1_PORT,
  }),
  slaveDb: mysql.createPool({
    host: process.env.DB2_HOST,
    user: process.env.DB2_USER,
    password: process.env.DB2_PASS,
    database: process.env.DB2_DATABASE,
    port: process.env.DB2_PORT,
  }),
};

app.use(cors(corsOptions));
app.use(express.json());
// Routes

app.use('/', router);
// const rateLimit = require("express-rate-limit");
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per window
//   message: "Too many requests from this IP, please try again later",
// });

// app.use("/api/", apiLimiter);

app.set("dbConnection", DbConnections);

//TODO setup connection to sql
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});
