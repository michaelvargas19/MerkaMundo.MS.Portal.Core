import { Component, ChangeDetectorRef } from '@angular/core';
import { SaleDto } from '../../../../shared/model/sales/sale-dto';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sales',
  standalone: false,
  templateUrl: './sales.html',
  styleUrl: './sales.css',
})
export class Sales {
  
  // Columnas para el grid de Angular Material
  displayedColumns: string[] = ['id', 'time', 'client', 'itemsCount', 'paymentMethod', 'isDelivery', 'total', 'actions'];

  // Datos simulados para el resumen del día
  public todaySales: SaleDto[] = [];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  onSalesLoaded(sales: SaleDto[]): void {
    this.todaySales = sales || [];
    this.cdr.detectChanges();
  }

  // Métrica 1: Total facturado hoy
  get totalSalesAmount(): number {
    return this.todaySales.reduce((acc, sale) => acc + this.getSaleAmount(sale), 0);
  }

  // Métrica 2: Cantidad total de domicilios
  get totalDeliveries(): number {
    return this.todaySales.filter(sale => this.isHomeDelivery(sale)).length;
  }

  get totalHomeDeliveryAmount(): number {
    return this.todaySales
      .filter(sale => this.isHomeDelivery(sale))
      .reduce((acc, sale) => acc + this.getSaleAmount(sale), 0);
  }

  get totalStoreDeliveryAmount(): number {
    return this.todaySales
      .filter(sale => !this.isHomeDelivery(sale))
      .reduce((acc, sale) => acc + this.getSaleAmount(sale), 0);
  }

  get totalCashAmount(): number {
    return this.sumByPaymentType(1, ['efectivo']);
  }

  get totalCardAmount(): number {
    return this.sumByPaymentType(2, ['tarjeta', 'debito', 'credito']);
  }

  get totalTransferAmount(): number {
    return this.sumByPaymentType(3, ['transferencia']);
  }

  private sumByPaymentType(expectedId: number, keywords: string[]): number {
    return this.todaySales
      .filter(sale => this.matchesPaymentType(sale, expectedId, keywords))
      .reduce((acc, sale) => acc + this.getSaleAmount(sale), 0);
  }

  private matchesPaymentType(sale: SaleDto, expectedId: number, keywords: string[]): boolean {
    const paymentMethodObject = sale?.PaymentMethod as any;
    const rawMethod = (sale as any).PaymentMethod;
    const rawMethodId =
      this.toNullableNumber((sale as any).PaymentMethodId) ??
      this.toNullableNumber(paymentMethodObject?.PaymentMethodId);

    const numericMethod = this.toNullableNumber(rawMethod);
    const numericMethodId = this.toNullableNumber(rawMethodId);

    if (numericMethodId === expectedId || numericMethod === expectedId) {
      return true;
    }

    const methodText = String(
      paymentMethodObject?.Name ??
      paymentMethodObject?.Code ??
      (sale as any).PaymentMethodName ??
      rawMethod ??
      ''
    ).toLowerCase();

    return keywords.some(keyword => methodText.includes(keyword));
  }

  private isHomeDelivery(sale: SaleDto): boolean {
    const rawIsDelivery = (sale as any).IsDelivery;
    if (rawIsDelivery === true) {
      return true;
    }

    const deliveryTypeId = this.toNullableNumber((sale as any).DeliveryTypeId);
    if (deliveryTypeId === 2) {
      return true;
    }

    const deliveryTypeName = String(
      sale?.DeliveryType?.Name ??
      (sale as any).DeliveryTypeName ??
      ''
    ).toLowerCase();
    return deliveryTypeName.includes('domicilio');
  }

  private getSaleAmount(sale: SaleDto): number {
    return this.toNullableNumber(sale?.Total) ?? 0;
  }

  private toNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  // Acciones rápidas
  openCreateSaleModal(): void {
    this.router.navigate(['/createSale']);
  }

  openSearchSaleModal(): void {
    
  }
}
