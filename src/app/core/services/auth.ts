import { Injectable } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Usamos BehaviorSubject para emitir el estado actual a la Navbar en tiempo real
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  
  constructor(private cookies: CookieService) {}

  public hasToken(): boolean {
    
    return (this.getToken()!=null && this.getToken()!="");
  }

  // Expone el estado como un Observable para los componentes
  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  login(): void {
    this.cookies.deleteAll();
    this.cookies.set("userId", "");
    this.cookies.set("userName", "");
    this.cookies.set("roles", "");
    this.cookies.set("token", "fake-jwt-token"); 
    this.loggedIn.next(this.hasToken());
  }

  signalSyncLogin(): void {
    this.loggedIn.next(this.hasToken());
  }

  logout(): void {
    this.cookies.deleteAll();
    this.cookies.set("userId", "");
    this.cookies.set("userName", "");
    this.cookies.set("roles", "");
    this.cookies.set("token", ""); 
    this.loggedIn.next(this.hasToken());
  }


  
  getRoles(): string[]{
    
    return this.cookies.get("roles").split(';'); 
  }

  getUserId() {
    return this.cookies.get("userId"); 
  }

  getUserName() {
    
    return this.cookies.get("userName"); 
  }
  

  getToken() {    
    try {
      var token = this.cookies.get("token");  
      if (token==null || token=="") {
        return null;
      }
      return token;

    } catch (error) {
      return null;
    }
  }


  
  setRoles(roles: string[]) {
    this.cookies.set("roles", roles.join(';'));
  }

}
