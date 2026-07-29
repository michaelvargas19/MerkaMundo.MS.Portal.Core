import { Component, EventEmitter, Output, computed, inject, Input, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SaleDto } from '../../../../shared/model/sales/sale-dto';
import { Router } from '@angular/router';
import { SaleService } from '../../../../core/services/sale';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { CustomerDto } from '../../../../shared/model/customer/customer-dto';
import { SaleDeliveryTypeDto } from '../../../../shared/model/sales/sale-delivery-type-dto';
import { SalePaymentMethodDto } from '../../../../shared/model/sales/sale-payment-method-dto';

@Component({
  selector: 'app-list-daily-sales',
  standalone: false,
  templateUrl: './list-daily-sales.html',
  styleUrl: './list-daily-sales.css',
})
export class ListDailySales implements OnInit {

    public currentDate: Date = new Date();
    private fb = inject(FormBuilder);
    private snackBar = inject(MatSnackBar);
    public filterForm!: FormGroup;
    public isLoadingSales = false;
    
    // Columnas para el grid de Angular Material
    public displayedColumns: string[] = ['id', 'time', 'client', 'paymentMethod', 'isDelivery', 'total', 'saleStatus', 'actions'];
  
    public todaySalesSignal = signal<SaleDto[]>([]);
    public salesCount = computed(() => this.todaySalesSignal().length);

    // Datos simulados para el resumen del día
    @Input() todaySales: SaleDto[] = [];

    @Input() set sales(data: SaleDto[]) {
      if (data) {
        this.todaySalesSignal.set(data);
      }
    }

    @Output() salesLoaded = new EventEmitter<SaleDto[]>();



    ngOnInit(): void {
      this.initForms();
      this.listenDateChanges();
      this.loadSalesBySelectedDate();
    }

    constructor(private router: Router, private saleService: SaleService) {}

    private initForms(): void {
    // Formulario de Búsqueda
    this.filterForm = this.fb.group({
          date: this.currentDate
        });

    }

    private listenDateChanges(): void {
      this.filterForm.get('date')?.valueChanges.subscribe(() => {
        this.loadSalesBySelectedDate();
      });
    }

