import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CatalogProductDto } from '../../../../shared/model/catalog/catalog-product-dto';

@Component({
  selector: 'app-list-products',
  standalone: false,
  templateUrl: './list-products.html',
  styleUrl: './list-products.css',
})
export class ListProducts {
  @Input() products: CatalogProductDto[] = [];
  @Input() pageNumber: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalItems: number = 0;
  @Input() isLoading: boolean = false;
  @Output() productRemoved = new EventEmitter<CatalogProductDto>();
  @Output() pageChanged = new EventEmitter<number>();

  removeProduct(product: CatalogProductDto): void {
    this.productRemoved.emit(product);
  }

  isProductActive(product: CatalogProductDto): boolean {
    const value = (product as any)?.IsActive;

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'false' || normalized === '0' || normalized === 'inactive' || normalized === 'inactivo') {
        return false;
      }

      if (normalized === 'true' || normalized === '1' || normalized === 'active' || normalized === 'activo') {
        return true;
      }
    }

    return true;
  }

  getProductStatusLabel(product: CatalogProductDto): string {
    return this.isProductActive(product) ? 'Activo' : 'Inactivo';
  }

  getBasePrice(product: CatalogProductDto): number {
    const firstPrice = product.ProductPrices && product.ProductPrices.length > 0
      ? product.ProductPrices[0]
      : null;

    return Number(firstPrice?.Price || 0);
  }

  get totalPages(): number {
    const safePageSize = this.pageSize > 0 ? this.pageSize : 10;
    const safeTotal = this.totalItems > 0 ? this.totalItems : 0;
    return Math.max(1, Math.ceil(safeTotal / safePageSize));
  }

  get fromItem(): number {
    if (this.totalItems <= 0) {
      return 0;
    }

    return (this.pageNumber - 1) * this.pageSize + 1;
  }

  get toItem(): number {
    if (this.totalItems <= 0) {
      return 0;
    }

    return Math.min(this.pageNumber * this.pageSize, this.totalItems);
  }

  onPreviousPage(): void {
    if (this.pageNumber <= 1 || this.isLoading) {
      return;
    }

    this.pageChanged.emit(this.pageNumber - 1);
  }

  onNextPage(): void {
    if (this.pageNumber >= this.totalPages || this.isLoading) {
      return;
    }

    this.pageChanged.emit(this.pageNumber + 1);
  }
}
