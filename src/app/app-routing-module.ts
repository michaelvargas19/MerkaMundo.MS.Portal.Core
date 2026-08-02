import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { Navbar } from './shared/components/navbar/navbar';
import { Login } from './features/auth/pages/login/login';
import { Home } from './shared/pages/home/home';
import { Sales } from './features/sales/pages/sales/sales';
import { CreateSale } from './features/sales/pages/create-sale/create-sale';
import { UpdateSale } from './features/sales/pages/update-sale/update-sale';
import { Accounts } from './features/account/pages/accounts/accounts';
import { CreateUser } from './features/account/pages/create-user/create-user';
import { Catalog } from './features/catalogs/pages/catalog/catalog';

const routes: Routes = [

  { path: '', component: Navbar,
    children: [
      { path: '', component: Home, canActivate: [authGuard], pathMatch: 'full' },
      { path: 'login', component: Login },
      { path: 'sales', component: Sales, canActivate: [authGuard] },
      { path: 'createSale', component: CreateSale, canActivate: [authGuard] },
      { path: 'catalog/:id', component: Catalog, canActivate: [authGuard] },
      /*{
        path: 'catalog/:id',
        canActivate: [authGuard],
        loadChildren: () => import('./features/catalogs/catalogs-module').then(m => m.CatalogsModule),
      },*/

      { path: 'accounts', component: Accounts, canActivate: [authGuard] },
      { path: 'createUser', component: CreateUser, canActivate: [authGuard] },

      /*{
        path: 'account',
        canActivate: [authGuard],
        loadChildren: () => import('./features/account/account-module').then(m => m.AccountModule),
      },*/
      //{ path: 'updateSale', redirectTo: 'sales', pathMatch: 'full' },
      { path: 'updateSale/:id', component: UpdateSale },
    ]
  },  

  { path: '**',
    redirectTo: ''
  },

];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
