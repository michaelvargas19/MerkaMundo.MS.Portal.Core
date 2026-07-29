import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProductService } from '../../../../core/services/product';
import { Customer } from '../../../../core/services/customer';
import { ResponseDTO } from '../../../../shared/model/common/http/response-dto';
import { CatalogProductDto } from '../../../../shared/model/catalog/catalog-product-dto';
import { CatalogProductPriceDto } from '../../../../shared/model/catalog/catalog-product-price-dto';

interface CustomerTypeView {
  id: number;
  label: string;
  defaultGainPercentage: number;
}

@Component({
  selector: 'app-add-products',
  standalone: false,
  templateUrl: './add-products.html',
  styleUrl: './add-products.css',
})
export class AddProducts implements OnInit {
  @Input() catalogId: number | null = null;
  @Output() productAdded = new EventEmitter<CatalogProductDto>();
  @Output() productEdited = new EventEmitter<void>();
  @Output() formModeChanged = new EventEmitter<boolean>();
  @ViewChild('barcodeInput') private barcodeInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('nameInput') private nameInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('basePriceInput') private basePriceInputRef?: ElementRef<HTMLInputElement>;

  public productForm: FormGroup;
  public isLoading = false;
  public message: string | null = null;
  public hasError = false;
  public detectedProduct: CatalogProductDto | null = null;
  public showNewProductOption = false;
  public addAsNewProduct: boolean | null = null;
  public isDetectedProductEditionMode = false;
  public customerTypes: CustomerTypeView[] = [];
  public isLoadingCustomerTypes = true;

