import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../../environments/environment';
import { ResponseDTO } from '../../shared/model/common/http/response-dto';
import { CatalogProductDto } from '../../shared/model/catalog/catalog-product-dto';
import { CatalogProductPriceDto } from '../../shared/model/catalog/catalog-product-price-dto';


@Injectable({
  providedIn: 'root',
})
export class ProductService {

  private URL_CORE: string = environment.URL_CORE;

constructor(private authService: AuthService, private http: HttpClient) {}


  getProductByBarCode(barcode: string): Observable<ResponseDTO<CatalogProductDto>> {

    return this.http.get<ResponseDTO<CatalogProductDto>>(this.URL_CORE + '/api/product/barcode/'+barcode,
    {
      headers:{
        Authorization:'Bearer ' + this.authService.getToken()
      }
    });
  }

  updateProduct(product: unknown): Observable<ResponseDTO<CatalogProductDto>> {
    return this.http.put<ResponseDTO<CatalogProductDto>>(
      this.URL_CORE + '/api/product/update',
      product,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }

  updateProductPrice(price: unknown): Observable<ResponseDTO<CatalogProductPriceDto>> {
    return this.http.put<ResponseDTO<CatalogProductPriceDto>>(
      this.URL_CORE + '/api/product-price/update',
      price,
      {
        headers: {
          Authorization: 'Bearer ' + this.authService.getToken(),
        },
      }
    );
  }
  
}