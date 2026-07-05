import sqlite3 from 'sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'bookings.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH);

export function initDb() {
  return new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        service TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export function insertBooking({ name, phone, service, date, time }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO bookings (name, phone, service, date, time) VALUES (?, ?, ?, ?, ?)`,
      [name, phone, service, date, time],
      function callback(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

export function getAllBookings() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, name, phone, service, date, time, created_at FROM bookings ORDER BY id DESC`,
      [],
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });
}
