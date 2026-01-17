require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const USER = process.env.NEW_USER || "user1";
const PASS = process.env.NEW_PASS || "demo123";

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "admin123",
    database: process.env.DB_NAME || "exxo_pm",
    port: Number(process.env.DB_PORT) || 3306,
  });
  try {
    const hash = await bcrypt.hash(PASS, 10);
    // Try update first
    const [updateResult] = await conn.execute(
      "UPDATE muser SET password = ?, active = 1 WHERE username = ?",
      [hash, USER]
    );
    if (updateResult.affectedRows > 0) {
      console.log("Updated existing user", USER);
      process.exit(0);
    }
    // Insert new user with sensible defaults
    const role = "user";
    const company = "Default Company";
    const descname = USER;
    // Try to insert specifying common columns. Use IF NOT EXISTS semantics via SELECT
    try {
      const [res] = await conn.execute(
        "INSERT INTO muser (username, password, role, company, descname, active) VALUES (?, ?, ?, ?, ?, 1)",
        [USER, hash, role, company, descname]
      );
      console.log("Inserted user", USER, "id:", res.insertId);
    } catch (e) {
      // Fallback: attempt minimal insert (username, password)
      try {
        const [res2] = await conn.execute(
          "INSERT INTO muser (username, password) VALUES (?, ?)",
          [USER, hash]
        );
        console.log("Inserted user (minimal)", USER, "id:", res2.insertId);
      } catch (err2) {
        console.error("Insert failed:", err2.message || err2);
        process.exit(2);
      }
    }
  } catch (e) {
    console.error("Error:", e.message || e);
    process.exit(3);
  } finally {
    await conn.end();
  }
}

run();
