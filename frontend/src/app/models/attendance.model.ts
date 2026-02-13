export interface AttendanceRecord {
  id: string;
  workerId: string;
  workerName?: string;
  checkInTime: string;
  checkOutTime?: string;
  gpsLat: number;
  gpsLong: number;
  isVerified: boolean;
  syncStatus: 'SYNCED' | 'PENDING';
}
