import { CatalogProductPriceDto } from '../catalog/catalog-product-price-dto';

export class SaleDetailDto {
  ProductId: number | null = null;
  Barcode: string | null = null;
  ProductName: string | null = null;
  ProductType: string | null = null;
  CustomerTypeId: number | null = null;
  UnitPrice: number | null = null;
  ProductPrices: CatalogProductPriceDto[] | null = [];
  Quantity: number | null = null;
  Subtotal: number | null = null;
  TaxAmount: number | null = null;
  SubtotalWithoutTax: number | null = null;
  ApplyTax: boolean | null = null;
  HasMissingCustomerTypePrice: boolean | null = null;
}
