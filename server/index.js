const cors = require("cors");
const express = require("express");

const app = express();

require("dotenv").config();

const router = require("./router/router")

const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: true, 
  credentials: true, 
  optionSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
// Routes
app.use('/', router);


//TODO setup connection to sql
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}!`);
});
