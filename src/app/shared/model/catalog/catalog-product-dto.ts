import { get } from "https";
import { CatalogProductPriceDto } from "./catalog-product-price-dto";

export class CatalogProductDto {

    public ProductId: number | null = null;
    public CatalogId: number | null = null;
    public SKUCode: string | null = null;
    public BarCode: string | null = null;
    public Name: string | null = null;
    public Description: string | null = null;
    public UnitOfMeasure: string | null = null;
    public ImageUrl: string | null = null;
    public IsActive: boolean | null = null;
    public CreatedDate: Date | null = null;
    public ModifiedDate: Date | null = null;
    public CreatedBy: string | null = null;

    public ProductPrices: CatalogProductPriceDto [] | null = [];

}
