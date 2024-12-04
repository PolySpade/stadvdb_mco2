const cors = require("cors");
const express = require("express");
const app = express();

require("dotenv").config();
const DbConnections = require('./dbConnection');
const router = require("./router/router")

const PORT = process.env.PORT || 4000;

const mysql = require("mysql2");

const corsOptions = {
  origin: process.env.ORIGIN, 
  credentials: true, 
  optionSuccessStatus: 200
};

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0,
});

app.use(cors(corsOptions));
app.use(express.json());
// Routes
app.use('/', router);

const rateLimit = require("express-rate-limit");
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later",
});

app.use("/api/", apiLimiter);

// Routes
app.set("dbConnection", connection);

//TODO setup connection to sql
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});
