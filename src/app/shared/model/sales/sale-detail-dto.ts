import { CatalogProductPriceDto } from '../catalog/catalog-product-price-dto';

export class SaleDetailDto {
  ProductId: number | null = null;
  ProductPriceId: number | null = null;
  Barcode: string | null = null;
  ProductName: string | null = null;
  ProductType: string | null = null;
  CustomerTypeId: number | null = null;
  UnitPrice: number | null = null;
  ProductPrices: CatalogProductPriceDto[] | null = [];
  Quantity: number | null = null;
  Subtotal: number | null = null;
  TotalDiscount: number | null = null;
  DiscountPercentage: number | null = null;
  TaxPercentage: number | null = null;
  TotalTax: number | null = null;
  TaxAmount: number | null = null;
  SubtotalWithoutTax: number | null = null;
  ApplyTax: boolean | null = null;
  HasMissingCustomerTypePrice: boolean | null = null;
  IsModified: boolean | null = null;
  IsNew: boolean | null = null;
  IsDeleted: boolean | null = null;
}
