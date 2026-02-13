import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'attendance',
        loadComponent: () =>
          import('./pages/attendance/attendance.page').then(
            (m) => m.AttendancePage,
          ),
      },
      {
        path: 'workers',
        loadComponent: () =>
          import('./pages/workers/workers.page').then((m) => m.WorkersPage),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/history/history.page').then((m) => m.HistoryPage),
      },
      { path: '', redirectTo: 'attendance', pathMatch: 'full' },
    ],
  },
  {
    path: 'workers/new',
    loadComponent: () =>
      import('./pages/worker-form/worker-form.page').then(
        (m) => m.WorkerFormPage,
      ),
    canActivate: [authGuard],
  },
];
