import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { CatalogsRoutingModule } from './catalogs-routing-module';
import { Catalog } from './pages/catalog/catalog';
import { ListProducts } from './pages/list-products/list-products';
import { AddProducts } from './pages/add-products/add-products';

@NgModule({
  declarations: [Catalog, ListProducts, AddProducts],
  imports: [CommonModule, CatalogsRoutingModule, ReactiveFormsModule],
})
export class CatalogsModule {}
