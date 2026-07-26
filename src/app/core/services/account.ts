import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';
import { LoginDTO } from '../../shared/model/account/login-dto';
import { ResponseDTO } from '../../shared/model/common/http/response-dto';
import { AccountDTO } from '../../shared/model/account/account-dto';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private URL_CORE: string = environment.URL_CORE;

constructor(private authService: AuthService, private http: HttpClient,
    private cookies: CookieService,
    private router: Router) {}
  /*
  getVersion(): Observable<ResponseBase<VersionResponse>> {  

    return this.http.get<ResponseBase<VersionResponse>>
                (this.URL_CORE + '/api/AvadPQ/Version/portalweb', {

                });
    
  }*/


  login(credentiales: LoginDTO): Observable<ResponseDTO<AccountDTO>> {
    return this.http.post<ResponseDTO<AccountDTO>>
                        (this.URL_CORE + '/api/account/login', credentiales);

  }

  logout(): void {
    this.authService.logout();
  }

  

}