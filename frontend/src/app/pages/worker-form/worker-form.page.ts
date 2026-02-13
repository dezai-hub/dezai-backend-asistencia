import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonBackButton,
  IonButtons,
  IonImg,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cameraOutline, saveOutline } from 'ionicons/icons';
import { Network } from '@capacitor/network';
import { CameraService } from '../../services/camera.service';
import { WorkerService } from '../../services/worker.service';

@Component({
  selector: 'app-worker-form',
  standalone: true,
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonBackButton,
    IonButtons,
    IonImg,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/workers"></ion-back-button>
        </ion-buttons>
        <ion-title>Registrar Trabajador</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!isOnline) {
        <ion-text color="warning">
          <p class="offline-warning">
            Se requiere conexion a internet para registrar trabajadores.
          </p>
        </ion-text>
      }

      <ion-item>
        <ion-input
          label="Nombre completo"
          labelPlacement="floating"
          [(ngModel)]="name"
          [disabled]="isLoading || !isOnline"
        ></ion-input>
      </ion-item>

      <ion-item>
        <ion-input
          label="Puesto de trabajo"
          labelPlacement="floating"
          [(ngModel)]="role"
          placeholder="Ej: Electricista, Albanil"
          [disabled]="isLoading || !isOnline"
        ></ion-input>
      </ion-item>

      <!-- Photo Capture -->
      <div class="photo-section">
        @if (photoBase64) {
          <ion-img
            [src]="'data:image/jpeg;base64,' + photoBase64"
            class="photo-preview"
          ></ion-img>
          <ion-button
            fill="outline"
            size="small"
            (click)="takePhoto()"
            [disabled]="isLoading || !isOnline"
          >
            <ion-icon name="camera-outline" slot="start"></ion-icon>
            Retomar foto
          </ion-button>
        } @else {
          <ion-button
            expand="block"
            fill="outline"
            (click)="takePhoto()"
            [disabled]="isLoading || !isOnline"
            class="take-photo-btn"
          >
            <ion-icon name="camera-outline" slot="start"></ion-icon>
            Tomar foto del rostro
          </ion-button>
        }
      </div>

      @if (errorMessage) {
        <ion-text color="danger">
          <p class="error-text">{{ errorMessage }}</p>
        </ion-text>
      }

      <ion-button
        expand="block"
        (click)="onSubmit()"
        [disabled]="isLoading || !isOnline || !name || !role || !photoBase64"
        class="submit-btn"
      >
        @if (isLoading) {
          <ion-spinner name="crescent"></ion-spinner>
        } @else {
          <ion-icon name="save-outline" slot="start"></ion-icon>
          Registrar Trabajador
        }
      </ion-button>
    </ion-content>
  `,
  styles: [`
    .offline-warning {
      text-align: center;
      padding: 16px;
      background: var(--ion-color-warning-tint);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .photo-section {
      margin: 24px 0;
      text-align: center;
    }

    .photo-preview {
      max-width: 250px;
      margin: 0 auto 12px;
      border-radius: 12px;
      overflow: hidden;
    }

    .take-photo-btn {
      height: 120px;
      --border-style: dashed;
      font-size: 16px;
    }

    .error-text {
      text-align: center;
      font-size: 14px;
      padding: 8px;
    }

    .submit-btn {
      margin-top: 24px;
      --border-radius: 8px;
      height: 48px;
      font-weight: 600;
    }
  `],
})
export class WorkerFormPage {
  name = '';
  role = '';
  photoBase64 = '';
  isLoading = false;
  isOnline = true;
  errorMessage = '';

  constructor(
    private cameraService: CameraService,
    private workerService: WorkerService,
    private router: Router,
    private toastCtrl: ToastController,
  ) {
    addIcons({ cameraOutline, saveOutline });
    this.checkNetwork();
  }

  private async checkNetwork() {
    const status = await Network.getStatus();
    this.isOnline = status.connected;
  }

  async takePhoto() {
    try {
      this.photoBase64 = await this.cameraService.takePhoto();
    } catch (error: any) {
      this.errorMessage = 'Error al capturar la foto';
    }
  }

  async onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.workerService.createWorker(
        this.name,
        this.role,
        this.photoBase64,
      );

      const toast = await this.toastCtrl.create({
        message: 'Trabajador registrado exitosamente',
        duration: 2000,
        color: 'success',
        position: 'top',
      });
      await toast.present();

      this.router.navigateByUrl('/tabs/workers', { replaceUrl: true });
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message ||
        'Error al registrar trabajador. Verifique que el rostro sea visible.';
    } finally {
      this.isLoading = false;
    }
  }
}
