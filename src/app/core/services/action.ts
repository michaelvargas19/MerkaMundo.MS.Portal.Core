import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';
import { ResponseDTO } from '../../shared/model/common/http/response-dto';
import { AspNetActionDTO } from '../../shared/model/account/asp-net-action-dto';

@Injectable({
  providedIn: 'root',
})
export class ActionService {
  private URL_CORE: string = environment.URL_CORE;

  constructor(private authService: AuthService, private http: HttpClient) {}

  add(action: AspNetActionDTO): Observable<ResponseDTO<AspNetActionDTO>> {
    return this.http.post<ResponseDTO<AspNetActionDTO>>(
      this.URL_CORE + '/api/account/action',
      action,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  update(id: number, action: AspNetActionDTO): Observable<ResponseDTO<AspNetActionDTO>> {
    return this.http.put<ResponseDTO<AspNetActionDTO>>(
      this.URL_CORE + '/api/account/action/' + id,
      action,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  list(): Observable<ResponseDTO<AspNetActionDTO[]>> {
    return this.http.get<ResponseDTO<AspNetActionDTO[]>>(
      this.URL_CORE + '/api/account/actions',
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }
}
