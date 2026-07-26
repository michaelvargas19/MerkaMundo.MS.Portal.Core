import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateSale } from './create-sale';

describe('CreateSale', () => {
  let component: CreateSale;
  let fixture: ComponentFixture<CreateSale>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateSale],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateSale);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
