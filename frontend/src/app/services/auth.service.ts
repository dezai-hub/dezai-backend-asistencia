import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

interface AuthResponse {
  accessToken: string;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: 'ADMIN' | 'RESIDENT';
  exp: number;
}

const TOKEN_KEY = 'auth_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal(false);
  private token: string | null = null;

  constructor(private http: HttpClient) {
    this.loadToken();
  }

  private async loadToken(): Promise<void> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    if (value) {
      this.token = value;
      this.isAuthenticated.set(true);
    }
  }

  async login(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/login`, {
        email,
        password,
      }),
    );
    await this.setToken(res.accessToken);
  }

  async register(
    name: string,
    email: string,
    password: string,
    role?: string,
  ): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/api/auth/register`, {
        name,
        email,
        password,
        role,
      }),
    );
    await this.setToken(res.accessToken);
  }

  private async setToken(token: string): Promise<void> {
    this.token = token;
    this.isAuthenticated.set(true);
    await Preferences.set({ key: TOKEN_KEY, value: token });
  }

  getToken(): string | null {
    return this.token;
  }

  getUserRole(): 'ADMIN' | 'RESIDENT' | null {
    const payload = this.decodeToken();
    return payload?.role ?? null;
  }

  getUserId(): string | null {
    const payload = this.decodeToken();
    return payload?.sub ?? null;
  }

  private decodeToken(): JwtPayload | null {
    if (!this.token) return null;
    try {
      const payload = this.token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    this.token = null;
    this.isAuthenticated.set(false);
    await Preferences.remove({ key: TOKEN_KEY });
  }
}
