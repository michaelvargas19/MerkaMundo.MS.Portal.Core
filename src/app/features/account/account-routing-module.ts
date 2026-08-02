import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Accounts } from './pages/accounts/accounts';

const routes: Routes = [
  { path: '', component: Accounts },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