  private barcodeSearchTimer: any = null;
  private barcodeLookupToken = 0;
  private suppressBarcodeLookup = false;
  private initialDetectedPriceByCustomerType = new Map<number, CatalogProductPriceDto>();

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private customerService: Customer,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      barcode: [null, [Validators.required, Validators.minLength(5)]],
      name: [null],
      description: [null],
      unitOfMeasure: [null],
      basePrice: [null],
    });

  }

  ngOnInit(): void {
    this.loadCustomerTypes();
  }

  onBarcodeInputChanged(): void {
    if (this.suppressBarcodeLookup) {
      return;
    }

    this.detectedProduct = null;
    this.isDetectedProductEditionMode = false;
    this.initialDetectedPriceByCustomerType.clear();
    this.message = null;
    this.hasError = false;
    this.showNewProductOption = false;
    this.addAsNewProduct = null;
    this.emitFormMode(false);
    this.setNewProductValidators();
    this.scheduleBarcodeLookup(true);
  }

  onBarcodeBlur(): void {
    // Lookup is handled by debounced input to avoid blur-cycle NG0100.
  }

  selectAddAsNewProduct(selected: boolean): void {
    this.addAsNewProduct = selected;
    this.isDetectedProductEditionMode = false;

    if (selected && !this.isLoadingCustomerTypes && this.customerTypes.length === 0) {
      setTimeout(() => {
        this.loadCustomerTypes();
      }, 0);
    }

    this.setNewProductValidators();

    if (!selected) {
      this.showNewProductOption = false;
      this.addAsNewProduct = null;
      this.message = null;
      this.hasError = false;

      this.productForm.patchValue({
        barcode: null,
        name: null,
        description: null,
        unitOfMeasure: null,
        basePrice: null,
      });

      this.productForm.get('barcode')?.markAsPristine();
      this.productForm.get('barcode')?.markAsUntouched();

      this.resetPricingControlsValues();
      this.emitFormMode(false);
    } else {
      this.productForm.patchValue({
        name: null,
        description: null,
        unitOfMeasure: null,
        basePrice: null,
      }, { emitEvent: false });

      for (const customerType of this.customerTypes) {
        this.productForm.get(this.getSalePriceControlName(customerType.id))?.setValue(null, { emitEvent: false });
      }

      this.applyDefaultGainPercentages();
      this.emitFormMode(true);
      this.focusNameInput();
    }
  }

  onCancelProductForm(): void {
    this.invalidatePendingBarcodeLookup();
    this.resetForm();
    this.hasError = false;
    this.message = null;
    this.emitFormMode(false);
  }

  private loadCustomerTypes(): void {
    this.isLoadingCustomerTypes = true;

    this.customerService.getCustomerTypeList().subscribe({
      next: (response: ResponseDTO<any[]> | any) => {
        this.deferUiState(() => {
          const data = this.extractCustomerTypes(response?.Data ?? response);
          this.customerTypes = data
            .map(item => this.mapCustomerType(item))
            .filter(item => item !== null) as CustomerTypeView[];

          this.configureDynamicPriceControls();
          this.isLoadingCustomerTypes = false;
        });
      },
      error: (error: HttpErrorResponse) => {
        this.deferUiState(() => {
          this.isLoadingCustomerTypes = false;

          if (error.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          this.customerTypes = [];
          this.hasError = true;
          this.message = error.error?.Message || 'No fue posible cargar los tipos de cliente.';
        });
      },
    });
  }

  private extractCustomerTypes(raw: any): any[] {
    if (Array.isArray(raw)) {
      return raw;
    }

    if (!raw || typeof raw !== 'object') {
      return [];
    }

    const knownListKeys = ['Items', 'items', 'Data', 'data', 'CustomerTypes', 'customerTypes', 'List', 'list', '$values'];

    for (const key of knownListKeys) {
      const candidate = raw[key];
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    const firstArray = Object.values(raw).find(value => Array.isArray(value));
    return Array.isArray(firstArray) ? firstArray : [];
  }

  private mapCustomerType(item: any): CustomerTypeView | null {
    const id = Number(item?.CustomerTypeId ?? item?.customerTypeId ?? item?.Id ?? item?.id ?? 0);
    if (!id) {
      return null;
    }

    const label =
      String(item?.Name ?? item?.name ?? item?.CustomerTypeName ?? item?.customerTypeName ?? item?.Label ?? item?.label ?? item?.Description ?? item?.description ?? '').trim() ||
      `Tipo ${id}`;

    const defaultGainPercentage = Number(
      item?.DefaultGainPercentage ??
      item?.defaultGainPercentage ??
      item?.GainPercentage ??
      item?.gainPercentage ??
      item?.MarkupPercentage ??
      item?.markupPercentage ??
      0
    );

    return {
      id,
      label,
      defaultGainPercentage: Number.isFinite(defaultGainPercentage) ? defaultGainPercentage : 0,
    };
  }

  private configureDynamicPriceControls(): void {
    for (const customerType of this.customerTypes) {
      const gainControlName = this.getGainControlName(customerType.id);
      const saleControlName = this.getSalePriceControlName(customerType.id);

      if (!this.productForm.contains(gainControlName)) {
        this.productForm.addControl(gainControlName, this.fb.control(customerType.defaultGainPercentage));
      } else {
        this.productForm.get(gainControlName)?.setValue(customerType.defaultGainPercentage, { emitEvent: false });
      }

      if (!this.productForm.contains(saleControlName)) {
        this.productForm.addControl(saleControlName, this.fb.control(null));
      }
    }

    this.setNewProductValidators();
    this.applyDefaultGainPercentages();
  }

  private applyDefaultGainPercentages(): void {
    for (const customerType of this.customerTypes) {
      this.productForm
        .get(this.getGainControlName(customerType.id))
        ?.setValue(customerType.defaultGainPercentage, { emitEvent: false });

      this.onGainPercentageChanged(customerType.id);
    }
  }

  private resetPricingControlsValues(): void {
    this.productForm.get('basePrice')?.setValue(null, { emitEvent: false });

    for (const customerType of this.customerTypes) {
      this.productForm
        .get(this.getGainControlName(customerType.id))
        ?.setValue(customerType.defaultGainPercentage, { emitEvent: false });
      this.productForm.get(this.getSalePriceControlName(customerType.id))?.setValue(null, { emitEvent: false });
    }
  }

  onBasePriceChanged(): void {
    const base = this.toNumberOrNull(this.productForm.get('basePrice')?.value);

    if (base === null) {
      for (const customerType of this.customerTypes) {
        this.productForm.get(this.getSalePriceControlName(customerType.id))?.setValue(null, { emitEvent: false });
      }
      return;
    }

    for (const customerType of this.customerTypes) {
      const gain = this.toNumberOrNull(this.productForm.get(this.getGainControlName(customerType.id))?.value);
      const sale = this.toNumberOrNull(this.productForm.get(this.getSalePriceControlName(customerType.id))?.value);

      if (gain !== null) {
        const nextSale = this.calculateSalePrice(base, gain);
        this.productForm.get(this.getSalePriceControlName(customerType.id))?.setValue(nextSale, { emitEvent: false });
        continue;
      }

      if (sale !== null && base > 0) {
        const nextGain = this.calculateGainPercentage(base, sale);
        this.productForm.get(this.getGainControlName(customerType.id))?.setValue(nextGain, { emitEvent: false });
      }
    }
  }

  onGainPercentageChanged(customerTypeId: number): void {
    const base = this.toNumberOrNull(this.productForm.get('basePrice')?.value);
    const gain = this.toNumberOrNull(this.productForm.get(this.getGainControlName(customerTypeId))?.value);

    if (base === null || gain === null) {
      return;
    }

    const nextSale = this.calculateSalePrice(base, gain);
    this.productForm.get(this.getSalePriceControlName(customerTypeId))?.setValue(nextSale, { emitEvent: false });
  }

  onSalePriceChanged(customerTypeId: number): void {
    const base = this.toNumberOrNull(this.productForm.get('basePrice')?.value);
    const sale = this.toNumberOrNull(this.productForm.get(this.getSalePriceControlName(customerTypeId))?.value);

    if (base === null || sale === null || base <= 0) {
      return;
    }

    const nextGain = this.calculateGainPercentage(base, sale);
    this.productForm.get(this.getGainControlName(customerTypeId))?.setValue(nextGain, { emitEvent: false });
  }

  onSubmit(): void {
    if (this.isDetectedProductEditionMode) {
      this.onSaveDetectedProductChanges();
      return;
    }

    if (this.addAsNewProduct === true && this.customerTypes.length === 0) {
      this.hasError = true;
      this.message = 'No hay tipos de cliente disponibles para capturar precios.';
      return;
    }

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const barcode = this.getBarcodeValue();
    if (!barcode) {
      return;
    }

    if (this.addAsNewProduct === true) {
      const product = this.detectedProduct
        ? this.createDetectedProductFromForm(barcode)
        : this.createNewProductFromForm(barcode);

      this.productAdded.emit(product);
      this.message = `Producto agregado: ${product.Name || barcode}`;
      this.hasError = false;
      this.resetForm();
      return;
    }

    this.lookupBarcodeAndHandle(barcode, false);
  }

  onSaveDetectedProductChanges(): void {
    if (!this.isDetectedProductEditionMode) {
      return;
    }

    if (this.customerTypes.length === 0) {
      this.hasError = true;
      this.message = 'No hay tipos de cliente disponibles para guardar los precios.';
      return;
    }

    if (this.isDetectedEditFormInvalid()) {
      this.markDetectedEditControlsAsTouched();
      return;
    }

    const barcode = this.getBarcodeValue();
    if (!barcode) {
      return;
    }

    const basePurchasePrice = this.getBasePriceValue();
    if (basePurchasePrice === null) {
      this.hasError = true;
      this.message = 'El precio base es obligatorio para actualizar precios.';
      this.productForm.get('basePrice')?.markAsTouched();
      return;
    }

    if (this.initialDetectedPriceByCustomerType.size === 0 && this.detectedProduct?.ProductPrices?.length) {
      this.captureInitialDetectedPrices(this.detectedProduct.ProductPrices);
    }

    const product = this.createDetectedProductFromForm(barcode);
    const productId = Number(product.ProductId || 0);

    if (!productId) {
      this.hasError = true;
      this.message = 'No fue posible identificar el producto para editar.';
      return;
    }

    const updatePayload = {
      productId,
      skuCode: product.SKUCode,
      barCode: product.BarCode,
      name: product.Name,
      description: product.Description,
      unitOfMeasure: product.UnitOfMeasure,
      isActive: product.IsActive !== false,
    };

    this.isLoading = true;
    this.hasError = false;
    this.message = null;

    this.productService
      .updateProduct(updatePayload)
      .pipe(
        switchMap((updateResponse: ResponseDTO<CatalogProductDto>) => {
          const updatedProductId = Number(updateResponse?.Data?.ProductId || productId);
          const shouldUpdateAllPrices = this.shouldUpdateAllPricesByBasePriceChange();
          const pricesSource = shouldUpdateAllPrices
            ? (product.ProductPrices || [])
            : this.getChangedProductPrices(product.ProductPrices || []);

          const prices = pricesSource.map(item => ({
            ProductPriceId: this.resolveProductPriceId(item),
            ProductId: updatedProductId,
            CustomerTypeId: Number(item.CustomerTypeId || 0),
            Price: Number(item.Price || 0),
            GainPercentage: Number(item.GainPercentage || 0),
            PurchasePrice: basePurchasePrice,
            TotalGain: Number((Number(item.Price || 0) - basePurchasePrice).toFixed(2)),
            IsActive: item.IsActive !== false,
          }));

          const updatablePrices = prices.filter(item => Number(item.ProductPriceId || 0) > 0);
          const skippedCount = prices.length - updatablePrices.length;

          if (skippedCount > 0) {
            this.message = `Se omitieron ${skippedCount} precio(s) porque no tienen ProductPriceId para actualizar.`;
          }

          if (updatablePrices.length === 0) {
            return of([] as ResponseDTO<CatalogProductPriceDto>[]);
          }

          const requests: Observable<ResponseDTO<CatalogProductPriceDto>>[] = updatablePrices.map(price =>
            this.productService.updateProductPrice(price)
          );

          return forkJoin(requests);
        })
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.hasError = false;
          this.message = 'Cambios del producto guardados correctamente.';
          this.productEdited.emit();
          this.resetForm();
        },
        error: (error: HttpErrorResponse) => {
          this.isLoading = false;

          if (error.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          this.hasError = true;
          this.message = error.error?.Message || 'No fue posible guardar la edicion del producto.';
        },
      });
  }

  private scheduleBarcodeLookup(useDelay: boolean): void {
    const barcode = this.getBarcodeValue();

    if (this.barcodeSearchTimer) {
      clearTimeout(this.barcodeSearchTimer);
      this.barcodeSearchTimer = null;
    }

    if (!barcode || barcode.length < 5) {
      return;
    }

    if (!useDelay) {
      this.lookupBarcodeAndHandle(barcode, true);
      return;
    }

    this.barcodeSearchTimer = setTimeout(() => {
      this.lookupBarcodeAndHandle(barcode, true);
    }, 450);
  }

  private lookupBarcodeAndHandle(barcode: string, previewOnly: boolean): void {
    const lookupToken = ++this.barcodeLookupToken;

    this.deferUiState(() => {
      this.message = null;
      this.hasError = false;
    });

    this.productService.getProductByBarCode(barcode).subscribe({
      next: (response: ResponseDTO<CatalogProductDto>) => {
        if (lookupToken !== this.barcodeLookupToken) {
          return;
        }

        this.deferUiState(() => {
          if (lookupToken !== this.barcodeLookupToken) {
            return;
          }

          this.isLoading = false;

          const product = this.normalizeDetectedProduct(response.Data);
          if (!product) {
            this.onBarcodeNotFound(response.Message);
            return;
          }

          this.detectedProduct = product;
          this.showNewProductOption = false;
          this.addAsNewProduct = true;
          this.setNewProductValidators();
          this.loadDetectedProductIntoForm(product, barcode);
          this.isDetectedProductEditionMode = true;
          this.clearAndFocusBarcodeInputWithoutLookup();
          this.emitFormMode(true);
          this.message = `Producto identificado: ${product.Name || barcode}. Ajusta los precios y confirma con "Guardar cambios".`;
          this.hasError = false;
        });
      },
      error: (error: HttpErrorResponse) => {
        if (lookupToken !== this.barcodeLookupToken) {
          return;
        }

        this.deferUiState(() => {
          if (lookupToken !== this.barcodeLookupToken) {
            return;
          }

          this.isLoading = false;

          if (error.status === 401) {
            this.router.navigate(['/login']);
            return;
          }

          this.onBarcodeNotFound(error.error?.Message || 'No fue posible consultar el producto por barCode.');
        });
      },
    });
  }

  private onBarcodeNotFound(message?: string | null): void {
    this.detectedProduct = null;
    this.isDetectedProductEditionMode = false;
    this.showNewProductOption = true;
    this.addAsNewProduct = null;
    this.emitFormMode(false);
    this.setNewProductValidators();
    this.hasError = false;
    this.message = message || 'No existe un producto con ese barCode. ¿Deseas agregarlo como nuevo?';
  }

  private setNewProductValidators(): void {
    const nameControl = this.productForm.get('name');
    const unitControl = this.productForm.get('unitOfMeasure');
    const basePriceControl = this.productForm.get('basePrice');

    if (!nameControl || !unitControl || !basePriceControl) {
      return;
    }

    if (this.addAsNewProduct === true) {
      nameControl.setValidators([Validators.required, Validators.minLength(3)]);
      unitControl.setValidators([Validators.required]);
      basePriceControl.setValidators([Validators.required, Validators.min(0)]);

      for (const customerType of this.customerTypes) {
        this.productForm
          .get(this.getGainControlName(customerType.id))
          ?.setValidators([Validators.required, Validators.min(0)]);
        this.productForm
          .get(this.getSalePriceControlName(customerType.id))
          ?.setValidators([Validators.required, Validators.min(0)]);
      }
    } else {
      nameControl.clearValidators();
      unitControl.clearValidators();
      basePriceControl.clearValidators();

      for (const customerType of this.customerTypes) {
        this.productForm.get(this.getGainControlName(customerType.id))?.clearValidators();
        this.productForm.get(this.getSalePriceControlName(customerType.id))?.clearValidators();
      }
    }

    nameControl.updateValueAndValidity({ emitEvent: false });
    unitControl.updateValueAndValidity({ emitEvent: false });
    basePriceControl.updateValueAndValidity({ emitEvent: false });

    for (const customerType of this.customerTypes) {
      this.productForm.get(this.getGainControlName(customerType.id))?.updateValueAndValidity({ emitEvent: false });
      this.productForm.get(this.getSalePriceControlName(customerType.id))?.updateValueAndValidity({ emitEvent: false });
    }
  }

  private createNewProductFromForm(barcode: string): CatalogProductDto {
    const product = new CatalogProductDto();
    product.ProductId = null;
    product.CatalogId = this.catalogId;
    product.BarCode = barcode;
    product.SKUCode = barcode;
    product.Name = String(this.productForm.get('name')?.value || '').trim();
    product.Description = String(this.productForm.get('description')?.value || '').trim() || null;
    product.UnitOfMeasure = String(this.productForm.get('unitOfMeasure')?.value || '').trim() || null;
    product.IsActive = true;
    product.ProductPrices = this.buildProductPrices();
    return product;
  }

  private createDetectedProductFromForm(barcode: string): CatalogProductDto {
    const detected = this.detectedProduct;
    const product = new CatalogProductDto();

    product.ProductId = detected?.ProductId || null;
    product.CatalogId = this.catalogId;
    product.BarCode = barcode;
    product.SKUCode = detected?.SKUCode || barcode;
    product.Name = String(this.productForm.get('name')?.value || detected?.Name || '').trim() || null;
    product.Description = String(this.productForm.get('description')?.value || detected?.Description || '').trim() || null;
    product.UnitOfMeasure = String(this.productForm.get('unitOfMeasure')?.value || detected?.UnitOfMeasure || '').trim() || null;
    product.IsActive = detected?.IsActive !== false;
    product.ProductPrices = this.buildProductPrices();

    return product;
  }

  private loadDetectedProductIntoForm(product: CatalogProductDto, barcode: string): void {
    const productPrices = product.ProductPrices || [];
    const firstPrice = productPrices.length > 0 ? productPrices[0] : null;
    const hasPurchasePrice = firstPrice?.PurchasePrice !== null && firstPrice?.PurchasePrice !== undefined;
    const basePrice = hasPurchasePrice ? Number(firstPrice?.PurchasePrice) : null;

    this.productForm.patchValue({
      barcode,
      name: product.Name || null,
      description: product.Description || null,
      unitOfMeasure: product.UnitOfMeasure || null,
      basePrice: basePrice,
    });

    for (const customerType of this.customerTypes) {
      const match = productPrices.find(price => Number(price.CustomerTypeId || 0) === customerType.id);
      const gainControl = this.productForm.get(this.getGainControlName(customerType.id));
      const saleControl = this.productForm.get(this.getSalePriceControlName(customerType.id));

      gainControl?.setValue(
        Number(match?.GainPercentage ?? customerType.defaultGainPercentage ?? 0),
        { emitEvent: false }
      );
      saleControl?.setValue(
        match?.Price !== undefined && match?.Price !== null ? Number(match.Price) : null,
        { emitEvent: false }
      );
    }

    this.captureInitialDetectedPrices(productPrices);
  }

  private buildProductPrices(): CatalogProductPriceDto[] {
    const prices: CatalogProductPriceDto[] = [];
    const purchasePrice = this.getBasePriceValue() ?? 0;
    const existingPrices = this.detectedProduct?.ProductPrices || [];
    const detectedProductId = Number(this.detectedProduct?.ProductId || 0) || null;

    for (const customerType of this.customerTypes) {
      const existingPrice = existingPrices.find(
        price => Number(price.CustomerTypeId || 0) === customerType.id
      );
      const initialSnapshot = this.initialDetectedPriceByCustomerType.get(customerType.id);
      const item = new CatalogProductPriceDto();
      const existingPriceId = Number(existingPrice?.ProductPriceId || initialSnapshot?.ProductPriceId || 0);
      item.ProductPriceId = existingPriceId > 0 ? existingPriceId : null;
      item.ProductId = detectedProductId;
      item.CustomerTypeId = customerType.id;
      item.Price = Number(this.productForm.get(this.getSalePriceControlName(customerType.id))?.value || 0);
      item.GainPercentage = Number(this.productForm.get(this.getGainControlName(customerType.id))?.value || 0);
      item.PurchasePrice = purchasePrice;
      item.TotalGain = Number((item.Price - purchasePrice).toFixed(2));
      item.IsActive = existingPrice?.IsActive !== false;
      prices.push(item);
    }

    return prices;
  }

  private captureInitialDetectedPrices(productPrices: CatalogProductPriceDto[]): void {
    this.initialDetectedPriceByCustomerType.clear();

    for (const price of productPrices) {
      const customerTypeId = Number(price.CustomerTypeId || 0);
      if (!customerTypeId) {
        continue;
      }

      const snapshot = new CatalogProductPriceDto();
      snapshot.ProductPriceId = Number(price.ProductPriceId || 0) || null;
      snapshot.ProductId = Number(price.ProductId || 0) || null;
      snapshot.CustomerTypeId = customerTypeId;
      snapshot.Price = Number(price.Price || 0);
      snapshot.GainPercentage = Number(price.GainPercentage || 0);
      snapshot.PurchasePrice = Number(price.PurchasePrice || 0);
      snapshot.TotalGain = Number(price.TotalGain || 0);
      snapshot.IsActive = price.IsActive !== false;

      this.initialDetectedPriceByCustomerType.set(customerTypeId, snapshot);
    }
  }

  private getChangedProductPrices(prices: CatalogProductPriceDto[]): CatalogProductPriceDto[] {
    const changed: CatalogProductPriceDto[] = [];
    const basePriceDirty = !!this.productForm.get('basePrice')?.dirty;

    for (const price of prices) {
      const customerTypeId = Number(price.CustomerTypeId || 0);
      const priceControlDirty = this.isAnyPriceControlDirty(customerTypeId);
      const initial = this.initialDetectedPriceByCustomerType.get(customerTypeId);

      if (!initial) {
        if (priceControlDirty || basePriceDirty) {
          changed.push(price);
        }
        continue;
      }

      if (!priceControlDirty && !basePriceDirty) {
        continue;
      }

      const changedPrice = !this.areNumbersEqual(initial.Price, price.Price);
      const changedGain = !this.areNumbersEqual(initial.GainPercentage, price.GainPercentage);
      const changedPurchase = !this.areNumbersEqual(initial.PurchasePrice, price.PurchasePrice);
      const changedActive = (initial.IsActive !== false) !== (price.IsActive !== false);

      if (changedPrice || changedGain || changedPurchase || changedActive) {
        changed.push(price);
      }
    }

    return changed;
  }

  private areNumbersEqual(left: number | null | undefined, right: number | null | undefined): boolean {
    const a = Number(left || 0);
    const b = Number(right || 0);
    return Math.abs(a - b) < 0.0001;
  }

  private isAnyPriceControlDirty(customerTypeId: number): boolean {
    const gainDirty = !!this.productForm.get(this.getGainControlName(customerTypeId))?.dirty;
    const saleDirty = !!this.productForm.get(this.getSalePriceControlName(customerTypeId))?.dirty;
    return gainDirty || saleDirty;
  }

  private shouldUpdateAllPricesByBasePriceChange(): boolean {
    if (!this.productForm.get('basePrice')?.dirty) {
      return false;
    }

    const currentBasePrice = this.getBasePriceValue();
    if (currentBasePrice === null) {
      return false;
    }

    const firstInitial = this.initialDetectedPriceByCustomerType.values().next().value as CatalogProductPriceDto | undefined;
    if (!firstInitial) {
      return true;
    }

    return !this.areNumbersEqual(Number(firstInitial.PurchasePrice || 0), currentBasePrice);
  }

  private normalizeDetectedProduct(raw: CatalogProductDto | null | undefined): CatalogProductDto | null {
    if (!raw) {
      return null;
    }

    const source: any = raw;
    const product = new CatalogProductDto();
    product.ProductId = Number(source.ProductId ?? source.productId ?? 0) || null;
    product.CatalogId = Number(source.CatalogId ?? source.catalogId ?? 0) || null;
    product.SKUCode = source.SKUCode ?? source.skuCode ?? null;
    product.BarCode = source.BarCode ?? source.barCode ?? null;
    product.Name = source.Name ?? source.name ?? null;
    product.Description = source.Description ?? source.description ?? null;
    product.UnitOfMeasure = source.UnitOfMeasure ?? source.unitOfMeasure ?? null;
    product.IsActive = source.IsActive ?? source.isActive ?? null;

    const rawPrices = source.ProductPrices ?? source.productPrices ?? [];
    product.ProductPrices = this.normalizeDetectedProductPrices(rawPrices, product.ProductId);

    return product;
  }

  private normalizeDetectedProductPrices(rawPrices: any, fallbackProductId: number | null): CatalogProductPriceDto[] {
    const pricesArray = this.extractPriceList(rawPrices);

    return pricesArray.map(price => {
      const source: any = price;
      const normalized = new CatalogProductPriceDto();
      normalized.ProductPriceId = Number(
        source.ProductPriceId ??
        source.productPriceId ??
        source.ProductPriceID ??
        source.productPriceID ??
        source.CatalogProductPriceId ??
        source.catalogProductPriceId ??
        source.PriceId ??
        source.priceId ??
        source.ProductPrice?.ProductPriceId ??
        source.Id ??
        source.id ??
        0
      ) || null;
      normalized.ProductId = Number(source.ProductId ?? source.productId ?? fallbackProductId ?? 0) || null;
      normalized.CustomerTypeId = Number(
        source.CustomerTypeId ??
        source.customerTypeId ??
        source.CustomerTypeID ??
        source.customerTypeID ??
        source.CustomerType?.CustomerTypeId ??
        source.CustomerType?.customerTypeId ??
        source.CustomerType?.Id ??
        source.customerType?.id ??
        0
      );
      normalized.Price = Number(source.Price ?? source.price ?? 0);
      normalized.GainPercentage = Number(source.GainPercentage ?? source.gainPercentage ?? 0);
      normalized.PurchasePrice = Number(source.PurchasePrice ?? source.purchasePrice ?? 0);
      normalized.TotalGain = Number(source.TotalGain ?? source.totalGain ?? (normalized.Price - normalized.PurchasePrice));
      normalized.IsActive = source.IsActive ?? source.isActive ?? true;
      return normalized;
    });
  }

  private resolveProductPriceId(item: CatalogProductPriceDto): number | null {
    const directId = Number(item.ProductPriceId || 0);
    if (directId > 0) {
      return directId;
    }

    const customerTypeId = Number(item.CustomerTypeId || 0);
    const fromInitial = Number(this.initialDetectedPriceByCustomerType.get(customerTypeId)?.ProductPriceId || 0);
    if (fromInitial > 0) {
      return fromInitial;
    }

    const fromDetected = Number(
      this.detectedProduct?.ProductPrices?.find(price => Number(price.CustomerTypeId || 0) === customerTypeId)?.ProductPriceId || 0
    );

    return fromDetected > 0 ? fromDetected : null;
  }

  private extractPriceList(rawPrices: any): any[] {
    if (Array.isArray(rawPrices)) {
      return rawPrices;
    }

    if (!rawPrices || typeof rawPrices !== 'object') {
      return [];
    }

    const candidates = [
      rawPrices.$values,
      rawPrices.Values,
      rawPrices.values,
      rawPrices.Items,
      rawPrices.items,
      rawPrices.Data,
      rawPrices.data,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }

  private getGainControlName(customerTypeId: number): string {
    return `gainPercentageType${customerTypeId}`;
  }

  private getSalePriceControlName(customerTypeId: number): string {
    return `salePriceType${customerTypeId}`;
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private getBasePriceValue(): number | null {
    const raw = this.productForm.get('basePrice')?.value;

    if (raw === null || raw === undefined || raw === '') {
      return null;
    }

    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null;
    }

    const normalized = String(raw).trim().replace(',', '.');
    if (!normalized) {
      return null;
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private calculateSalePrice(basePrice: number, gainPercentage: number): number {
    return Number((basePrice * (1 + gainPercentage / 100)).toFixed(2));
  }

  private calculateGainPercentage(basePrice: number, salePrice: number): number {
    if (basePrice <= 0) {
      return 0;
    }

    return Number((((salePrice - basePrice) / basePrice) * 100).toFixed(2));
  }

  private getBarcodeValue(): string {
    const barcode = String(this.productForm.get('barcode')?.value || '').trim();

    if (barcode) {
      return barcode;
    }

    if (this.isDetectedProductEditionMode) {
      return String(this.detectedProduct?.BarCode || '').trim();
    }

    return '';
  }

  public isInvalidControl(controlName: string): boolean {
    const control = this.productForm.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  public isBasePriceChanged(): boolean {
    if (!this.isDetectedProductEditionMode) {
      return false;
    }

    if (!this.productForm.get('basePrice')?.dirty) {
      return false;
    }

    const currentBasePrice = Number(this.productForm.get('basePrice')?.value || 0);
    const firstInitial = this.initialDetectedPriceByCustomerType.values().next().value as CatalogProductPriceDto | undefined;
    const initialBasePrice = Number(firstInitial?.PurchasePrice || 0);
    return !this.areNumbersEqual(initialBasePrice, currentBasePrice);
  }

  public isProductPriceChanged(customerTypeId: number): boolean {
    if (!this.isDetectedProductEditionMode) {
      return false;
    }

    if (!this.isAnyPriceControlDirty(customerTypeId) && !this.productForm.get('basePrice')?.dirty) {
      return false;
    }

    const current = this.getCurrentProductPriceSnapshot(customerTypeId);
    const initial = this.initialDetectedPriceByCustomerType.get(customerTypeId);

    if (!initial) {
      return this.isAnyPriceControlDirty(customerTypeId) || !!this.productForm.get('basePrice')?.dirty;
    }

    const changedPrice = !this.areNumbersEqual(initial.Price, current.Price);
    const changedGain = !this.areNumbersEqual(initial.GainPercentage, current.GainPercentage);
    const changedPurchase = !this.areNumbersEqual(initial.PurchasePrice, current.PurchasePrice);
    const changedActive = (initial.IsActive !== false) !== (current.IsActive !== false);

    return changedPrice || changedGain || changedPurchase || changedActive;
  }

  public isGainFieldChanged(customerTypeId: number): boolean {
    if (!this.isDetectedProductEditionMode) {
      return false;
    }

    if (!this.productForm.get(this.getGainControlName(customerTypeId))?.dirty) {
      return false;
    }

    const currentGain = Number(this.productForm.get(this.getGainControlName(customerTypeId))?.value || 0);
    const initial = this.initialDetectedPriceByCustomerType.get(customerTypeId);
    if (!initial) {
      return true;
    }
    return !this.areNumbersEqual(Number(initial?.GainPercentage || 0), currentGain);
  }

  public isSaleFieldChanged(customerTypeId: number): boolean {
    if (!this.isDetectedProductEditionMode) {
      return false;
    }

    if (!this.productForm.get(this.getSalePriceControlName(customerTypeId))?.dirty) {
      return false;
    }

    const currentSale = Number(this.productForm.get(this.getSalePriceControlName(customerTypeId))?.value || 0);
    const initial = this.initialDetectedPriceByCustomerType.get(customerTypeId);
    if (!initial) {
      return true;
    }
    return !this.areNumbersEqual(Number(initial?.Price || 0), currentSale);
  }

  private getCurrentProductPriceSnapshot(customerTypeId: number): CatalogProductPriceDto {
    const current = new CatalogProductPriceDto();
    const existing = (this.detectedProduct?.ProductPrices || []).find(
      price => Number(price.CustomerTypeId || 0) === customerTypeId
    );

    current.ProductPriceId = Number(existing?.ProductPriceId || 0) || null;
    current.ProductId = Number(this.detectedProduct?.ProductId || 0) || null;
    current.CustomerTypeId = customerTypeId;
    current.Price = Number(this.productForm.get(this.getSalePriceControlName(customerTypeId))?.value || 0);
    current.GainPercentage = Number(this.productForm.get(this.getGainControlName(customerTypeId))?.value || 0);
    current.PurchasePrice = Number(this.productForm.get('basePrice')?.value || 0);
    current.TotalGain = Number((current.Price - current.PurchasePrice).toFixed(2));
    current.IsActive = existing?.IsActive !== false;

    return current;
  }

  private isDetectedEditFormInvalid(): boolean {
    const controlNames = [
      'name',
      'unitOfMeasure',
      'basePrice',
      ...this.customerTypes.flatMap(customerType => [
        this.getGainControlName(customerType.id),
        this.getSalePriceControlName(customerType.id),
      ]),
    ];

    return controlNames.some(controlName => !!this.productForm.get(controlName)?.invalid);
  }

  private markDetectedEditControlsAsTouched(): void {
    const controlNames = [
      'name',
      'unitOfMeasure',
      'basePrice',
      ...this.customerTypes.flatMap(customerType => [
        this.getGainControlName(customerType.id),
        this.getSalePriceControlName(customerType.id),
      ]),
    ];

    for (const controlName of controlNames) {
      this.productForm.get(controlName)?.markAsTouched();
    }
  }

  private deferUiState(action: () => void): void {
    setTimeout(() => {
      action();
    }, 0);
  }

  private resetForm(): void {
    this.invalidatePendingBarcodeLookup();

    if (this.barcodeSearchTimer) {
      clearTimeout(this.barcodeSearchTimer);
      this.barcodeSearchTimer = null;
    }

    this.detectedProduct = null;
    this.isDetectedProductEditionMode = false;
    this.initialDetectedPriceByCustomerType.clear();
    this.showNewProductOption = false;
    this.addAsNewProduct = null;
    this.emitFormMode(false);
    this.setNewProductValidators();
    this.productForm.reset({
      barcode: null,
      name: null,
      description: null,
      unitOfMeasure: null,
      basePrice: null,
    });

    this.resetPricingControlsValues();
  }

  private invalidatePendingBarcodeLookup(): void {
    this.barcodeLookupToken++;
  }

  private emitFormMode(isActive: boolean): void {
    this.formModeChanged.emit(isActive);
  }

  private focusNameInput(): void {
    setTimeout(() => {
      this.nameInputRef?.nativeElement?.focus();
    }, 0);
  }

  private focusBasePriceInput(): void {
    setTimeout(() => {
      this.basePriceInputRef?.nativeElement?.focus();
    }, 0);
  }

  private clearAndFocusBarcodeInputWithoutLookup(): void {
    this.suppressBarcodeLookup = true;

    this.productForm.get('barcode')?.setValue(null, { emitEvent: false });
    this.productForm.get('barcode')?.markAsPristine();
    this.productForm.get('barcode')?.markAsUntouched();

    setTimeout(() => {
      this.barcodeInputRef?.nativeElement?.focus();
      this.suppressBarcodeLookup = false;
    }, 0);
  }
}
