import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';
import { ResponseDTO } from '../../shared/model/common/http/response-dto';

@Injectable({
  providedIn: 'root',
})
export class Customer {
  private URL_CORE: string = environment.URL_CORE;

  constructor(private authService: AuthService, private http: HttpClient) {}

  getCustomerTypeList(): Observable<ResponseDTO<any[]>> {
    return this.http.get<ResponseDTO<any[]>>(
      this.URL_CORE + '/api/customer-type/list',
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }
}
