import { Injectable } from '@angular/core';
import {
  CapacitorSQLite,
  SQLiteConnection,
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private sqlite: SQLiteConnection;
  private db!: SQLiteDBConnection;
  private readonly DB_NAME = 'dezai_checador';
  private initialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async initializeDatabase(): Promise<void> {
    if (this.initialized) return;

    if (Capacitor.getPlatform() === 'web') {
      await customElements.whenDefined('jeep-sqlite');
      await this.sqlite.initWebStore();
    }

    await this.sqlite.checkConnectionsConsistency();
    const isConn = (
      await this.sqlite.isConnection(this.DB_NAME, false)
    ).result;

    if (isConn) {
      this.db = await this.sqlite.retrieveConnection(this.DB_NAME, false);
    } else {
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false,
        'no-encryption',
        1,
        false,
      );
    }

    await this.db.open();
    await this.createTables();
    this.initialized = true;
  }

  private async createTables(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS pending_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workerId TEXT NOT NULL,
        checkInTime TEXT NOT NULL,
        checkOutTime TEXT,
        gpsLat REAL NOT NULL,
        gpsLong REAL NOT NULL,
        photoBase64 TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'PENDING',
        createdAt TEXT DEFAULT (datetime('now'))
      );
    `;
    await this.db.execute(sql);
  }

  async addPendingAttendance(record: {
    workerId: string;
    checkInTime: string;
    gpsLat: number;
    gpsLong: number;
    photoBase64: string;
  }): Promise<void> {
    const sql = `INSERT INTO pending_attendance (workerId, checkInTime, gpsLat, gpsLong, photoBase64)
                 VALUES (?, ?, ?, ?, ?)`;
    await this.db.run(sql, [
      record.workerId,
      record.checkInTime,
      record.gpsLat,
      record.gpsLong,
      record.photoBase64,
    ]);
  }

  async getPendingRecords(): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM pending_attendance WHERE syncStatus = 'PENDING'`,
    );
    return result.values || [];
  }

  async markAsSynced(id: number): Promise<void> {
    await this.db.run(`DELETE FROM pending_attendance WHERE id = ?`, [id]);
  }

  async getPendingCount(): Promise<number> {
    const result = await this.db.query(
      `SELECT COUNT(*) as count FROM pending_attendance WHERE syncStatus = 'PENDING'`,
    );
    return result.values?.[0]?.count || 0;
  }
}
