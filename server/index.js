require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "sentinel_db",
  password: process.env.DB_PASSWORD,
  port: 5432,
});

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("Sentinel Risk Engine API running");
});

// GET transactions
app.get("/transactions", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM transactions ORDER BY created_at DESC"
  );
  res.json(result.rows);
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});