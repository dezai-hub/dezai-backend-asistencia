import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  IonText,
  IonCard,
  IonCardContent,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkCircle,
  alertCircle,
  wifiOutline,
  cloudOfflineOutline,
} from 'ionicons/icons';
import { Network } from '@capacitor/network';
import { AttendanceService } from '../../services/attendance.service';
import { AttendanceRecord } from '../../models/attendance.model';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    IonText,
    IonCard,
    IonCardContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Asistencia</ion-title>
        <div slot="end" class="connection-status">
          @if (isOnline) {
            <ion-chip color="success">
              <ion-icon name="wifi-outline"></ion-icon>
              <ion-label>En linea</ion-label>
            </ion-chip>
          } @else {
            <ion-chip color="warning">
              <ion-icon name="cloud-offline-outline"></ion-icon>
              <ion-label>Sin conexion</ion-label>
            </ion-chip>
          }
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Camera Check-in Button -->
      <div class="checkin-section">
        <ion-button
          (click)="onCheckIn()"
          [disabled]="isLoading"
          shape="round"
          size="large"
          class="camera-btn"
        >
          @if (isLoading) {
            <ion-spinner name="crescent"></ion-spinner>
          } @else {
            <ion-icon name="camera-outline" slot="icon-only"></ion-icon>
          }
        </ion-button>
        <p class="hint-text">Toca para registrar entrada</p>
      </div>

      <!-- Today's Records -->
      <h3 class="section-title">Registros de hoy</h3>
      @if (todayRecords.length === 0) {
        <ion-card>
          <ion-card-content>
            <ion-text color="medium">
              <p class="empty-text">No hay registros para hoy</p>
            </ion-text>
          </ion-card-content>
        </ion-card>
      } @else {
        <ion-list>
          @for (record of todayRecords; track record.id) {
            <ion-item>
              <ion-icon
                [name]="record.isVerified ? 'checkmark-circle' : 'alert-circle'"
                [color]="record.isVerified ? 'success' : 'warning'"
                slot="start"
              ></ion-icon>
              <ion-label>
                <h2>{{ record.workerName || 'Trabajador' }}</h2>
                <p>Entrada: {{ record.checkInTime | date:'shortTime' }}</p>
                @if (record.checkOutTime) {
                  <p>Salida: {{ record.checkOutTime | date:'shortTime' }}</p>
                }
              </ion-label>
              @if (!record.checkOutTime && record.syncStatus === 'SYNCED') {
                <ion-button
                  fill="outline"
                  size="small"
                  slot="end"
                  (click)="onCheckOut(record.id)"
                >
                  Salida
                </ion-button>
              }
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .connection-status {
      padding-right: 8px;
    }

    .checkin-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0;
    }

    .camera-btn {
      --border-radius: 50%;
      width: 120px;
      height: 120px;
      font-size: 48px;
    }

    .hint-text {
      margin-top: 16px;
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      padding: 0 4px;
      margin-top: 16px;
    }

    .empty-text {
      text-align: center;
      padding: 16px;
    }
  `],
})
export class AttendancePage implements OnInit {
  isOnline = true;
  isLoading = false;
  todayRecords: AttendanceRecord[] = [];

  constructor(
    private attendanceService: AttendanceService,
    private toastCtrl: ToastController,
  ) {
    addIcons({
      cameraOutline,
      checkmarkCircle,
      alertCircle,
      wifiOutline,
      cloudOfflineOutline,
    });
  }

  async ngOnInit() {
    const status = await Network.getStatus();
    this.isOnline = status.connected;

    Network.addListener('networkStatusChange', (s) => {
      this.isOnline = s.connected;
    });

    await this.loadTodayRecords();
  }

  async onCheckIn() {
    this.isLoading = true;
    try {
      const result = await this.attendanceService.checkIn();

      if (result.isVerified) {
        await this.showToast(
          `Entrada registrada: ${result.workerName}`,
          'success',
        );
      } else {
        await this.showToast(
          'Guardado localmente. Se sincronizara al conectarse.',
          'warning',
        );
      }

      await this.loadTodayRecords();
    } catch (error: any) {
      await this.showToast(
        error?.error?.message || 'Error al registrar asistencia',
        'danger',
      );
    } finally {
      this.isLoading = false;
    }
  }

  async onCheckOut(attendanceId: string) {
    try {
      await this.attendanceService.checkOut(attendanceId);
      await this.showToast('Salida registrada', 'success');
      await this.loadTodayRecords();
    } catch {
      await this.showToast('Error al registrar salida', 'danger');
    }
  }

  private async loadTodayRecords() {
    try {
      if (this.isOnline) {
        this.todayRecords = await this.attendanceService.getToday();
      }
    } catch {
      // Silently fail - records will show when online
    }
  }

  private async showToast(
    message: string,
    color: 'success' | 'warning' | 'danger',
  ) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    await toast.present();
  }
}
