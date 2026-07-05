import { Component, signal } from '@angular/core';
import { AuthService } from './core/services/auth';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App {
  
  isAuth$!: Observable<boolean>;

  protected readonly title = signal('MerkaMundo');

  constructor(private authService: AuthService) {
  
    this.isAuth$ = this.authService.isLoggedIn();

    if(this.isAuth$) { 
      this.authService.signalSyncLogin();      
    }
  }

}
