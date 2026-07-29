import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ProductService } from '../../../../core/services/product';
import { Router } from '@angular/router';

import { AddProducts } from './add-products';

describe('AddProducts', () => {
  let component: AddProducts;
  let fixture: ComponentFixture<AddProducts>;

  beforeEach(async () => {
    const productServiceMock = {
      getProductByBarCode: () => of({ Data: null, Message: '' }),
    };

    const routerMock = {
      navigate: () => Promise.resolve(true),
    };

    await TestBed.configureTestingModule({
      declarations: [AddProducts],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: ProductService, useValue: productServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddProducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
