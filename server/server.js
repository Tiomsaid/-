require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const port = Number(process.env.PORT || 4174);
const collectionName = "clinic_data";

app.use(cors());
app.use(express.json({ limit: "30mb" }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "clinic_user",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tongzhande_clinic",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

async function ensureSchema() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS clinic_collections (
      name VARCHAR(64) PRIMARY KEY,
      data JSON NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: "database_unavailable" });
  }
});

app.get("/data", async (req, res) => {
  const [rows] = await pool.execute(
    "SELECT data, updated_at FROM clinic_collections WHERE name = ?",
    [collectionName]
  );
  if (!rows.length) {
    res.json({ hasData: false, data: null });
    return;
  }
  res.json({ hasData: true, data: rows[0].data, updatedAt: rows[0].updated_at });
});

app.put("/data", async (req, res) => {
  if (!req.body || typeof req.body.data !== "object" || Array.isArray(req.body.data)) {
    res.status(400).json({ ok: false, error: "invalid_data" });
    return;
  }
  await pool.execute(
    `INSERT INTO clinic_collections (name, data)
     VALUES (?, CAST(? AS JSON))
     ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = CURRENT_TIMESTAMP`,
    [collectionName, JSON.stringify(req.body.data)]
  );
  res.json({ ok: true });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ ok: false, error: "server_error" });
});

ensureSchema()
  .then(() => {
    app.listen(port, "127.0.0.1", () => {
      console.log(`Clinic API listening on http://127.0.0.1:${port}`);
    });
  })
  .catch(error => {
    console.error("Failed to initialize database schema", error);
    process.exit(1);
  });
