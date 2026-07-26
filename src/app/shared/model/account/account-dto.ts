export class AccountDTO {

    public Id: string | null = null;
    public UserName: string | null = null;
    public Email: string | null = null;
    public EmailConfirmed: boolean | null = null;
    public PhoneNumber: string | null = null;
    public PhoneNumberConfirmed: boolean | null = null;
    public TwoFactorEnabled: boolean | null = null;
    public LockoutEnd: Date | null = null;
    public FirstName: string | null = null;
    public MiddleName: string | null = null;
    public LastName: string | null = null;
    public SecondLastName: string | null = null;
    public IsActive: boolean | null = null;
    public CreatedDate: Date | null = null;
    public JWT: string | null = null;
    
}