import { TestBed } from '@angular/core/testing';

import { Param } from './param';

describe('Param', () => {
  let service: Param;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Param);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
