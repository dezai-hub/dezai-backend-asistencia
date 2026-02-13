import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonRefresher,
  IonRefresherContent,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trashOutline } from 'ionicons/icons';
import { WorkerService } from '../../services/worker.service';
import { Worker } from '../../models/worker.model';

@Component({
  selector: 'app-workers',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonFab,
    IonFabButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonCard,
    IonCardContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonRefresher,
    IonRefresherContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Trabajadores</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" (ionRefresh)="onRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      @if (isLoading) {
        <div class="loading-container">
          <ion-spinner name="crescent"></ion-spinner>
        </div>
      } @else if (workers.length === 0) {
        <ion-card>
          <ion-card-content>
            <ion-text color="medium">
              <p class="empty-text">
                No hay trabajadores registrados.
                Toca el boton + para agregar uno.
              </p>
            </ion-text>
          </ion-card-content>
        </ion-card>
      } @else {
        <ion-list>
          @for (worker of workers; track worker.id) {
            <ion-item-sliding>
              <ion-item>
                <ion-avatar slot="start">
                  @if (worker.photoUrl) {
                    <img [src]="worker.photoUrl" [alt]="worker.name" />
                  } @else {
                    <div class="avatar-placeholder">
                      {{ worker.name.charAt(0).toUpperCase() }}
                    </div>
                  }
                </ion-avatar>
                <ion-label>
                  <h2>{{ worker.name }}</h2>
                  <p>{{ worker.role }}</p>
                </ion-label>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option
                  color="danger"
                  (click)="onDeleteWorker(worker)"
                >
                  <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          }
        </ion-list>
      }

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="goToNewWorker()">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
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

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--ion-color-primary);
      color: white;
      font-size: 20px;
      font-weight: 700;
      border-radius: 50%;
    }
  `],
})
export class WorkersPage implements OnInit {
  workers: Worker[] = [];
  isLoading = true;

  constructor(
    private workerService: WorkerService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
  ) {
    addIcons({ add, trashOutline });
  }

  async ngOnInit() {
    await this.loadWorkers();
  }

  async loadWorkers() {
    this.isLoading = true;
    try {
      this.workers = await this.workerService.getWorkers();
    } catch {
      // Handle offline - show empty
    } finally {
      this.isLoading = false;
    }
  }

  async onRefresh(event: any) {
    await this.loadWorkers();
    event.target.complete();
  }

  goToNewWorker() {
    this.router.navigateByUrl('/workers/new');
  }

  async onDeleteWorker(worker: Worker) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar trabajador',
      message: `¿Seguro que deseas eliminar a ${worker.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              await this.workerService.deleteWorker(worker.id);
              this.workers = this.workers.filter((w) => w.id !== worker.id);
              const toast = await this.toastCtrl.create({
                message: 'Trabajador eliminado',
                duration: 2000,
                color: 'success',
              });
              await toast.present();
            } catch {
              const toast = await this.toastCtrl.create({
                message: 'Error al eliminar',
                duration: 2000,
                color: 'danger',
              });
              await toast.present();
            }
          },
        },
      ],
    });
    await alert.present();
  }
}
