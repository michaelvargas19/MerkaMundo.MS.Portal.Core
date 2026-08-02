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
  isAuth$!: Observable<boolean>;
  userName = '';
  roles: string[] = [];

  constructor(private authService: AuthService, private accountService: AccountService, private router: Router) {
    this.isAuth$ = this.authService.isLoggedIn();
  }

  ngOnInit(): void {
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.userName = this.authService.getUserName() || '';
        this.roles = this.authService.getRoles().filter(r => r);
      } else {
        this.userName = '';
        this.roles = [];
      }
    });
  }

  onLogout(): void {
    this.accountService.logout();
    this.router.navigate(['/login']);
  }
}
