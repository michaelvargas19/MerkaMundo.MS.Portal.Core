import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AccountService } from '../../../../core/services/account';
import { AspNetUsersDTO } from '../../../../shared/model/account/asp-net-users-dto';
import { UpdateUserStateDTO } from '../../../../shared/model/account/update-user-state-dto';

@Component({
  selector: 'app-accounts',
  standalone: false,
  templateUrl: './accounts.html',
  styleUrl: './accounts.css',
})
export class Accounts implements OnInit {
  displayedColumns: string[] = ['userName', 'fullName', 'email', 'phone', 'isActive', 'actions'];
  users: AspNetUsersDTO[] = [];
  isLoading = true;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.accountService.list().subscribe({
      next: response => {
        console.log('accounts response', response);
        this.users = (response.Data as unknown as AspNetUsersDTO[]) ?? [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error('accounts error', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  editUser(id: string | null): void {
    if (id) this.router.navigate(['/account/update', id]);
  }

  toggleState(user: AspNetUsersDTO, isActive: boolean): void {
    (user as any)._saving = true;
    const dto = new UpdateUserStateDTO();
    dto.userId = user.Id;
    dto.isActive = isActive;

    this.accountService.updateState(dto).subscribe({
      next: () => {
        user.IsActive = isActive;
        (user as any)._saving = false;
        this.snackBar.open(
          `Usuario ${user.UserName} ${isActive ? 'activado' : 'desactivado'} correctamente.`,
          'Cerrar', { duration: 3000 }
        );
        this.cdr.detectChanges();
      },
      error: () => {
        user.IsActive = !isActive;
        (user as any)._saving = false;
        this.snackBar.open('No fue posible cambiar el estado del usuario.', 'Cerrar', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  createUser(): void {
    this.router.navigate(['/createUser']);
  }
}
