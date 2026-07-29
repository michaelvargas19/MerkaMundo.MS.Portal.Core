import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogService } from '../../../../core/services/catalog';
import { ResponseDTO } from '../../../../shared/model/common/http/response-dto';
import { CatalogProductDto } from '../../../../shared/model/catalog/catalog-product-dto';
import { CatalogDto } from '../../../../shared/model/catalog/catalog-dto';
import { CatalogSummaryDto } from '../../../../shared/model/catalog/catalog-summary-dto';

@Component({
  selector: 'app-catalog',
  standalone: false,
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog implements OnInit, AfterViewInit {
  public catalogDetail: CatalogDto | null = null;
  public catalogSummary: CatalogSummaryDto | null = null;
  public products: CatalogProductDto[] = [];
  public isLoadingCatalog = true;
  public viewMessage: string | null = null;
  public hasError = false;
  public pageNumber = 1;
  public pageSize = 10;
  public selectedCatalogId: number | null = null;
  public totalProductsCount = 0;
  public isSavingProduct = false;
  public isProductFormActive = false;
  private currentCatalogId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private cdr: ChangeDetectorRef
  ) {
    const initialCatalogId = this.resolveCatalogIdFromSnapshot();
    if (initialCatalogId > 0) {
      this.currentCatalogId = initialCatalogId;
      this.selectedCatalogId = initialCatalogId;
    }
  }

  ngOnInit(): void {
    this.isProductFormActive = false;
    this.deferUiState(() => {
      this.loadFromRouteIfValid(this.resolveCatalogIdFromSnapshot());
    });

    const paramMapSource = this.route.parent ? this.route.parent.paramMap : this.route.paramMap;

    paramMapSource.subscribe(paramMap => {
      const routeId = Number(paramMap.get('id') || 0);
      this.deferUiState(() => {
        this.loadFromRouteIfValid(routeId);
      });
    });
  }

  ngAfterViewInit(): void {
    this.deferUiState(() => {
      this.cdr.detectChanges();
    });
  }

  private resolveCatalogIdFromSnapshot(): number {
    const ownId = Number(this.route.snapshot.paramMap.get('id') || 0);
    if (ownId > 0) {
      return ownId;
    }

    const parentId = Number(this.route.parent?.snapshot.paramMap.get('id') || 0);
    return parentId;
  }

  private loadFromRouteIfValid(routeId: number): void {
    if (!routeId || routeId <= 0) {
      this.isProductFormActive = false;
      this.currentCatalogId = null;
      this.selectedCatalogId = null;
      this.hasError = true;
      this.viewMessage = 'El id del catalogo debe llegar por la URL, por ejemplo: /catalog/1';
      this.catalogDetail = null;
      this.catalogSummary = null;
      this.products = [];
      this.totalProductsCount = 0;
      this.isLoadingCatalog = false;
      return;
    }

    if (this.currentCatalogId === routeId && this.catalogDetail !== null) {
      return;
    }

    this.isProductFormActive = false;
    this.currentCatalogId = routeId;
    this.selectedCatalogId = routeId;
    this.pageNumber = 1;
    this.loadCatalogById(routeId);
  }

  onPageChanged(nextPage: number): void {
    const catalogId = this.catalogDetail?.CatalogId || this.currentCatalogId;

    if (!catalogId || nextPage < 1 || nextPage === this.pageNumber) {
      return;
    }

    this.pageNumber = nextPage;
    this.loadCatalogProducts(catalogId);
  }

  private loadCatalogById(catalogId: number): void {
    this.isLoadingCatalog = true;
    this.viewMessage = null;
    this.hasError = false;
    this.loadCatalogSummary(catalogId);

    this.catalogService.getCatalogById(catalogId).subscribe({
      next: (response: ResponseDTO<CatalogDto>) => {
        setTimeout(() => {
          const dto = response.Data;
          this.catalogDetail = dto;
          this.selectedCatalogId = Number(dto?.CatalogId || catalogId || this.currentCatalogId || 0) || null;
          this.loadCatalogProducts(catalogId);
        }, 0);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.catalogDetail = null;
        this.selectedCatalogId = this.currentCatalogId;
        this.products = [];
        this.totalProductsCount = 0;
        this.isLoadingCatalog = false;
        this.hasError = true;
        this.viewMessage = error.error?.Message || 'No fue posible cargar el catalogo. Se muestran datos basicos.';
      },
    });
  }

  private loadCatalogProducts(catalogId: number): void {
    this.catalogService.getAllProductsByCatalogId(catalogId, this.pageNumber, this.pageSize).subscribe({
      next: (response: ResponseDTO<CatalogProductDto[]>) => {
        this.products = response.Data || [];
        // Keep paginator totals stable using summary when available.
        if (!this.catalogSummary) {
          this.totalProductsCount = Number(response.Count || 0);
        }
        this.isLoadingCatalog = false;
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.products = [];
  this.totalProductsCount = 0;
        this.isLoadingCatalog = false;
        this.hasError = true;
        this.viewMessage = error.error?.Message || 'No fue posible cargar los productos del catalogo.';
      },
    });
  }

  private loadCatalogSummary(catalogId: number): void {
    this.catalogService.getCatalogStatusSummaryById(catalogId).subscribe({
      next: (response: ResponseDTO<CatalogSummaryDto>) => {
        setTimeout(() => {
          const raw = response?.Data;
          if (!raw) {
            return;
          }

          const summary = new CatalogSummaryDto();
          summary.CatalogId = Number(raw.CatalogId || catalogId);
          summary.BusinessId = Number(raw.BusinessId || 0);
          summary.Code = String(raw.Code || '').trim();
          summary.Name = String(raw.Name || '').trim();
          summary.ProductCount = Number(raw.ProductCount || 0);
          summary.ActiveProductCount = Number(raw.ActiveProductCount || 0);
          summary.InactiveProductCount = Number(raw.InactiveProductCount || 0);

          this.catalogSummary = summary;
          if (!this.selectedCatalogId) {
            this.selectedCatalogId = Number(summary.CatalogId || catalogId || 0) || null;
          }
        }, 0);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
      },
    });
  }

  onProductAdded(product: CatalogProductDto): void {
    if (!this.catalogDetail) {
      return;
    }

    const catalogId = Number(this.catalogDetail.CatalogId || 0);
    if (!catalogId) {
      return;
    }

    const payload = this.buildAddProductRequestBody(catalogId, product);

    this.viewMessage = null;
    this.hasError = false;
    this.isSavingProduct = true;

    this.catalogService.addProductToCatalog(payload).subscribe({
      next: (response: ResponseDTO<CatalogProductDto>) => {
        this.isSavingProduct = false;
        this.isProductFormActive = false;

        const savedProduct = response.Data || ({ ...product, CatalogId: catalogId } as CatalogProductDto);
        const currentProducts = this.products || [];
        const existingIndex = currentProducts.findIndex(item => {
          if (item.ProductId !== null && savedProduct.ProductId !== null) {
            return item.ProductId === savedProduct.ProductId;
          }

          return item.BarCode === savedProduct.BarCode;
        });

        if (existingIndex >= 0) {
          const updatedProducts = [...currentProducts];
          updatedProducts[existingIndex] = { ...savedProduct, CatalogId: catalogId };
          this.products = updatedProducts;
          this.viewMessage = 'El producto fue actualizado en el catalogo.';
        } else {
          this.products = [...currentProducts, { ...savedProduct, CatalogId: catalogId }];
          this.viewMessage = 'Producto guardado en el catalogo.';
        }

        this.loadCatalogProducts(catalogId);
        this.loadCatalogSummary(catalogId);
      },
      error: (error: HttpErrorResponse) => {
        this.isSavingProduct = false;

        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.hasError = true;
        this.viewMessage = error.error?.Message || 'No fue posible guardar el producto en el catalogo.';
      },
    });
  }

  private buildAddProductRequestBody(catalogId: number, product: CatalogProductDto): unknown {
    const prices = (product.ProductPrices || []).map(item => {
      const purchasePrice = Number(item.PurchasePrice || 0);
      const salePrice = Number(item.Price || 0);

      return {
        CustomerTypeId: Number(item.CustomerTypeId || 0),
        Price: salePrice,
        GainPercentage: Number(item.GainPercentage || 0),
        PurchasePrice: purchasePrice,
        TotalGain: Number(
        item.TotalGain !== undefined && item.TotalGain !== null
          ? item.TotalGain
          : Number((salePrice - purchasePrice).toFixed(2))
        ),
      };
    });

    return {
      catalogId,
      name: String(product.Name || '').trim(),
      barcode: String(product.BarCode || '').trim(),
      ProductPrices: prices,
    };
  }

  onProductRemoved(product: CatalogProductDto): void {
    const currentProducts = this.products || [];
    this.products = currentProducts.filter(item => {
      if (item.ProductId !== null && product.ProductId !== null) {
        return item.ProductId !== product.ProductId;
      }

      return item.BarCode !== product.BarCode;
    });
  }

  onProductEdited(): void {
    const catalogId = this.selectedCatalogId;
    if (!catalogId) {
      return;
    }

    this.isProductFormActive = false;
    this.loadCatalogProducts(catalogId);
    this.loadCatalogSummary(catalogId);
    this.hasError = false;
    this.viewMessage = 'Producto actualizado correctamente.';
  }

  onProductFormModeChanged(isActive: boolean): void {
    setTimeout(() => {
      this.isProductFormActive = isActive;
    }, 0);
  }

  get totalProducts(): number {
    if (this.catalogSummary) {
      return Number(this.catalogSummary.ProductCount || 0);
    }

    return this.totalProductsCount || this.products.length;
  }

  get paginatorTotalItems(): number {
    if (this.catalogSummary) {
      return Number(this.catalogSummary.ProductCount || 0);
    }

    return this.totalProductsCount || 0;
  }

  get activeProducts(): number {
    if (this.catalogSummary) {
      return Number(this.catalogSummary.ActiveProductCount || 0);
    }

    return this.products.filter(item => item.IsActive !== false).length;
  }

  private deferUiState(action: () => void): void {
    setTimeout(() => {
      action();
    }, 0);
  }
}
