import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthPocketbaseService } from './app/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthPocketbaseService);
  const router = inject(Router);

  // Si no hay sesión válida → redirigir al login
  if (!auth.isLoggedIn) {
    router.navigate(['/home']);
    return false;
  }

  return true;
};
