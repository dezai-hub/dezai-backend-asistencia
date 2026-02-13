import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Worker } from '../models/worker.model';

@Injectable({ providedIn: 'root' })
export class WorkerService {
  constructor(private http: HttpClient) {}

  async createWorker(
    name: string,
    role: string,
    photoBase64: string,
  ): Promise<Worker> {
    const blob = this.base64ToBlob(photoBase64, 'image/jpeg');
    const formData = new FormData();
    formData.append('name', name);
    formData.append('role', role);
    formData.append('photo', blob, 'worker.jpg');

    return firstValueFrom(
      this.http.post<Worker>(`${environment.apiUrl}/api/workers`, formData),
    );
  }

  async getWorkers(): Promise<Worker[]> {
    return firstValueFrom(
      this.http.get<Worker[]>(`${environment.apiUrl}/api/workers`),
    );
  }

  async deleteWorker(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete(`${environment.apiUrl}/api/workers/${id}`),
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
