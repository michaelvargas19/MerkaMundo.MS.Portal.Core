import { TestBed } from '@angular/core/testing';

import { Business } from './business';

describe('Business', () => {
  let service: Business;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Business);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
