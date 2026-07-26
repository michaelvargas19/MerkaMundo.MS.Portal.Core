import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';
import { AccountService } from '../../../core/services/account';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  // El signo '$' al final es una convención en Angular para identificar que es un Observable
  isAuth$!: Observable<boolean>;

  constructor(private authService: AuthService, private accountService: AccountService, private router: Router) {    
    // Vinculamos la variable directamente al Observable del servicio.
    // El pipe '| async' en el HTML se encargará de suscribirse y desuscribirse automáticamente.
    this.isAuth$ = this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        //this.router.navigate(['/home']);
      }else {
        //this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Cierra la sesión destruyendo el token y redirige al usuario a la pantalla de Login.
   */
  onLogout(): void {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
  }
