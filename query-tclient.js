require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "exxo_pm",
  password: process.env.DB_PASS || "admin123",
  port: Number(process.env.DB_PORT) || 5432,
});

async function run() {
  try {
    const { rows, fields } = await pool.query("SELECT * FROM tclient LIMIT 10");
    console.log(
      "columns:",
      fields.map((f) => f.name)
    );
    console.log("rows:", rows);
  } catch (e) {
    console.error("Query failed:", e.message || e);
  } finally {
    await pool.end();
  }
}

run();
