import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateUser } from './update-user';

describe('UpdateUser', () => {
  let component: UpdateUser;
  let fixture: ComponentFixture<UpdateUser>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateUser],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateUser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
