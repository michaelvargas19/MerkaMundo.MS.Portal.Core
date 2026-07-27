import { Component, inject, OnInit } from '@angular/core';
import { ProductService } from '../../../../core/services/product';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SaleDetailDto } from '../../../../shared/model/sales/sale-detail-dto';
import { SaleDto } from '../../../../shared/model/sales/sale-dto';
import { Router } from '@angular/router';
import { ResponseDTO } from '../../../../shared/model/common/http/response-dto';
import { CatalogProductDto } from '../../../../shared/model/catalog/catalog-product-dto';
import { HttpErrorResponse } from '@angular/common/http';


@Component({
  selector: 'app-create-sale',
  standalone: false,
  templateUrl: './create-sale.html',
  styleUrl: './create-sale.css',
})
export class CreateSale implements OnInit{
  
  public currentDate: Date = new Date();

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
  applyTaxToAll = true;
  applyTaxIndeterminate = false;

  displayedColumns: string[] = ['barcode', 'productName', 'productType', 'itemCustomerType', 'unitPrice', 'quantity', 'subtotal', 'itemTax', 'applyTax', 'actions'];

  // Listas de selección
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

  ngOnInit(): void {
    this.initForms();
  }

  constructor(private productService: ProductService, private router: Router) {}

  private initForms(): void {
    // Formulario de Búsqueda
    this.filterForm = this.fb.group({
      barcode: ['9786289584271'],
      productType: ['ALL'],
      searchTerm: ['']
    });

    // Formulario Principal DTO
    this.saleForm = this.fb.group({
      businessId: [1, [Validators.required]],
      customerId: [1],
      customerTypeId: [null],
      deliveryTypeId: [1, [Validators.required]],
      paymentMethodId: [1, [Validators.required]],
      saleNumber: [{ value: 'VTA-AUTOGEN', disabled: true }],
      saleStatus: ['Completada', [Validators.required]],
      saleDate: [new Date(), [Validators.required]],
      deliveryDate: [null],
      notes: [''],
      totalDiscount: [0, [Validators.min(0)]],
      totalTaxRate: [0.19] // 19% IVA por defecto
    });

    this.customerForm = this.fb.group({
      customerTypeId: [null, [Validators.required]]
    });

    // Recalcular montos al cambiar descuento
    this.saleForm.get('totalDiscount')?.valueChanges.subscribe(() => this.recalculateTotals());
    this.saleForm.get('totalTaxRate')?.valueChanges.subscribe(() => {
      this.cartItems.forEach(item => this.calculateItemAmounts(item));
      this.recalculateTotals();
    });
  }

  onSearchByBarCode(): void {
    var barcode = this.filterForm.value.barcode;

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
    });
    this.recalculateTotals();
  }

  onItemApplyTaxChange(item: SaleDetailDto, isChecked: boolean): void {
    item.ApplyTax = isChecked;
    this.calculateItemAmounts(item);
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
    this.cartItems = [...this.cartItems];
    this.recalculateTotals();
  }

  removeItem(element: SaleDetailDto): void {
    this.cartItems = this.cartItems.filter(item => item.ProductId !== element.ProductId);
    this.updateGeneralTaxToggleState();
    this.recalculateTotals();
  }

  // --- Campos Calculados ---
  get calculatedSubtotal(): number {
    return this.cartItems.reduce((acc, item) => acc + Number(item.Subtotal?.toString() || 0), 0);
  }

  get calculatedTax(): number {
    return this.cartItems.reduce((acc, item) => {
      return acc + Number(item.TaxAmount?.toString() || 0);
    }, 0);
  }

  get calculatedTotal(): number {
    const discount = this.saleForm.get('totalDiscount')?.value || 0;
    return Math.max(0, this.calculatedSubtotal - discount);
  }

  get totalItemsCount(): number {
    return this.cartItems.reduce((acc, item) => acc + (item.Quantity || 0), 0);
  }

  private recalculateTotals(): void {
    // Dispara la actualización visual en Angular
    this.cartItems = [...this.cartItems];
  }

  private calculateItemAmounts(item: SaleDetailDto): void {
    const quantity = Number(item.Quantity?.toString() || 0);
    const unitPrice = Number(item.UnitPrice?.toString() || 0);
    const taxRate = Number(this.saleForm.get('totalTaxRate')?.value || 0);
    const applyTax = item.ApplyTax !== false;
    const itemSubtotal = quantity * unitPrice;
    const itemTax = applyTax && taxRate > 0 ? itemSubtotal * (taxRate / (1 + taxRate)) : 0;

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
    item.UnitPrice = match.Price;
    item.HasMissingCustomerTypePrice = false;
    this.calculateItemAmounts(item);
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
                
          var UnitPrice = 0;
          var customerTypeId = this.customerForm.get('customerTypeId')?.value          
          var customerType = this.customerTypes.filter(ct => ct.id === customerTypeId)[0];

          if(!customerTypeId || !customerType){
            this.snackBar.open('Seleccione un tipo de cliente antes de agregar productos', 'Cerrar', { duration: 3000 });
            return;
          }

          var productPrices = dto.ProductPrices ? dto.ProductPrices.filter(pp => pp.CustomerTypeId === customerTypeId) : null;

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
          item.UnitPrice = UnitPrice;
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
    } else {
      product.Quantity = product.Quantity || 1;
      product.ApplyTax = product.ApplyTax ?? this.applyTaxToAll;
      this.calculateItemAmounts(product);
      this.cartItems.push(product);
    }

    this.updateGeneralTaxToggleState();
    this.cartItems = [...this.cartItems];
    this.recalculateTotals();
  }

  private updateGeneralTaxToggleState(): void {
    if (this.cartItems.length === 0) {
      this.applyTaxToAll = true;
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

    // Mapeo final al DTO de Backend
    const salePayload: SaleDto = {
      SaleId: 0,
      BusinessId: formValues.businessId,
      CustomerId: formValues.customerId || null,
      DeliveryTypeId: formValues.deliveryTypeId,
      PaymentMethodId: formValues.paymentMethodId,
      SaleNumber: null, // Asignado por backend
      SaleStatus: formValues.saleStatus,
      SaleDate: formValues.saleDate,
      DeliveryDate: formValues.deliveryDate,
      Notes: formValues.notes,
      Subtotal: this.calculatedSubtotal,
      TotalDiscount: formValues.totalDiscount || 0,
      TotalTax: this.calculatedTax,
      Total: this.calculatedTotal,
      Details: this.cartItems
    };

    console.log('DTO a enviar al endpoint POST /api/Sales:', salePayload);
    
    this.snackBar.open('Venta registrada con éxito', 'Aceptar', { duration: 5000 });
    this.onCancelSale();
  }

  onCancelSale(): void {
    this.cartItems = [];
    this.applyTaxToAll = true;
    this.applyTaxIndeterminate = false;
    this.filterForm.reset({ productType: 'ALL', barcode: '', searchTerm: '' });
    this.saleForm.reset({
      businessId: 1,
      customerId: 1,
      deliveryTypeId: 1,
      paymentMethodId: 1,
      saleNumber: 'VTA-AUTOGEN',
      saleStatus: 'Completada',
      saleDate: new Date(),
      deliveryDate: null,
      notes: '',
      totalDiscount: 0,
      totalTaxRate: 0.19
    });
  }



  onCustomerTypeChange(typeId: number): void {
    const found = this.customerTypes.find(t => t.id === typeId);
    if (found) {
      this.selectedCustomer = { id: found.id, name: found.label };
      this.saleForm.get('customerId')?.setValue(typeId);

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
