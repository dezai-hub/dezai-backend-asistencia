import { Component, OnInit } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { camera, people, time } from 'ionicons/icons';
import { DatabaseService } from '../../services/database.service';
import { SyncService } from '../../services/sync.service';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="attendance">
          <ion-icon name="camera"></ion-icon>
          <ion-label>Asistencia</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="workers">
          <ion-icon name="people"></ion-icon>
          <ion-label>Trabajadores</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="history">
          <ion-icon name="time"></ion-icon>
          <ion-label>Historial</ion-label>
          @if (pendingCount > 0) {
            <ion-badge color="danger">{{ pendingCount }}</ion-badge>
          }
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage implements OnInit {
  pendingCount = 0;

  constructor(
    private db: DatabaseService,
    private syncService: SyncService,
  ) {
    addIcons({ camera, people, time });
  }

  async ngOnInit() {
    await this.db.initializeDatabase();
    await this.syncService.startListening();
    this.pendingCount = await this.db.getPendingCount();
  }
}
