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
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  customerTypes = [
    { id: 1, label: 'Público' },
    { id: 2, label: 'Cliente' },
    { id: 3, label: 'Mayorista' }
  ];

  selectedCustomer: { id: number | null; name: string } | null = null;
  
  saleForm!: FormGroup;
  filterForm!: FormGroup;
  cartItems: SaleDetailDto[] = [];

  displayedColumns: string[] = ['barcode', 'productName', 'productType', 'unitPrice', 'quantity', 'subtotal', 'actions'];

  // Listas de selección
  productTypes = [
    { value: 'ALL', label: 'Todos los tipos' },
    { value: 'Abarrotes', label: 'Abarrotes' },
    { value: 'Lácteos', label: 'Lácteos' },
    { value: 'Bebidas', label: 'Bebidas' },
    { value: 'Aseo', label: 'Cuidado Personal y Aseo' }
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

    // Recalcular montos al cambiar descuento
    this.saleForm.get('totalDiscount')?.valueChanges.subscribe(() => this.recalculateTotals());
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

  updateQuantity(element: SaleDetailDto, newQuantity: number | string): void {
    const qty = Number(newQuantity);

    if (isNaN(qty) || qty <= 0) {
      this.removeItem(element);
      return;
    }

    element.Quantity = qty;
    element.Subtotal = element.Quantity * Number(element.UnitPrice?.toString() || 0);
    this.cartItems = [...this.cartItems];
    this.recalculateTotals();
  }

  removeItem(element: SaleDetailDto): void {
    this.cartItems = this.cartItems.filter(item => item.ProductId !== element.ProductId);
    this.recalculateTotals();
  }

  // --- Campos Calculados ---
  get calculatedSubtotal(): number {
    return this.cartItems.reduce((acc, item) => acc + Number(item.Subtotal?.toString() || 0), 0);
  }

  get calculatedTax(): number {
    const taxRate = this.saleForm.get('totalTaxRate')?.value || 0;
    const discount = this.saleForm.get('totalDiscount')?.value || 0;
    const taxableBase = Math.max(0, this.calculatedSubtotal - discount);
    return taxableBase * taxRate;
  }

  get calculatedTotal(): number {
    const discount = this.saleForm.get('totalDiscount')?.value || 0;
    return Math.max(0, this.calculatedSubtotal - discount) + this.calculatedTax;
  }

  get totalItemsCount(): number {
    return this.cartItems.reduce((acc, item) => acc + (item.Quantity || 0), 0);
  }

  private recalculateTotals(): void {
    // Dispara la actualización visual en Angular
    this.cartItems = [...this.cartItems];
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

          const item = new SaleDetailDto();
          item.ProductId = dto.ProductId;
          item.Barcode = dto.BarCode;
          item.ProductName = dto.Name;
          item.ProductType = dto.UnitOfMeasure;
          item.UnitPrice = 0;
          item.Quantity = 1;
          item.Subtotal = item.UnitPrice;

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
      existingItem.Subtotal = existingItem.Quantity * Number(existingItem.UnitPrice?.toString() || 0);
    } else {
      product.Quantity = product.Quantity || 1;
      product.Subtotal = product.Quantity * Number(product.UnitPrice?.toString() || 0);
      this.cartItems.push(product);
    }

    this.cartItems = [...this.cartItems];
    this.recalculateTotals();
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
    this.snackBar.open('Venta registrada con éxito', 'Aceptar', { duration: 3000 });
    this.onCancelSale();
  }

  onCancelSale(): void {
    this.cartItems = [];
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
    }
  }

  removeCustomer(): void {
    this.selectedCustomer = null;
    this.saleForm.get('customerId')?.setValue(null);
  }
  
}
