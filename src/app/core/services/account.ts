import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root',
})
export class AccountService {

  constructor(private authService: AuthService, private http: HttpClient,
    private cookies: CookieService,
    private router: Router) {}


  login(): void {
    this.authService.login();

  }

  logout(): void {
    this.authService.logout();
  }

  

}