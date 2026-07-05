import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isLoggedIn().pipe(
    take(1),
    map(isLogged => {
      if (isLogged) {
        return true; // Permite el acceso a la ruta
      } else {
        // Redirige al login si no está autenticado
        //router.navigate(['/login']);
        return false;
      }
    })
  );
};