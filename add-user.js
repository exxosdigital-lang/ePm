require("dotenv").config();
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "exxo_pm",
  password: process.env.DB_PASS || "admin123",
  port: Number(process.env.DB_PORT) || 5432,
});

async function addUser(username, password) {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM muser WHERE username=$1",
      [username]
    );
    if (rows.length) {
      console.log("User already exists:", username);
      return;
    }
    const hash = await bcrypt.hash(password, 10);
    const res = await pool.query(
      "INSERT INTO muser (username, password, role, company) VALUES ($1, $2, $3, $4) RETURNING *",
      [username, hash, "user", "Default Company"]
    );
    console.log("User created:", res.rows[0]);
  } catch (err) {
    console.error("Error creating user:", err.message || err);
  } finally {
    await pool.end();
  }
}

// defaults
const username = process.argv[2] || "demo";
const password = process.argv[3] || "demo123";

addUser(username, password).then(() => process.exit(0));
