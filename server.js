require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "srv1321.main-hosting.eu",
  user: process.env.DB_USER || "u416405722_exxo",
  password: process.env.DB_PASS || "admin123",
  database: process.env.DB_NAME || "u416405722_exxo_pm",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper: Execute query (wraps pool promise)
async function query(sql, values = []) {
  const conn = await pool.getConnection();
  try {
    const [result] = await conn.query(sql, values);
    return result;
  } finally {
    conn.release();
  }
}

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing fields" });

    const users = await query(
      "SELECT id, username, password, email, role, company, descname, active FROM muser WHERE username = ?",
      [username]
    );
    const user = users[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    // check active flag if present
    if (
      typeof user.active !== "undefined" &&
      (user.active === 0 || user.active === "0" || user.active === false)
    ) {
      return res.status(403).json({ error: "User inactive" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    // return only safe fields
    const safe = {
      id: user.id,
      username: user.username,
      email: user.email || null,
      role: user.role || null,
      company: user.company || null,
      descname: user.descname || null,
    };
    res.json({ ok: true, user: safe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Missing fields" });

    const existing = await query("SELECT id FROM muser WHERE username = ?", [
      username,
    ]);
    if (existing.length) return res.status(400).json({ error: "User exists" });

    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      "INSERT INTO muser (username, password, email) VALUES (?, ?, ?)",
      [username, hash, email || null]
    );
    res.json({
      ok: true,
      user: {
        id: result.insertId,
        username,
        email: email || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    if (!username || !newPassword)
      return res.status(400).json({ error: "Missing fields" });

    const users = await query("SELECT id FROM muser WHERE username = ?", [
      username,
    ]);
    if (!users.length) return res.status(404).json({ error: "User not found" });

    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE muser SET password = ? WHERE username = ?", [
      hash,
      username,
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// tclient CRUD endpoints
app.get("/api/tclient", async (req, res) => {
  try {
    const rows = await query("SELECT * FROM tclient");
    // Add synthetic id from first column if not present
    const mapped = rows.map((r) => {
      if (!r.id) {
        const firstColVal = Object.values(r)[0];
        r.id = firstColVal;
      }
      return r;
    });
    res.json({ ok: true, rows: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/tclient", async (req, res) => {
  try {
    const data = req.body || {};
    const cols = Object.keys(data);
    if (!cols.length) return res.status(400).json({ error: "No data" });
    const vals = Object.values(data);
    const placeholders = cols.map(() => "?").join(",");
    const colList = cols.map((c) => `\`${c}\``).join(",");
    const q = `INSERT INTO tclient (${colList}) VALUES (${placeholders})`;
    const result = await query(q, vals);
    // Fetch the inserted row
    const inserted = await query(`SELECT * FROM tclient WHERE Client_No = ?`, [
      data.Client_No,
    ]);
    res.json({ ok: true, row: inserted[0] || { ...data, id: data.Client_No } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/tclient/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body || {};
    const cols = Object.keys(data);
    if (!cols.length) return res.status(400).json({ error: "No data" });
    const vals = Object.values(data);
    const set = cols.map((c) => `\`${c}\` = ?`).join(",");
    // Use Client_No as primary key
    const q = `UPDATE tclient SET ${set} WHERE Client_No = ?`;
    await query(q, [...vals, id]);
    const updated = await query("SELECT * FROM tclient WHERE Client_No = ?", [
      id,
    ]);
    res.json({ ok: true, row: updated[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.delete("/api/tclient/:id", async (req, res) => {
  try {
    const id = req.params.id;
    // Use Client_No as primary key
    await query("DELETE FROM tclient WHERE Client_No = ?", [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`PM backend listening on ${port}`));
