import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { convertToParamMap } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { CatalogService } from '../../../../core/services/catalog';

import { Catalog } from './catalog';

describe('Catalog', () => {
  let component: Catalog;
  let fixture: ComponentFixture<Catalog>;

  beforeEach(async () => {
    const activatedRouteMock = {
      paramMap: of(convertToParamMap({ id: '1' })),
    };

    const routerMock = {
      navigate: () => Promise.resolve(true),
    };

    const catalogServiceMock = {
      getCatalogById: () => of({ Data: null }),
      getProductsByCatalogId: () => of({ Data: [] }),
    };

    await TestBed.configureTestingModule({
      declarations: [Catalog],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteMock },
        { provide: Router, useValue: routerMock },
        { provide: CatalogService, useValue: catalogServiceMock },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(Catalog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
