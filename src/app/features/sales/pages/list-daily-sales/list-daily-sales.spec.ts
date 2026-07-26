import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListDailySales } from './list-daily-sales';

describe('ListDailySales', () => {
  let component: ListDailySales;
  let fixture: ComponentFixture<ListDailySales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListDailySales],
    }).compileComponents();

    fixture = TestBed.createComponent(ListDailySales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
