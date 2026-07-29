import { SaleDetailDto } from "./sale-detail-dto";
import { SaleDeliveryTypeDto } from "./sale-delivery-type-dto";
import { SalePaymentMethodDto } from "./sale-payment-method-dto";

export class SaleDto {
  public SaleId: number|null = null;
  public BusinessId: number|null = null;
  public CustomerId: number | null = null;
  public DeliveryTypeId: number|null = null;
  public DeliveryType?: SaleDeliveryTypeDto | null = null;
  public PaymentMethodId: number|null = null;
  public PaymentMethod?: SalePaymentMethodDto | null = null;
  public SaleNumber: string | null = null;
  public SaleStatus: string | null = null;
  public SaleDate: Date|null = null;
  public DeliveryDate: Date | null = null;
  public Notes: string|null = null;
  public Subtotal: number|null = null;
  public TotalDiscount?: number|null = null;
  public DiscountPercentage?: number|null = null;
  public TaxPercentage?: number|null = null;
  public TotalTax?: number|null = null;
  public Total: number|null = null;
  public SaleDetails?: SaleDetailDto[]|null = null;
  // Los campos de auditoría (CreatedDate, CreatedBy, ModifiedDate, ModifiedBy)
  // son gestionados en el backend.
}