export class AspNetUsersDTO {
  public Id: string | null = null;
  public UserName: string | null = null;
  public NormalizedUserName: string | null = null;
  public Email: string | null = null;
  public NormalizedEmail: string | null = null;
  public EmailConfirmed: boolean | null = null;
  public Password: string | null = null;
  public PhoneNumber: string | null = null;
  public FirstName: string | null = null;
  public MiddleName: string | null = null;
  public LastName: string | null = null;
  public SecondLastName: string | null = null;
  public RoleIds: string[] | null = null;
  public IsActive: boolean | null = null;
  public CreatedDate: Date | string | null = null;
}
