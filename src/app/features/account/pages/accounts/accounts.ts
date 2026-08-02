import { Component, OnInit, ChangeDetectorRef, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AccountService } from '../../../../core/services/account';
import { AspNetUsersDTO } from '../../../../shared/model/account/asp-net-users-dto';

@Component({
  selector: 'app-accounts',
  standalone: false,
  templateUrl: './accounts.html',
  styleUrl: './accounts.css',
})
export class Accounts implements OnInit {
  displayedColumns: string[] = ['userName', 'fullName', 'email', 'phone', 'isActive', 'createdDate', 'actions'];
  users: AspNetUsersDTO[] = [];
  isLoading = true;

  constructor(
    private accountService: AccountService,
    private router: Router,
    private cdr: ChangeDetectorRef,
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

  createUser(): void {
    this.router.navigate(['/createUser']);
  }
}
