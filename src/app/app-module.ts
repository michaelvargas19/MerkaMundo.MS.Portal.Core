import { NgModule, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { SharedModule } from './shared/shared-module';
import { SalesModule } from './features/sales/sales-module';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { AccountModule } from './features/account/account-module';
import { CatalogsModule } from './features/catalogs/catalogs-module';

registerLocaleData(localeEs, 'es');

@NgModule({
  declarations: [App],
  imports: [BrowserModule, AppRoutingModule, SharedModule, SalesModule, AccountModule, CatalogsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch()),
    { provide: LOCALE_ID, useValue: 'es' },
  ],
  bootstrap: [App],
})
export class AppModule {}
