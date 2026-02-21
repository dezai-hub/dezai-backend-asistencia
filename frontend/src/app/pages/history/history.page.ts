import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonIcon,
  IonBadge,
  IonButton,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  alertCircle,
  syncOutline,
  locationOutline,
} from 'ionicons/icons';
import { AttendanceService } from '../../services/attendance.service';
import { SyncService } from '../../services/sync.service';
import { DatabaseService } from '../../services/database.service';
import { AttendanceRecord } from '../../models/attendance.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonIcon,
    IonBadge,
    IonButton,
    IonSpinner,
    IonText,
    IonCard,
    IonCardContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Historial</ion-title>
        <ion-button
          slot="end"
          fill="clear"
          color="light"
          (click)="onSync()"
          [disabled]="isSyncing"
        >
          @if (isSyncing) {
            <ion-spinner name="crescent" color="light"></ion-spinner>
          } @else {
            <ion-icon name="sync-outline"></ion-icon>
            @if (pendingCount > 0) {
              <ion-badge color="danger">{{ pendingCount }}</ion-badge>
            }
          }
        </ion-button>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-segment [(ngModel)]="selectedSegment" (ionChange)="onSegmentChange()">
        <ion-segment-button value="today">
          <ion-label>Hoy</ion-label>
        </ion-segment-button>
        <ion-segment-button value="all">
          <ion-label>Todo</ion-label>
        </ion-segment-button>
      </ion-segment>

      @if (isLoading) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (records.length === 0) {
        <ion-card>
          <ion-card-content>
            <ion-text color="medium">
              <p class="empty-text">No hay registros</p>
            </ion-text>
          </ion-card-content>
        </ion-card>
      } @else {
        <ion-list>
          @for (record of records; track record.id) {
            <ion-item>
              <ion-icon
                [name]="record.isVerified ? 'checkmark-circle' : 'alert-circle'"
                [color]="record.isVerified ? 'success' : 'warning'"
                slot="start"
              ></ion-icon>
              <ion-label>
                <h2>{{ record.workerName || 'Trabajador' }}</h2>
                <p>
                  {{ record.checkInTime | date:'short' }}
                  @if (record.checkOutTime) {
                    - {{ record.checkOutTime | date:'shortTime' }}
                  }
                </p>
                <p class="gps-text">
                  <ion-icon name="location-outline"></ion-icon>
                  {{ record.gpsLat | number:'1.4-4' }}, {{ record.gpsLong | number:'1.4-4' }}
                </p>
              </ion-label>
              <ion-badge
                slot="end"
                [color]="record.syncStatus === 'SYNCED' ? 'success' : 'warning'"
              >
                {{ record.syncStatus === 'SYNCED' ? 'Sincronizado' : 'Pendiente' }}
              </ion-badge>
            </ion-item>
          }
        </ion-list>
      }
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .empty-text {
      text-align: center;
      padding: 24px;
    }

    .gps-text {
      font-size: 12px;
      color: var(--ion-color-medium);
      display: flex;
      align-items: center;
      gap: 4px;
    }

    ion-segment {
      padding: 8px;
    }
  `],
})
export class HistoryPage implements OnInit {
  records: AttendanceRecord[] = [];
  selectedSegment = 'today';
  isLoading = true;
  isSyncing = false;
  pendingCount = 0;

  constructor(
    private attendanceService: AttendanceService,
    private syncService: SyncService,
    private db: DatabaseService,
    private toastCtrl: ToastController,
  ) {
    addIcons({ checkmarkCircle, alertCircle, syncOutline, locationOutline });
  }

  async ngOnInit() {
    await this.loadRecords();
    this.pendingCount = await this.db.getPendingCount();
  }

  async onSegmentChange() {
    await this.loadRecords();
  }

  async loadRecords() {
    this.isLoading = true;
    try {
      if (this.selectedSegment === 'today') {
        this.records = await this.attendanceService.getToday();
      } else {
        this.records = await this.attendanceService.getHistory();
      }
    } catch {
      this.records = [];
    } finally {
      this.isLoading = false;
    }
  }

  async onSync() {
    this.isSyncing = true;
    try {
      const synced = await this.syncService.syncPendingRecords();
      this.pendingCount = await this.db.getPendingCount();

      const toast = await this.toastCtrl.create({
        message:
          synced > 0
            ? `${synced} registros sincronizados`
            : 'No hay registros pendientes',
        duration: 2000,
        color: synced > 0 ? 'success' : 'medium',
        position: 'top',
      });
      await toast.present();

      await this.loadRecords();
    } catch {
      const toast = await this.toastCtrl.create({
        message: 'Error al sincronizar',
        duration: 2000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    } finally {
      this.isSyncing = false;
    }
  }
}
