import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../../core/services/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

  isAuth$!: Observable<boolean>;
  
  constructor(private authService: AuthService,private router: Router) {
    
    this.isAuth$ = this.authService.isLoggedIn();

  }
  
}