    private formatDateForApi(dateValue: Date | string | null): string | null {
      if (!dateValue) {
        return null;
      }

      const date = new Date(dateValue);
      if (Number.isNaN(date.getTime())) {
        return null;
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    private getField<T>(source: any, pascalCase: string): T | null {
      if (!source) {
        return null;
      }

      const camelCase = pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
      return (source[pascalCase] ?? source[camelCase] ?? null) as T | null;
    }

    private mapDailySalesItem(raw: any): SaleDto {
      const item = new SaleDto();
      item.SaleId = Number(this.getField<number>(raw, 'SaleId') ?? 0);
      item.SaleStatus = this.getField<string>(raw, 'SaleStatus');
      item.Total = Number(this.getField<number>(raw, 'Total') ?? 0);
      item.CustomerId = this.toNumber(this.getField<number>(raw, 'CustomerId'));
      item.PaymentMethodId = this.toNumber(this.getField<number>(raw, 'PaymentMethodId'));
      item.DeliveryTypeId = this.toNumber(this.getField<number>(raw, 'DeliveryTypeId'));
      item.DeliveryType = this.mapSaleDeliveryType(raw, item.DeliveryTypeId);
      item.PaymentMethod = this.mapSalePaymentMethod(raw, item.PaymentMethodId);

      (item as any).Customer = this.mapCustomer(raw);
      (item as any).Client =
        this.getField<string>(raw, 'Client') ||
        this.getField<string>(raw, 'CustomerName') ||
        this.getField<string>(this.getField<any>(raw, 'Customer'), 'Name');
      const mappedItemsCount = this.resolveItemsCount(raw);
      (item as any).ItemsCount = mappedItemsCount;
      (item as any).PaymentMethodName =
        item.PaymentMethod?.Name ||
        this.getField<string>(raw, 'PaymentMethodName') ||
        this.getField<string>(raw, 'PaymentMethod') ||
        this.getField<string>(this.getField<any>(raw, 'PaymentMethod'), 'Name');
      (item as any).IsDelivery =
        this.getField<boolean>(raw, 'IsDelivery') ??
        Number(this.getField<number>(raw, 'DeliveryTypeId') ?? 0) === 2;
      (item as any).DeliveryTypeName =
        item.DeliveryType?.Name ||
        this.getField<string>(raw, 'DeliveryTypeName') ||
        this.getField<string>(raw, 'DeliveryType') ||
        this.getField<string>(this.getField<any>(raw, 'DeliveryType'), 'Name') ||
        ((item as any).IsDelivery ? 'Domicilio' : 'Mostrador');
      (item as any).Time = this.getField<string>(raw, 'Time') || this.extractTimeFromSaleDate(raw);
      return item;
    }

    private sumDetailQuantities(details: any[] | null): number | null {
      if (!details || details.length === 0) {
        return null;
      }

      const total = details.reduce((acc, detail) => {
        const qty =
          this.toNumber(this.getField<number>(detail, 'Quantity')) ??
          this.toNumber(this.getField<number>(detail, 'Cantidad')) ??
          1;
        return acc + qty;
      }, 0);

      return total > 0 ? total : null;
    }

    private resolveItemsCount(raw: any): number {
      const detailQuantities = this.sumDetailQuantities(this.getField<any[]>(raw, 'SaleDetails'));
      if (detailQuantities && detailQuantities > 0) {
        return detailQuantities;
      }

      return Number(
        this.getField<number>(raw, 'ItemsCount') ??
        this.getField<number>(raw, 'Quantity') ??
        this.getField<number>(raw, 'Cantidad') ??
        this.getField<number>(raw, 'TotalItems') ??
        this.getField<number>(raw, 'TotalQuantity') ??
        this.getField<any[]>(raw, 'SaleDetails')?.length ??
        0
      );
    }

    private mapSaleDeliveryType(raw: any, fallbackDeliveryTypeId: number | null): SaleDeliveryTypeDto | null {
      const deliveryTypeRaw =
        this.getField<any>(raw, 'SaleDeliveryType') ||
        this.getField<any>(raw, 'DeliveryType');

      if (!deliveryTypeRaw && !fallbackDeliveryTypeId) {
        return null;
      }

      const deliveryType = new SaleDeliveryTypeDto();
      deliveryType.DeliveryTypeId =
        this.toNumber(this.getField<number>(deliveryTypeRaw, 'DeliveryTypeId')) ||
        fallbackDeliveryTypeId;
      deliveryType.Code = this.getField<string>(deliveryTypeRaw, 'Code');
      deliveryType.Name =
        this.getField<string>(deliveryTypeRaw, 'Name') ||
        this.getField<string>(raw, 'DeliveryTypeName') ||
        this.getField<string>(raw, 'DeliveryType');
      deliveryType.Description = this.getField<string>(deliveryTypeRaw, 'Description');

      const isActiveRaw = this.getField<boolean>(deliveryTypeRaw, 'IsActive');
      deliveryType.IsActive = isActiveRaw === null ? true : Boolean(isActiveRaw);

      deliveryType.CreatedDate =
        this.getField<string>(deliveryTypeRaw, 'CreatedDate') ||
        this.getField<string>(deliveryTypeRaw, 'createdDate') ||
        new Date();

      return deliveryType;
    }

    private mapSalePaymentMethod(raw: any, fallbackPaymentMethodId: number | null): SalePaymentMethodDto | null {
      const paymentMethodRaw =
        this.getField<any>(raw, 'SalePaymentMethod') ||
        this.getField<any>(raw, 'PaymentMethod');

      if (!paymentMethodRaw && !fallbackPaymentMethodId) {
        return null;
      }

      const method = new SalePaymentMethodDto();
      method.PaymentMethodId =
        this.toNumber(this.getField<number>(paymentMethodRaw, 'PaymentMethodId')) ||
        fallbackPaymentMethodId;
      method.Code = this.getField<string>(paymentMethodRaw, 'Code');
      method.Name =
        this.getField<string>(paymentMethodRaw, 'Name') ||
        this.getField<string>(raw, 'PaymentMethodName') ||
        this.getField<string>(raw, 'PaymentMethod');
      method.Description = this.getField<string>(paymentMethodRaw, 'Description');

      const isActiveRaw = this.getField<boolean>(paymentMethodRaw, 'IsActive');
      method.IsActive = isActiveRaw === null ? true : Boolean(isActiveRaw);

      method.CreatedDate =
        this.getField<string>(paymentMethodRaw, 'CreatedDate') ||
        this.getField<string>(paymentMethodRaw, 'createdDate') ||
        new Date();

      return method;
    }

    private extractTimeFromSaleDate(raw: any): string | null {
      const saleDateValue = this.getField<any>(raw, 'SaleDate');
      if (!saleDateValue) {
        return null;
      }

      const date = new Date(saleDateValue);
      if (Number.isNaN(date.getTime())) {
        return null;
      }

      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }

    private toNumber(value: any): number | null {
      if (value === null || value === undefined || value === '') {
        return null;
      }

      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }

    private extractCustomerPhone(raw: any): string | null {
      const directPhone =
        this.getField<string>(raw, 'CustomerPhone') ||
        this.getField<string>(raw, 'PhoneNumber') ||
        this.getField<string>(raw, 'CellPhone') ||
        this.getField<string>(raw, 'MobilePhone');

      if (directPhone) {
        return directPhone;
      }

      const customer = this.getField<any>(raw, 'Customer');
      if (!customer) {
        return null;
      }

      return (
        this.getField<string>(customer, 'CustomerPhone') ||
        this.getField<string>(customer, 'PhoneNumber') ||
        this.getField<string>(customer, 'CellPhone') ||
        this.getField<string>(customer, 'MobilePhone')
      );
    }

    private mapCustomer(raw: any): CustomerDto | null {
      const customerId = this.toNumber(this.getField<any>(raw, 'CustomerId'));
      const customerPhone = this.extractCustomerPhone(raw);

      const nestedCustomer = this.getField<any>(raw, 'Customer');
      const nestedCustomerId = this.toNumber(this.getField<any>(nestedCustomer, 'CustomerId') ?? this.getField<any>(nestedCustomer, 'Id'));
      const finalCustomerId = customerId ?? nestedCustomerId;

      if (!finalCustomerId && !customerPhone) {
        return null;
      }

      const customer = new CustomerDto();
      customer.CustomerId = finalCustomerId;
      customer.CustomerPhone = customerPhone;
      return customer;
    }

    private loadSalesBySelectedDate(): void {
      const selectedDate = this.filterForm.get('date')?.value;
      const apiDate = this.formatDateForApi(selectedDate);

      if (!apiDate) {
        this.snackBar.open('Seleccione una fecha válida para consultar ventas', 'Cerrar', { duration: 3000 });
        return;
      }

      this.isLoadingSales = true;

      this.saleService.listByDates(apiDate, apiDate)
        .subscribe({
          next: (response: any) => {
            this.isLoadingSales = false;
            const data = response?.Data ?? response?.data ?? [];
            const list = Array.isArray(data) ? data.map((item: any) => this.mapDailySalesItem(item)) : [];

            this.todaySales = list;
            this.todaySalesSignal.set(list);
            this.salesLoaded.emit(list);
          },
          error: (error: HttpErrorResponse) => {
            this.isLoadingSales = false;

            if (error.status === 401) {
              this.router.navigate(['/login']);
              return;
            }

            const message = error.error?.Message || 'No fue posible cargar las ventas del día';
            this.snackBar.open(message, 'Cerrar', { duration: 3000 });
            this.todaySales = [];
            this.todaySalesSignal.set([]);
            this.salesLoaded.emit([]);
          }
        });
    }

    load(sale: SaleDto[]): void {
      
      if (!sale) return;

      this.todaySales = sale;
      this.todaySalesSignal.set(sale);
    }

    viewSaleDetail(sale: SaleDto): void {
      if (!sale?.SaleId) {
        return;
      }

      this.router.navigate(['/updateSale', sale.SaleId]);
    }

    exportCurrentSalesToExcel(): void {
      const sales = this.todaySalesSignal();
      if (!sales || sales.length === 0) {
        this.snackBar.open('No hay ventas para exportar', 'Cerrar', { duration: 3000 });
        return;
      }

      const rows = sales.map((sale) => [
        String(sale.SaleId ?? ''),
        this.getSaleTime(sale),
        this.getClientName(sale),
        this.getPaymentMethodName(sale),
        this.getDeliveryTypeName(sale),
        this.formatDecimalWithComma(sale.Total),
        sale.SaleStatus || 'N/A',
      ]);

      const headers = ['ID', 'Hora', 'Cliente', 'Pago', 'Entrega', 'Total', 'Estado'];
      const tableRows = [headers, ...rows]
        .map((cells) => `<tr>${cells.map((cell) => `<td>${this.escapeHtml(cell)}</td>`).join('')}</tr>`)
        .join('');

      const html = `
        <html>
          <head>
            <meta charset="UTF-8" />
          </head>
          <body>
            <table border="1">${tableRows}</table>
          </body>
        </html>
      `;

      const selectedDate = this.filterForm.get('date')?.value;
      const dateLabel = this.formatDateForApi(selectedDate) || this.formatDateForApi(new Date()) || 'ventas';

      const blob = new Blob([`\ufeff${html}`], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ventas-${dateLabel}.xls`;
      anchor.click();
      URL.revokeObjectURL(url);
    }

    private escapeHtml(value: string): string {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    private formatDecimalWithComma(value: unknown): string {
      const numericValue = this.toNumber(value);
      if (numericValue === null) {
        return '0,00';
      }

      return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue);
    }

    isSaleConfirmed(sale: SaleDto): boolean {
      const status = (sale?.SaleStatus || '').toString().trim().toUpperCase();
      return status === 'CONFIRMED';
    }

    getSaleTime(sale: SaleDto): string {
      return String((sale as any)?.Time || '');
    }

    getClientName(sale: SaleDto): string {
      return String((sale as any)?.Client || 'Publico');
    }

    getItemsCount(sale: SaleDto): number {
      const details = sale?.SaleDetails as any[] | undefined;
      const byDetails = this.sumDetailQuantities(details || null);
      if (byDetails && byDetails > 0) {
        return byDetails;
      }

      return Number(
        (sale as any)?.ItemsCount ??
        (sale as any)?.Quantity ??
        (sale as any)?.TotalItems ??
        (sale as any)?.TotalQuantity ??
        0
      );
    }

    getPaymentMethodName(sale: SaleDto): string {
      return String(
        sale?.PaymentMethod?.Name ||
        (sale as any)?.PaymentMethodName ||
        'N/A'
      );
    }

    getDeliveryTypeName(sale: SaleDto): string {
      return String(
        sale?.DeliveryType?.Name ||
        (sale as any)?.DeliveryTypeName ||
        'Mostrador'
      );
    }

    isHomeDelivery(sale: SaleDto): boolean {
      const deliveryName = this.getDeliveryTypeName(sale).toLowerCase();
      return deliveryName.includes('domicilio') || Number(sale?.DeliveryTypeId || 0) === 2;
    }

    hasIdentifiedCustomer(sale: SaleDto): boolean {
      if (((sale as any)?.Customer?.CustomerId || 0) > 0) {
        return true;
      }

      const client = this.getClientName(sale).trim().toLowerCase();
      if (!client) {
        return false;
      }

      return !['publico', 'publico general', 'mostrador', 'consumidor final'].includes(client.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    }

    canSendWhatsapp(sale: SaleDto): boolean {
      if (!this.hasIdentifiedCustomer(sale)) {
        return false;
      }

      return !!this.normalizePhoneForWhatsapp((sale as any)?.Customer?.CustomerPhone);
    }

    sendByWhatsapp(sale: SaleDto): void {
      if (!this.hasIdentifiedCustomer(sale)) {
        this.snackBar.open('La solicitud no tiene cliente identificado', 'Cerrar', { duration: 3000 });
        return;
      }

      const phone = this.normalizePhoneForWhatsapp((sale as any)?.Customer?.CustomerPhone);
      if (!phone) {
        this.snackBar.open('No se encontró celular del cliente para WhatsApp', 'Cerrar', { duration: 3000 });
        return;
      }

      const clientName = this.getClientName(sale) || 'cliente';
      const saleRef = sale?.SaleId ? ` #${sale.SaleId}` : '';
      const text = encodeURIComponent(`Hola ${clientName}, te compartimos la informacion de tu venta${saleRef}.`);
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    }

    private normalizePhoneForWhatsapp(value: string | null | undefined): string | null {
      if (!value) {
        return null;
      }

      const digits = value.toString().replace(/\D/g, '');
      if (!digits) {
        return null;
      }

      if (digits.length === 10) {
        return `57${digits}`;
      }

      return digits.length >= 11 ? digits : null;
    }

    printLargeSale(sale: SaleDto): void {
      if (!sale?.SaleId) {
        this.snackBar.open('No se encontró el id de la venta para imprimir', 'Cerrar', { duration: 3000 });
        return;
      }

      if (!this.isSaleConfirmed(sale)) {
        this.snackBar.open('Solo se puede imprimir ventas en estado CONFIRMED', 'Cerrar', { duration: 3000 });
        return;
      }

      this.saleService.generateLargePdf(sale.SaleId)
        .subscribe({
          next: (response: HttpResponse<Blob>) => {
            this.openPdfResponse(response, `venta-${sale.SaleId}-large.pdf`);
          },
          error: (error: HttpErrorResponse) => {
            this.handlePrintError(error);
          }
        });
    }

    printPosSale(sale: SaleDto): void {
      if (!sale?.SaleId) {
        this.snackBar.open('No se encontró el id de la venta para imprimir', 'Cerrar', { duration: 3000 });
        return;
      }

      if (!this.isSaleConfirmed(sale)) {
        this.snackBar.open('Solo se puede imprimir ventas en estado CONFIRMED', 'Cerrar', { duration: 3000 });
        return;
      }

      this.saleService.generatePosPdf(sale.SaleId)
        .subscribe({
          next: (response: HttpResponse<Blob>) => {
            this.openPdfResponse(response, `venta-${sale.SaleId}-pos.pdf`);
          },
          error: (error: HttpErrorResponse) => {
            this.handlePrintError(error);
          }
        });
    }

    private openPdfResponse(response: HttpResponse<Blob>, fileName: string): void {
      const blob = response.body;

      if (!blob || blob.size === 0) {
        this.snackBar.open('El servicio no devolvió un PDF válido', 'Cerrar', { duration: 3000 });
        return;
      }

      const contentType = (response.headers.get('content-type') || blob.type || '').toLowerCase();

      // Cuando el backend devuelve HTML (plantilla) en lugar de PDF, no se debe forzar MIME PDF.
      if (contentType.includes('text/html')) {
        const htmlUrl = URL.createObjectURL(new Blob([blob], { type: 'text/html' }));
        window.open(htmlUrl, '_blank');
        this.snackBar.open('GenerateLarge devolvió HTML; revisar conversión backend a PDF', 'Cerrar', { duration: 5000 });
        setTimeout(() => URL.revokeObjectURL(htmlUrl), 3000);
        return;
      }

      const pdfBlob = new Blob([blob], { type: contentType.includes('pdf') ? contentType : 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);

      const openedWindow = window.open(objectUrl, '_blank');
      if (!openedWindow) {
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        anchor.click();
      }

      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }

    private handlePrintError(error: HttpErrorResponse): void {
      if (error.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const message = error.error?.Message || 'No fue posible generar el PDF de la venta';
      this.snackBar.open(message, 'Cerrar', { duration: 3000 });
    }

}
    