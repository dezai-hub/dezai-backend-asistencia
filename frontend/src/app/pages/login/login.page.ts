import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonSpinner,
    IonText,
    IonIcon,
  ],
  template: `
    <ion-content class="ion-padding">
      <div class="login-container">
        <div class="logo-section">
          <ion-icon name="log-in-outline" class="logo-icon"></ion-icon>
          <h1>Dezai Checador</h1>
          <p>Asistencia con reconocimiento facial</p>
        </div>

        <div class="form-section">
          <ion-item>
            <ion-input
              label="Correo electronico"
              labelPlacement="floating"
              type="email"
              [(ngModel)]="email"
              [disabled]="isLoading"
            ></ion-input>
          </ion-item>

          <ion-item>
            <ion-input
              label="Contrasena"
              labelPlacement="floating"
              type="password"
              [(ngModel)]="password"
              [disabled]="isLoading"
            ></ion-input>
          </ion-item>

          @if (errorMessage) {
            <ion-text color="danger">
              <p class="error-text">{{ errorMessage }}</p>
            </ion-text>
          }

          <ion-button
            expand="block"
            (click)="onLogin()"
            [disabled]="isLoading || !email || !password"
            class="login-btn"
          >
            @if (isLoading) {
              <ion-spinner name="crescent"></ion-spinner>
            } @else {
              Iniciar Sesion
            }
          </ion-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 80vh;
      max-width: 400px;
      margin: 0 auto;
    }

    .logo-section {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo-icon {
      font-size: 64px;
      color: var(--ion-color-primary);
    }

    .logo-section h1 {
      margin: 16px 0 4px;
      font-size: 28px;
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    .logo-section p {
      margin: 0;
      color: var(--ion-color-medium);
      font-size: 14px;
    }

    .form-section ion-item {
      margin-bottom: 12px;
      --border-radius: 8px;
    }

    .error-text {
      text-align: center;
      font-size: 14px;
      padding: 8px;
    }

    .login-btn {
      margin-top: 24px;
      --border-radius: 8px;
      height: 48px;
      font-weight: 600;
    }
  `],
})
export class LoginPage {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ logInOutline });
  }

  async onLogin() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigateByUrl('/tabs', { replaceUrl: true });
    } catch (error: any) {
      this.errorMessage =
        error?.error?.message || 'Credenciales invalidas. Intente de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }
}
