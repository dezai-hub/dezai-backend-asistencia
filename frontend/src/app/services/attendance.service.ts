import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Network } from '@capacitor/network';
import { firstValueFrom } from 'rxjs';
import { CameraService } from './camera.service';
import { GeolocationService } from './geolocation.service';
import { DatabaseService } from './database.service';
import { environment } from '../../environments/environment';
import { AttendanceRecord } from '../models/attendance.model';

interface CheckInResult {
  isVerified: boolean;
  workerName?: string;
  syncStatus: 'SYNCED' | 'PENDING';
  attendance?: any;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  constructor(
    private http: HttpClient,
    private cameraService: CameraService,
    private geolocationService: GeolocationService,
    private db: DatabaseService,
  ) {}

  async checkIn(): Promise<CheckInResult> {
    // 1. Capture photo (ANTI-FRAUD: camera only, no gallery)
    const photoBase64 = await this.cameraService.takePhoto();

    // 2. Capture GPS
    const gps = await this.geolocationService.getCurrentPosition();

    // 3. Check network status
    const status = await Network.getStatus();

    if (status.connected) {
      // ONLINE: Send to backend for Rekognition verification
      return this.checkInOnline(photoBase64, gps.lat, gps.lng);
    } else {
      // OFFLINE: Save locally to SQLite
      return this.checkInOffline(photoBase64, gps.lat, gps.lng);
    }
  }

  private async checkInOnline(
    photoBase64: string,
    lat: number,
    lng: number,
  ): Promise<CheckInResult> {
    const blob = this.base64ToBlob(photoBase64, 'image/jpeg');
    const formData = new FormData();
    formData.append('photo', blob, 'attendance.jpg');
    formData.append('gpsLat', lat.toString());
    formData.append('gpsLong', lng.toString());

    const res = await firstValueFrom(
      this.http.post<any>(
        `${environment.apiUrl}/api/attendance/check-in`,
        formData,
      ),
    );

    return {
      isVerified: true,
      workerName: res.worker?.name,
      syncStatus: 'SYNCED',
      attendance: res,
    };
  }

  private async checkInOffline(
    photoBase64: string,
    lat: number,
    lng: number,
  ): Promise<CheckInResult> {
    await this.db.addPendingAttendance({
      workerId: 'pending-verification',
      checkInTime: new Date().toISOString(),
      gpsLat: lat,
      gpsLong: lng,
      photoBase64,
    });

    return {
      isVerified: false,
      syncStatus: 'PENDING',
    };
  }

  async checkOut(attendanceId: string): Promise<any> {
    return firstValueFrom(
      this.http.patch(
        `${environment.apiUrl}/api/attendance/${attendanceId}/check-out`,
        {},
      ),
    );
  }

  async getHistory(): Promise<AttendanceRecord[]> {
    return firstValueFrom(
      this.http.get<AttendanceRecord[]>(
        `${environment.apiUrl}/api/attendance`,
      ),
    );
  }

  async getToday(): Promise<AttendanceRecord[]> {
    return firstValueFrom(
      this.http.get<AttendanceRecord[]>(
        `${environment.apiUrl}/api/attendance/today`,
      ),
    );
  }

  private base64ToBlob(base64: string, contentType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays: Uint8Array[] = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    return new Blob(byteArrays, { type: contentType });
  }
}
