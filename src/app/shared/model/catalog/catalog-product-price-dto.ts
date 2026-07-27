export class CatalogProductPriceDto {
    
  public ProductPriceId: number | null = null;
  public ProductId: number = 0;
  public CustomerTypeId: number = 0;
  public Price: number = 0;
  public TaxPercentage: number = 0;
  public ValidFrom: Date | string = new Date();
  public ValidTo: Date | string | null = null;
  public IsActive: boolean = true;
  public CreatedDate: Date | string = new Date();
  public ModifiedDate: Date | string | null = null;
  public CreatedBy: string | null = null;
}
