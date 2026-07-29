import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment.development';
import { AuthService } from './auth';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { SaleDto } from '../../shared/model/sales/sale-dto';
import { ResponseDTO } from '../../shared/model/common/http/response-dto';

@Injectable({
  providedIn: 'root',
})
export class SaleService {

private URL_CORE: string = environment.URL_CORE;

constructor(private authService: AuthService, private http: HttpClient,
    private cookies: CookieService,
    private router: Router) {}


  create(sale:SaleDto): Observable<ResponseDTO<SaleDto>> {  
    return this.http.post<ResponseDTO<SaleDto>>(
      this.URL_CORE+'/api/sale/create', 
      sale, 
      {
      headers:{
        Authorization:'Bearer ' + this.authService.getToken()
      }
    });
  }

  getById(saleId: number): Observable<ResponseDTO<SaleDto>> {
    return this.http.get<ResponseDTO<SaleDto>>(
      this.URL_CORE + '/api/sale/' + saleId,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken()
        }
      }
    ).pipe(
      catchError(() => this.http.get<ResponseDTO<SaleDto>>(
        this.URL_CORE + '/api/sale/get/' + saleId,
        {
          headers: {
            Authorization: 'Bearer ' + this.authService.getToken()
          }
        }
      )),
      catchError(() => this.http.get<ResponseDTO<SaleDto>>(
        this.URL_CORE + '/api/sale/getbyid/' + saleId,
        {
          headers: {
            Authorization: 'Bearer ' + this.authService.getToken()
          }
        }
      ))
    );
  }

  update(sale: SaleDto): Observable<ResponseDTO<SaleDto>> {
    return this.http.put<ResponseDTO<SaleDto>>(
      this.URL_CORE + '/api/sale/update',
      sale,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken()
        }
      }
    );
  }

  listByDates(dateFrom: string, dateTo: string): Observable<ResponseDTO<SaleDto[]>> {
    return this.http.get<ResponseDTO<SaleDto[]>>(
      this.URL_CORE + `/api/sale/list?dateFrom=${dateFrom}&dateTo=${dateTo}`,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken()
        }
      }
    );
  }

  generateLargePdf(saleId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(this.URL_CORE + '/api/sale/pdf/large/' + saleId, {
      headers: {
        Authorization: 'Bearer ' + this.authService.getToken(),
        Accept: 'application/pdf, application/octet-stream, text/html'
      },
      responseType: 'blob',
      observe: 'response'
    });
  }

  generatePosPdf(saleId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(this.URL_CORE + '/api/sale/pdf/pos/' + saleId, {
      headers: {
        Authorization: 'Bearer ' + this.authService.getToken(),
        Accept: 'application/pdf, application/octet-stream, text/html'
      },
      responseType: 'blob',
      observe: 'response'
    });
  }

}
