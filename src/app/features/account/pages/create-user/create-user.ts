import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../../core/services/account';
import { RoleService } from '../../../../core/services/role';
import { AspNetUsersDTO } from '../../../../shared/model/account/asp-net-users-dto';
import { AspNetRolesDTO } from '../../../../shared/model/account/asp-net-roles-dto';

// Requires a valid TLD (e.g. .com, .co, .es)
const emailTldValidator: ValidatorFn = (ctrl: AbstractControl): ValidationErrors | null => {
  const value: string = ctrl.value || '';
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value) ? null : { emailTld: true };
};

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirmCtrl = group.get('confirmPassword');
  if (!confirmCtrl) return null;

  if (pass !== confirmCtrl.value) {
    confirmCtrl.setErrors({ ...confirmCtrl.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  }

  const errors = { ...confirmCtrl.errors };
  delete errors['passwordMismatch'];
  confirmCtrl.setErrors(Object.keys(errors).length ? errors : null);
  return null;
}

@Component({
  selector: 'app-create-user',
  standalone: false,
  templateUrl: './create-user.html',
  styleUrl: './create-user.css',
})
export class CreateUser implements OnInit {
  form!: FormGroup;
  roles: AspNetRolesDTO[] = [];
  isLoadingRoles = true;
  isSaving = false;
  errorMessage: string | null = null;
  showPassword = false;
  showConfirm = false;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private roleService: RoleService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {
    this.form = this.fb.group({
      username:        ['', [Validators.required, Validators.minLength(4)]],
      email:           ['', [Validators.required, Validators.email, emailTldValidator]],
      password:        ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      phone:           [''],
      firstName:       ['', Validators.required],
      middleName:      [''],
      lastName:        ['', Validators.required],
      secondLastName:  [''],
      roleIds:         [[]],
    }, { validators: passwordMatchValidator });
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.roleService.list().subscribe({
      next: response => {
        this.roles = (response.Data as unknown as AspNetRolesDTO[]) ?? [];
        this.isLoadingRoles = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoadingRoles = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = null;

    const v = this.form.value;
    const user = new AspNetUsersDTO();
    user.UserName       = v.username;
    user.Email          = v.email;
    user.Password       = v.password;
    user.PhoneNumber    = v.phone || null;
    user.FirstName      = v.firstName;
    user.MiddleName     = v.middleName || null;
    user.LastName       = v.lastName;
    user.SecondLastName = v.secondLastName || null;
    user.RoleIds        = v.roleIds ?? [];

    this.accountService.register(user).subscribe({
      next: () => {
        this.isSaving = false;
        this.router.navigate(['/accounts']);
      },
      error: err => {
        this.isSaving = false;
        this.errorMessage = err.error?.Message || 'No fue posible registrar el usuario.';
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/accounts']);
  }
}

