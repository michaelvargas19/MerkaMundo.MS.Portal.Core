import { BusinessDto } from '../business/business-dto';

export class CatalogDto {
	public CatalogId: number | null = null;
	public Name: string | null = null;
	public Description: string | null = null;
	public IsActive: boolean | null = null;
	public BusinessName: string | null = null;
	public Business: BusinessDto | null = null;
	public ModifiedDate: Date | string | null = null;
}
