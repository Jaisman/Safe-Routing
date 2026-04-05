const express = require("express");
const cors = require("cors");
require('dotenv').config();
const {router: routeHandler} = require("./routes/route");
const reportPath = require('./routes/reports');
const app = express();
const connectDB = require('./config/db');
app.use((req, res, next) => {
  console.log(`🚨 Incoming Request: ${req.method} ${req.url}`);
  next();
});
app.use(cors());
app.use(express.json());
connectDB();
app.use("/route", routeHandler);
app.use('/api/reports', reportPath);
app.listen(5000, () => {
  console.log("Server running on port 5000");
});