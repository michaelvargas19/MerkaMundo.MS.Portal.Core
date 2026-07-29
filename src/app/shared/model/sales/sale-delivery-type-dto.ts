export class SaleDeliveryTypeDto {
  public DeliveryTypeId: number | null = null;
  public Code: string | null = null;
  public Name: string | null = null;
  public Description: string | null = null;
  public IsActive: boolean = true;
  public CreatedDate: Date | string = new Date();
}
