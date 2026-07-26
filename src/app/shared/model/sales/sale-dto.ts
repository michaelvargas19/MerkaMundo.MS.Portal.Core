import { SaleDetailDto } from "./sale-detail-dto";

export class SaleDto {
  public SaleId: number|null = null;
  public BusinessId: number|null = null;
  public CustomerId: number | null = null;
  public DeliveryTypeId: number|null = null;
  public PaymentMethodId: number|null = null;
  public SaleNumber: string | null = null;
  public SaleStatus: string | null = null;
  public SaleDate: Date|null = null;
  public DeliveryDate: Date | null = null;
  public Notes: string|null = null;
  public Subtotal: number|null = null;
  public TotalDiscount: number|null = null;
  public TotalTax: number|null = null;
  public Total: number|null = null;
  public Details: SaleDetailDto[]|null = null;
  // Los campos de auditoría (CreatedDate, CreatedBy, ModifiedDate, ModifiedBy)
  // son gestionados en el backend.
}