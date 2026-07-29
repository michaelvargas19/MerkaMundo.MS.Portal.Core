import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product';
import { SaleService } from '../../../../core/services/sale';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SaleDetailDto } from '../../../../shared/model/sales/sale-detail-dto';
import { SaleDto } from '../../../../shared/model/sales/sale-dto';
import { ResponseDTO } from '../../../../shared/model/common/http/response-dto';
import { CatalogProductDto } from '../../../../shared/model/catalog/catalog-product-dto';

@Component({
  selector: 'app-update-sale',
  standalone: false,
  templateUrl: './update-sale.html',
  styleUrls: ['../create-sale/create-sale.css', './update-sale.css'],
})
export class UpdateSale implements OnInit {

  public currentDate: Date = new Date();
  public saleId: number | null = null;
  public isLoadingSale = false;

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private readonly homeDeliveryTypeId = 2;

  customerTypes = [
    { id: 1, label: 'Público' },
    { id: 2, label: 'Cliente' },
    { id: 3, label: 'Mayorista' }
  ];

  selectedCustomer: { id: number | null; name: string } | null = null;

  customerForm!: FormGroup;
  saleForm!: FormGroup;
  filterForm!: FormGroup;
  cartItems: SaleDetailDto[] = [];
  removedItems: SaleDetailDto[] = [];
  applyTaxToAll = false;
  applyTaxIndeterminate = false;

  private originalItemsSnapshot = new Map<number, {
    CustomerTypeId: number | null;
    UnitPrice: number | null;
    Quantity: number | null;
    ApplyTax: boolean;
  }>();

  private originalHeaderSnapshot: {
    businessId: number | null;
    customerId: number | null;
    deliveryTypeId: number | null;
    paymentMethodId: number | null;
    saleStatus: string | null;
    saleDate: string | null;
    deliveryDate: string | null;
    notes: string | null;
    totalDiscount: number;
  } | null = null;

  displayedColumns: string[] = ['barcode', 'productName', 'productType', 'itemCustomerType', 'unitPrice', 'quantity', 'subtotal', 'actions'];

  productTypes = [
    { value: 'ALL', label: 'Todos' }
  ];

  deliveryTypes = [
    { id: 1, name: 'Entrega en tienda' },
    { id: 2, name: 'Domicilio' }
  ];

  paymentMethods = [
    { id: 1, name: 'Efectivo' },
    { id: 2, name: 'Tarjeta Débito/Crédito' },
    { id: 3, name: 'Transferencia Electrónica' }
  ];

  get modifiedItemsCount(): number {
    const activeChanges = this.cartItems.filter(item => item.IsModified === true || item.IsNew === true).length;
    const removedChanges = this.removedItems.length;
    return activeChanges + removedChanges;
  }

  constructor(
    private productService: ProductService,
    private saleService: SaleService,
    private router: Router,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.initForms();
    this.loadSaleFromRoute();
  }

  private initForms(): void {
    this.filterForm = this.fb.group({
      barcode: [''],
      productType: ['ALL'],
      searchTerm: ['']
    });

    this.saleForm = this.fb.group({
      businessId: [null],
      customerId: [null],
      customerTypeId: [null],
      deliveryTypeId: [1, [Validators.required]],
      paymentMethodId: [1, [Validators.required]],
      saleNumber: [{ value: 'VTA-AUTOGEN', disabled: true }],
      saleStatus: ['Completada', [Validators.required]],
      saleDate: [new Date(), [Validators.required]],
      deliveryDate: [null],
      notes: [''],
      totalDiscount: [0, [Validators.min(0)]],
      totalTaxRate: [0.19]
    });

    this.customerForm = this.fb.group({
      customerTypeId: [null, [Validators.required]]
    });

    this.saleForm.get('totalDiscount')?.valueChanges.subscribe(() => this.recalculateTotals());
    this.saleForm.get('totalTaxRate')?.valueChanges.subscribe(() => {
      this.cartItems.forEach(item => this.calculateItemAmounts(item));
      this.recalculateTotals();
    });
  }

