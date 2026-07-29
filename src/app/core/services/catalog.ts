import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';
import { ResponseDTO } from '../../shared/model/common/http/response-dto';
import { CatalogDto } from '../../shared/model/catalog/catalog-dto';
import { CatalogProductDto } from '../../shared/model/catalog/catalog-product-dto';
import { CatalogSummaryDto } from '../../shared/model/catalog/catalog-summary-dto';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private URL_CORE: string = environment.URL_CORE;

  constructor(private authService: AuthService, private http: HttpClient) {}

  getCatalogById(catalogId: number): Observable<ResponseDTO<CatalogDto>> {
    return this.http.get<ResponseDTO<CatalogDto>>(
      this.URL_CORE + '/api/catalog/' + catalogId,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  getProductsByCatalogId(
    catalogId: number,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<ResponseDTO<CatalogProductDto[]>> {
    return this.http.get<ResponseDTO<CatalogProductDto[]>>(
      this.URL_CORE + '/api/catalog/' + catalogId + '/products?pageNumber=' + pageNumber + '&pageSize=' + pageSize,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  getAllProductsByCatalogId(
    catalogId: number,
    pageNumber: number = 1,
    pageSize: number = 10
  ): Observable<ResponseDTO<CatalogProductDto[]>> {
    return this.http.get<ResponseDTO<CatalogProductDto[]>>(
      this.URL_CORE + '/api/catalog/' + catalogId + '/products/all?pageNumber=' + pageNumber + '&pageSize=' + pageSize,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  getCatalogStatusSummaryById(catalogId: number): Observable<ResponseDTO<CatalogSummaryDto>> {
    return this.http.get<ResponseDTO<CatalogSummaryDto>>(
      this.URL_CORE + '/api/catalog/status/summary/' + catalogId,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  addProductToCatalog(product: unknown): Observable<ResponseDTO<CatalogProductDto>> {
    return this.http.post<ResponseDTO<CatalogProductDto>>(
      this.URL_CORE + '/api/Product/add',
      product,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }
}
