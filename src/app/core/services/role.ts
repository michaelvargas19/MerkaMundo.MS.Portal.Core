import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth';
import { ResponseDTO } from '../../shared/model/common/http/response-dto';
import { AspNetActionRoleDTO } from '../../shared/model/account/asp-net-action-role-dto';
import { AspNetRolesDTO } from '../../shared/model/account/asp-net-roles-dto';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private URL_CORE: string = environment.URL_CORE;

  constructor(private authService: AuthService, private http: HttpClient) {}

  assignActionToRole(actionRole: AspNetActionRoleDTO): Observable<ResponseDTO<AspNetActionRoleDTO>> {
    return this.http.post<ResponseDTO<AspNetActionRoleDTO>>(
      this.URL_CORE + '/api/account/actions/role',
      actionRole,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  syncActionStatus(actionRole: AspNetActionRoleDTO): Observable<ResponseDTO<AspNetActionRoleDTO>> {
    return this.http.post<ResponseDTO<AspNetActionRoleDTO>>(
      this.URL_CORE + '/api/account/actions/role/status',
      actionRole,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  list(): Observable<ResponseDTO<AspNetRolesDTO[]>> {
    return this.http.get<ResponseDTO<AspNetRolesDTO[]>>(
      this.URL_CORE + '/api/account/roles',
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }
}
