import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { Navbar } from './shared/components/navbar/navbar';
import { Sale } from './features/sale/pages/sale/sale';
import { Login } from './features/auth/pages/login/login';
import { Home } from './shared/pages/home/home';

const routes: Routes = [

  { path: '', component: Navbar, //canActivate: [authGuard],
    children: [
      { path: 'home', component: Home },
      { path: 'login', component: Login },
      { path: 'sale', component: Sale },
    ]
  },
  

  { path: '**', redirectTo: 'home' },

  /*
  {
    path: 'login',  loadChildren: () => import('./features/auth/auth-module').then(m => m.AuthModule)
  },
  {
    path: 'sale',  loadChildren: () => import('./features/sale/sale-module').then(m => m.SaleModule),
    canActivate: [authGuard]
  },
  {
    path: '',  redirectTo: 'login', pathMatch: 'full'
  },
  {
    path: '**',  redirectTo: 'login'
  }
  */
  /*
  {
    path: '',
    // Si la ruta está vacía (ej: http://localhost:4200), redirige automáticamente al login
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    // Comodín para capturar cualquier ruta inexistente (404). Puedes redirigir al login.
    redirectTo: 'login'
  }*/
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