  private loadSaleFromRoute(): void {
    const routeValue = this.route.snapshot.paramMap.get('id');
    const parsedId = Number(routeValue);

    if (!routeValue || Number.isNaN(parsedId) || parsedId <= 0) {
      this.snackBar.open('No se recibió un id de venta válido', 'Cerrar', { duration: 3000 });
      this.router.navigate(['/sales']);
      return;
    }

    this.saleId = parsedId;
    this.fetchSale(parsedId);
  }

  private fetchSale(id: number): void {
    this.isLoadingSale = true;

    this.saleService.getById(id).subscribe({
      next: (response: ResponseDTO<SaleDto> | any) => {
        this.isLoadingSale = false;
        const dto = this.extractSaleFromResponse(response);

        if (!dto) {
          this.snackBar.open(response?.Message || response?.message || 'No se encontró la venta', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/sales']);
          return;
        }

        this.populateFormWithSale(dto);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingSale = false;

        if (error.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        const message = error.error?.Message || 'No fue posible cargar la venta';
        this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        this.router.navigate(['/sales']);
      }
    });
  }

  private extractSaleFromResponse(response: any): any | null {
    if (!response) {
      return null;
    }

    return response.Data ?? response.data ?? response.Result ?? response.result ?? null;
  }

  private getField<T>(source: any, pascalCase: string): T | null {
    if (!source) {
      return null;
    }

    const camelCase = pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
    return (source[pascalCase] ?? source[camelCase] ?? null) as T | null;
  }

  private toNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private toDate(value: any): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private dateKey(value: any): string | null {
    const date = this.toDate(value);
    return date ? date.toISOString().slice(0, 10) : null;
  }

  private normalizePercentage(value: number): number {
    const normalized = value > 1 ? value / 100 : value;
    return Number(Math.max(0, normalized).toFixed(4));
  }

  private buildHttpErrorMessage(error: HttpErrorResponse, fallback: string): string {
    const apiError = error.error;

    if (!apiError) {
      return fallback;
    }

    if (typeof apiError === 'string') {
      return apiError;
    }

    const directMessage = apiError.Message || apiError.message || apiError.title || apiError.detail;
    if (directMessage) {
      return directMessage;
    }

    const validationErrors = apiError.errors as Record<string, string[] | string> | undefined;
    if (validationErrors) {
      const firstMessages = Object.values(validationErrors)
        .flatMap(value => Array.isArray(value) ? value : [value])
        .filter(Boolean)
        .map(value => String(value));

      if (firstMessages.length > 0) {
        return firstMessages.slice(0, 2).join(' | ');
      }
    }

    return fallback;
  }

  private populateFormWithSale(dto: any): void {
    const subtotal = this.toNumber(this.getField<number>(dto, 'Subtotal')) || 0;
    const totalTax = this.toNumber(this.getField<number>(dto, 'TotalTax')) || 0;
    const calculatedRate = subtotal > 0 && totalTax > 0 ? totalTax / subtotal : 0.19;

    const businessId = this.toNumber(this.getField<number>(dto, 'BusinessId'));
    const customerId = this.toNumber(this.getField<number>(dto, 'CustomerId'));
    const deliveryTypeId = this.toNumber(this.getField<number>(dto, 'DeliveryTypeId'));
    const paymentMethodId = this.toNumber(this.getField<number>(dto, 'PaymentMethodId'));
    const saleStatus = this.getField<string>(dto, 'SaleStatus') || 'Completada';
    const saleDate = this.toDate(this.getField<any>(dto, 'SaleDate')) || new Date();
    const deliveryDate = this.toDate(this.getField<any>(dto, 'DeliveryDate'));
    const notes = this.getField<string>(dto, 'Notes') || '';
    const totalDiscount = this.toNumber(this.getField<number>(dto, 'TotalDiscount')) || 0;

    this.saleForm.patchValue({
      businessId,
      customerId,
      deliveryTypeId,
      paymentMethodId,
      saleNumber: this.getField<string>(dto, 'SaleNumber') || 'VTA-AUTOGEN',
      saleStatus,
      saleDate,
      deliveryDate,
      notes,
      totalDiscount,
      totalTaxRate: calculatedRate,
    });

    this.cartItems = [];
    this.removedItems = [];
    this.originalItemsSnapshot.clear();

    const details = this.getField<any[]>(dto, 'SaleDetails') || [];
    details.forEach(detail => {
      const productId = this.toNumber(this.getField<number>(detail, 'ProductId'));

      if (!productId) {
        return;
      }

      const item = new SaleDetailDto();
      item.ProductId = productId;
      item.ProductPriceId = this.toNumber(this.getField<number>(detail, 'ProductPriceId'));
      item.Barcode = this.getField<string>(detail, 'Barcode');
      item.ProductName = this.getField<string>(detail, 'ProductName');
      item.ProductType = this.getField<string>(detail, 'ProductType');
      item.CustomerTypeId = this.toNumber(this.getField<number>(detail, 'CustomerTypeId'));
      item.ProductPrices = this.getField<any[]>(detail, 'ProductPrices') || [];
      item.UnitPrice = this.toNumber(this.getField<number>(detail, 'UnitPrice'));
      item.Quantity = this.resolveDetailQuantity(detail, item.UnitPrice);

      const detailApplyTax = this.getField<boolean>(detail, 'ApplyTax');
      const detailTax = this.toNumber(this.getField<number>(detail, 'TaxAmount')) || 0;
      item.ApplyTax = detailApplyTax ?? (detailTax > 0);

      item.HasMissingCustomerTypePrice = false;
      item.IsModified = false;
      item.IsNew = false;
      item.IsDeleted = false;

      this.calculateItemAmounts(item);
      this.cartItems.push(item);

      this.originalItemsSnapshot.set(productId, {
        CustomerTypeId: item.CustomerTypeId,
        UnitPrice: item.UnitPrice,
        Quantity: item.Quantity,
        ApplyTax: item.ApplyTax !== false,
      });
    });

    const firstTypeId = this.cartItems[0]?.CustomerTypeId ?? null;
    if (firstTypeId) {
      this.customerForm.patchValue({ customerTypeId: firstTypeId }, { emitEvent: false });
      const found = this.customerTypes.find(type => type.id === firstTypeId);
      this.selectedCustomer = found ? { id: found.id, name: found.label } : null;
    }

    this.originalHeaderSnapshot = {
      businessId,
      customerId,
      deliveryTypeId,
      paymentMethodId,
      saleStatus,
      saleDate: this.dateKey(saleDate),
      deliveryDate: this.dateKey(deliveryDate),
      notes,
      totalDiscount,
    };

    this.updateGeneralTaxToggleState();
    this.recalculateTotals();
  }

  private resolveDetailQuantity(detail: any, unitPrice: number | null): number {
    const directQuantity =
      this.toNumber(this.getField<number>(detail, 'Quantity')) ??
      this.toNumber(this.getField<number>(detail, 'ItemsCount')) ??
      this.toNumber(this.getField<number>(detail, 'Cantidad'));

    if (directQuantity && directQuantity > 0) {
      return directQuantity;
    }

    const subtotal = this.toNumber(this.getField<number>(detail, 'Subtotal'));
    if ((subtotal || 0) > 0 && (unitPrice || 0) > 0) {
      const calculated = Math.round((subtotal as number) / (unitPrice as number));
      if (calculated > 0) {
        return calculated;
      }
    }

    return 1;
  }

  private markItemAsModified(item: SaleDetailDto): void {
    const productId = item.ProductId;
    if (!productId) {
      item.IsModified = true;
      item.IsNew = true;
      item.IsDeleted = false;
      return;
    }

    const original = this.originalItemsSnapshot.get(productId);

    if (!original) {
      item.IsModified = true;
      item.IsNew = true;
      item.IsDeleted = false;
      return;
    }

    const hasChanged =
      original.CustomerTypeId !== item.CustomerTypeId ||
      Number(original.UnitPrice || 0) !== Number(item.UnitPrice || 0) ||
      Number(original.Quantity || 0) !== Number(item.Quantity || 0) ||
      original.ApplyTax !== (item.ApplyTax !== false);

    item.IsModified = hasChanged;
    item.IsNew = false;
    item.IsDeleted = false;

    if (!hasChanged) {
      this.removedItems = this.removedItems.filter(removed => removed.ProductId !== productId);
    }
  }

  private mapItemForUpdate(
    item: SaleDetailDto,
    discountPercentage: number,
    taxPercentage: number,
    deleted = false
  ): SaleDetailDto {
    const dto = new SaleDetailDto();
    dto.ProductId = item.ProductId;
    dto.ProductPriceId = item.ProductPriceId;
    dto.Barcode = item.Barcode;
    dto.ProductName = item.ProductName;
    dto.ProductType = item.ProductType;
    dto.CustomerTypeId = item.CustomerTypeId;
    dto.UnitPrice = item.UnitPrice;
    dto.Quantity = item.Quantity;
    dto.ApplyTax = item.ApplyTax;
    dto.Subtotal = item.Subtotal;
    dto.TaxAmount = item.TaxAmount;
    dto.SubtotalWithoutTax = item.SubtotalWithoutTax;
    const itemSubtotal = Number(item.Subtotal || 0);
    const itemTax = Number(item.TaxAmount || 0);
    dto.DiscountPercentage = discountPercentage;
    dto.TaxPercentage = item.ApplyTax !== false ? taxPercentage : 0;
    dto.TotalDiscount = Number((itemSubtotal * discountPercentage).toFixed(4));
    dto.TotalTax = Number(itemTax.toFixed(4));
    dto.IsModified = true;
    dto.IsNew = deleted ? false : (item.IsNew === true);
    dto.IsDeleted = deleted;
    dto.HasMissingCustomerTypePrice = item.HasMissingCustomerTypePrice;
    return dto;
  }

  private hasHeaderChanges(formValues: any): boolean {
    if (!this.originalHeaderSnapshot) {
      return true;
    }

    return (
      this.originalHeaderSnapshot.businessId !== this.toNumber(formValues.businessId) ||
      this.originalHeaderSnapshot.customerId !== this.toNumber(formValues.customerId) ||
      this.originalHeaderSnapshot.deliveryTypeId !== this.toNumber(formValues.deliveryTypeId) ||
      this.originalHeaderSnapshot.paymentMethodId !== this.toNumber(formValues.paymentMethodId) ||
      this.originalHeaderSnapshot.saleStatus !== (formValues.saleStatus || null) ||
      this.originalHeaderSnapshot.saleDate !== this.dateKey(formValues.saleDate) ||
      this.originalHeaderSnapshot.deliveryDate !== this.dateKey(formValues.deliveryDate) ||
      this.originalHeaderSnapshot.notes !== (formValues.notes || '') ||
      Number(this.originalHeaderSnapshot.totalDiscount || 0) !== Number(formValues.totalDiscount || 0)
    );
  }

  private buildChangedDetailsPayload(discountPercentage: number, taxPercentage: number): SaleDetailDto[] {
    const updatedOrNew = this.cartItems
      .filter(item => item.IsModified === true || item.IsNew === true)
      .map(item => this.mapItemForUpdate(item, discountPercentage, taxPercentage, false));

    const deleted = this.removedItems.map(item => this.mapItemForUpdate(item, discountPercentage, taxPercentage, true));

    return [...updatedOrNew, ...deleted];
  }

  onSearchByBarCode(): void {
    const barcode = this.filterForm.value.barcode;

    if (barcode) {
      this.searchProductByBarcode(barcode);
    }
  }

  onSearchProducts(): void {
    const filters = this.filterForm.value;
    console.log('Filtrando productos con:', filters);
    this.snackBar.open('Abriendo diálogo de búsqueda...', 'Cerrar', { duration: 2000 });
  }

  onDeliveryTypeChange(deliveryTypeId: number): void {
    switch (deliveryTypeId) {
      case this.homeDeliveryTypeId:
        this.saleForm.patchValue({
          deliveryDate: null,
          notes: ''
        });
        break;
      default:
        break;
    }
  }

  onGeneralApplyTaxChange(isChecked: boolean): void {
    this.applyTaxToAll = isChecked;
    this.applyTaxIndeterminate = false;
    this.cartItems.forEach(item => {
      item.ApplyTax = isChecked;
      this.calculateItemAmounts(item);
      this.markItemAsModified(item);
    });
    this.recalculateTotals();
  }

  onItemApplyTaxChange(item: SaleDetailDto, isChecked: boolean): void {
    item.ApplyTax = isChecked;
    this.calculateItemAmounts(item);
    this.markItemAsModified(item);
    this.updateGeneralTaxToggleState();
    this.recalculateTotals();
  }

  onItemCustomerTypeChange(item: SaleDetailDto, customerTypeId: number): void {
    if (!this.applyCustomerTypeToItem(item, customerTypeId)) {
      const currentTypeId = this.customerForm.get('customerTypeId')?.value || null;
      item.CustomerTypeId = currentTypeId;
      item.HasMissingCustomerTypePrice = true;
      this.snackBar.open('No hay precio para ese tipo de cliente en este producto', 'Cerrar', { duration: 3000 });
      this.cartItems = [...this.cartItems];
      return;
    }

    this.syncGlobalCustomerTypeWithItems();
    this.markItemAsModified(item);
    this.recalculateTotals();
  }

  updateUnitPrice(element: SaleDetailDto, newPrice: number | string): void {
    const price = Number(newPrice);

    if (isNaN(price) || price <= 0) {
      this.removeItem(element);
      return;
    }

    element.UnitPrice = price;
    element.HasMissingCustomerTypePrice = false;
    this.calculateItemAmounts(element);
    this.markItemAsModified(element);
    this.cartItems = [...this.cartItems];
    this.recalculateTotals();
  }

  updateQuantity(element: SaleDetailDto, newQuantity: number | string): void {
    const qty = Number(newQuantity);

    if (isNaN(qty) || qty <= 0) {
      this.removeItem(element);
      return;
    }

    element.Quantity = qty;
    this.calculateItemAmounts(element);
    this.markItemAsModified(element);
    this.cartItems = [...this.cartItems];
    this.recalculateTotals();
  }

  removeItem(element: SaleDetailDto): void {
    if (element.ProductId && this.originalItemsSnapshot.has(element.ProductId)) {
      const alreadyTracked = this.removedItems.some(item => item.ProductId === element.ProductId);
      if (!alreadyTracked) {
        const subtotal = this.calculatedSubtotal;
        const totalDiscount = Math.max(0, Math.min(Number(this.saleForm.get('totalDiscount')?.value || 0), subtotal));
        const rawTaxRate = Number(this.saleForm.get('totalTaxRate')?.value || 0);
        const taxPercentage = this.normalizePercentage(rawTaxRate);
        const discountPercentage = subtotal > 0 ? this.normalizePercentage(totalDiscount / subtotal) : 0;
        const removed = this.mapItemForUpdate(element, discountPercentage, taxPercentage, true);
        this.removedItems.push(removed);
      }
    }

    this.cartItems = this.cartItems.filter(item => item.ProductId !== element.ProductId);
    this.updateGeneralTaxToggleState();
    this.recalculateTotals();
  }

  get calculatedSubtotal(): number {
    return this.cartItems.reduce((acc, item) => acc + Number(item.Subtotal?.toString() || 0), 0);
  }

  get calculatedTax(): number {
    return this.cartItems.reduce((acc, item) => {
      return acc + Number(item.TaxAmount?.toString() || 0);
    }, 0);
  }

  get breakdownTotalTax(): number {
    return Number((this.calculatedTax || 0).toFixed(2));
  }

  get calculatedTotal(): number {
    const discount = this.saleForm.get('totalDiscount')?.value || 0;
    const netTotal = Math.max(0, this.calculatedSubtotal - discount);
    return this.roundToNearestFifty(netTotal);
  }

  get totalItemsCount(): number {
    return this.cartItems.reduce((acc, item) => acc + (item.Quantity || 0), 0);
  }

  private recalculateTotals(): void {
    this.cartItems = [...this.cartItems];
  }

  private roundToNearestFifty(value: number): number {
    return Math.ceil(Number(value || 0) / 50) * 50;
  }

  private calculateItemAmounts(item: SaleDetailDto): void {
    const quantity = Number(item.Quantity?.toString() || 0);
    const unitPrice = Number(item.UnitPrice?.toString() || 0);
    const taxRate = Number(this.saleForm.get('totalTaxRate')?.value || 0);
    const applyTax = item.ApplyTax !== false;
    const itemSubtotal = quantity * unitPrice;
    const itemTax = applyTax && taxRate > 0 ? itemSubtotal * taxRate : 0;

    item.Subtotal = itemSubtotal;
    item.TaxAmount = itemTax;
    item.SubtotalWithoutTax = Math.max(0, itemSubtotal - itemTax);
    item.ApplyTax = applyTax;
  }

  private applyCustomerTypeToItem(item: SaleDetailDto, customerTypeId: number): boolean {
    const prices = item.ProductPrices || [];
    const match = prices.find(pp => pp.CustomerTypeId === customerTypeId);

    if (!match) {
      item.HasMissingCustomerTypePrice = true;
      return false;
    }

    item.CustomerTypeId = customerTypeId;
    item.ProductPriceId = Number(match.ProductPriceId || 0) || null;
    item.UnitPrice = match.Price;
    item.HasMissingCustomerTypePrice = false;
    this.calculateItemAmounts(item);
    this.markItemAsModified(item);
    return true;
  }

  private syncGlobalCustomerTypeWithItems(): void {
    if (this.cartItems.length === 0) {
      return;
    }

    const distinctTypes = [...new Set(this.cartItems.map(item => item.CustomerTypeId).filter(typeId => typeId !== null))];

    if (distinctTypes.length === 1) {
      const typeId = Number(distinctTypes[0]);
      this.customerForm.patchValue({ customerTypeId: typeId }, { emitEvent: false });
      const found = this.customerTypes.find(type => type.id === typeId);
      this.selectedCustomer = found ? { id: found.id, name: found.label } : null;
      return;
    }

    this.customerForm.patchValue({ customerTypeId: null }, { emitEvent: false });
    this.selectedCustomer = null;
  }

  searchProductByBarcode(barcode: string): void {

    if (!barcode) {
      this.snackBar.open('Ingrese un código de barras para buscar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.snackBar.open(`Buscando producto con código de barras: ${barcode}`, 'Cerrar', { duration: 2000 });

    this.productService.getProductByBarCode(barcode)
      .subscribe({
        next: (response: ResponseDTO<CatalogProductDto>) => {
          const dto = response.Data;

          if (!dto) {
            this.snackBar.open(response.Message || 'No se encontró el producto', 'Cerrar', { duration: 3000 });
            return;
          }

          let unitPrice = 0;
          const customerTypeId = this.customerForm.get('customerTypeId')?.value;
          const customerType = this.customerTypes.filter(ct => ct.id === customerTypeId)[0];

          if (!customerTypeId || !customerType) {
            this.snackBar.open('Seleccione un tipo de cliente antes de agregar productos', 'Cerrar', { duration: 3000 });
            return;
          }

          const productPrices = dto.ProductPrices ? dto.ProductPrices.filter(pp => pp.CustomerTypeId === customerTypeId) : null;

          if (!productPrices || productPrices.length === 0) {
            this.snackBar.open(`No hay precios disponibles para el tipo de cliente "${customerType.label}"`, 'Cerrar', { duration: 3000 });
            return;
          }

          const item = new SaleDetailDto();
          item.ProductId = dto.ProductId;
          item.Barcode = dto.BarCode;
          item.ProductName = dto.Name;
          item.ProductType = dto.UnitOfMeasure;
          item.ProductPrices = dto.ProductPrices || [];
          item.CustomerTypeId = customerTypeId;
          item.UnitPrice = unitPrice;
          item.Quantity = 1;
          item.ApplyTax = this.applyTaxToAll;
          item.HasMissingCustomerTypePrice = false;
          this.applyCustomerTypeToItem(item, customerTypeId);
          this.calculateItemAmounts(item);

          this.addProductToCart(item);
          this.snackBar.open('Producto agregado al carrito', 'Cerrar', { duration: 2000 });

        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.router.navigate(['/login']);
            return;
          }
          const message = error.error?.Message || 'Ocurrió un error al buscar el producto';
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        }
      });
  }

  addProductToCart(product: SaleDetailDto): void {
    const existingItem = this.cartItems.find(item => item.ProductId === product.ProductId);

    if (existingItem) {
      existingItem.Quantity = (existingItem.Quantity || 0) + (product.Quantity || 1);
      this.calculateItemAmounts(existingItem);
      this.markItemAsModified(existingItem);
    } else {
      product.Quantity = product.Quantity || 1;
      product.ApplyTax = product.ApplyTax ?? this.applyTaxToAll;
      this.calculateItemAmounts(product);
      this.markItemAsModified(product);

      if (product.ProductId) {
        this.removedItems = this.removedItems.filter(item => item.ProductId !== product.ProductId);
      }

      this.cartItems.push(product);
    }

    this.updateGeneralTaxToggleState();
    this.cartItems = [...this.cartItems];
    this.recalculateTotals();
  }

  private updateGeneralTaxToggleState(): void {
    if (this.cartItems.length === 0) {
      this.applyTaxToAll = false;
      this.applyTaxIndeterminate = false;
      return;
    }

    const taxedItems = this.cartItems.filter(item => item.ApplyTax !== false).length;

    if (taxedItems === this.cartItems.length) {
      this.applyTaxToAll = true;
      this.applyTaxIndeterminate = false;
      return;
    }

    if (taxedItems === 0) {
      this.applyTaxToAll = false;
      this.applyTaxIndeterminate = false;
      return;
    }

    this.applyTaxToAll = false;
    this.applyTaxIndeterminate = true;
  }

  onSaveSale(): void {

    if (!this.saleId) {
      this.snackBar.open('No se puede actualizar una venta sin id', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.saleForm.invalid) {
      this.saleForm.markAllAsTouched();
      this.snackBar.open('Complete los campos obligatorios del formulario', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.cartItems.length === 0) {
      this.snackBar.open('Debe agregar al menos un producto al carrito', 'Cerrar', { duration: 3000 });
      return;
    }

    const formValues = this.saleForm.getRawValue();
    const subtotal = this.calculatedSubtotal;
    const totalDiscount = Math.max(0, Math.min(Number(formValues.totalDiscount || 0), subtotal));
    const rawTaxRate = Number(this.saleForm.get('totalTaxRate')?.value || 0);
    const taxPercentage = this.normalizePercentage(rawTaxRate);
    const discountPercentage = subtotal > 0 ? this.normalizePercentage(totalDiscount / subtotal) : 0;
    const changedDetails = this.buildChangedDetailsPayload(discountPercentage, taxPercentage);
    const hasHeaderChanges = this.hasHeaderChanges(formValues);

    if (!hasHeaderChanges && changedDetails.length === 0) {
      this.snackBar.open('No hay cambios para actualizar', 'Cerrar', { duration: 3000 });
      return;
    }

    const salePayload: SaleDto = {
      SaleId: this.saleId,
      BusinessId: formValues.businessId,
      CustomerId: formValues.customerId || null,
      DeliveryTypeId: formValues.deliveryTypeId,
      PaymentMethodId: formValues.paymentMethodId,
      SaleNumber: formValues.saleNumber || null,
      SaleStatus: formValues.saleStatus,
      SaleDate: formValues.saleDate,
      DeliveryDate: formValues.deliveryDate,
      Notes: formValues.notes,
      Subtotal: subtotal,
      Total: this.calculatedTotal,
      SaleDetails: changedDetails
    };

    this.saleService.update(salePayload)
      .subscribe({
        next: reps => {
          const dto = reps.Data;

          if (dto) {
            this.snackBar.open('Venta actualizada con éxito', 'Aceptar', { duration: 5000 });
            this.router.navigate(['/sales']);
            return;
          }

          this.snackBar.open(reps.Message || 'No se pudo actualizar la venta', 'Cerrar', { duration: 3000 });
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          const message = this.buildHttpErrorMessage(error, 'Ocurrió un error al actualizar la venta');
          this.snackBar.open(message, 'Cerrar', { duration: 3000 });
        }
      });
  }

  onCancelSale(): void {
    this.router.navigate(['/sales']);
  }

  onCustomerTypeChange(typeId: number): void {
    const found = this.customerTypes.find(t => t.id === typeId);
    if (found) {
      this.selectedCustomer = { id: found.id, name: found.label };
      this.saleForm.get('customerId')?.setValue(null);

      let missingPrices = 0;
      this.cartItems.forEach(item => {
        if (!this.applyCustomerTypeToItem(item, typeId)) {
          missingPrices += 1;
        }
      });

      if (missingPrices > 0) {
        this.snackBar.open(`${missingPrices} producto(s) no tienen precio para este tipo de cliente`, 'Cerrar', { duration: 3000 });
      }

      this.cartItems = [...this.cartItems];
      this.recalculateTotals();
    }
  }

  removeCustomer(): void {
    this.selectedCustomer = null;
    this.saleForm.get('customerId')?.setValue(null);
  }
}
