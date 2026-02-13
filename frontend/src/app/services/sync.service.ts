import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Network } from '@capacitor/network';
import { firstValueFrom } from 'rxjs';
import { DatabaseService } from './database.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SyncService implements OnDestroy {
  private isSyncing = false;
  private listenerHandle: any;

  constructor(
    private http: HttpClient,
    private db: DatabaseService,
  ) {}

  async startListening(): Promise<void> {
    // Check on startup
    const status = await Network.getStatus();
    if (status.connected) {
      await this.syncPendingRecords();
    }

    // Listen for network changes
    this.listenerHandle = await Network.addListener(
      'networkStatusChange',
      async (status) => {
        if (status.connected && !this.isSyncing) {
          await this.syncPendingRecords();
        }
      },
    );
  }

  async syncPendingRecords(): Promise<number> {
    if (this.isSyncing) return 0;
    this.isSyncing = true;

    try {
      const pending = await this.db.getPendingRecords();
      if (pending.length === 0) return 0;

      const records = pending.map((r: any) => ({
        workerId: r.workerId,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime || undefined,
        gpsLat: r.gpsLat,
        gpsLong: r.gpsLong,
        photoBase64: r.photoBase64,
      }));

      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/api/attendance/sync`, {
          records,
        }),
      );

      // On success, remove synced records from SQLite
      for (const record of pending) {
        await this.db.markAsSynced(record.id);
      }

      return pending.length;
    } catch (error) {
      console.error('Sync failed, will retry on next connection:', error);
      return 0;
    } finally {
      this.isSyncing = false;
    }
  }

  ngOnDestroy(): void {
    if (this.listenerHandle) {
      this.listenerHandle.remove();
    }
  }
}
