require("dotenv").config();
const mysql = require("mysql2/promise");

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "admin123",
      database: process.env.DB_NAME || "exxo_pm",
      port: Number(process.env.DB_PORT) || 3306,
    });
    const [res] = await conn.query("SELECT NOW() as now");
    console.log("DB connection successful. now():", res[0].now);
    await conn.end();
    process.exit(0);
  } catch (err) {
    console.error("DB connection failed:", err.message || err);
    process.exit(2);
  }
})();
