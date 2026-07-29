export class BusinessDto {
  public BusinessId: number | null = null;
  public Code: string | null = null;
  public BusinessName: string | null = null;
  public TaxId: string | null = null;
  public Address: string | null = null;
  public Phone: string | null = null;
  public Email: string | null = null;
  public LogoUrl: string | null = null;
  public TaxRegime: string | null = null;
  public TaxResolution: string | null = null;
  public IsActive: boolean | null = null;
  public CreatedDate: Date | string | null = null;
  public ModifiedDate: Date | string | null = null;
  public CreatedBy: string | null = null;
}
