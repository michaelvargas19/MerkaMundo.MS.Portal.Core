import { CustomerDto } from '../../../shared/model/customer/customer-dto';

export class DailySales {
  public SaleId: number | null = null;
  public SaleStatus: string | null = null;
  public Customer: CustomerDto | null = null;
  public Client: string | null = null;
  public ItemsCount: number | null = null;
  public Total: number | null = null;
  public PaymentMethod: string | null = null;
  public IsDelivery: boolean | null = null;
  public DeliveryTypeName: string | null = null;
  public Time: string | null = null;

}
