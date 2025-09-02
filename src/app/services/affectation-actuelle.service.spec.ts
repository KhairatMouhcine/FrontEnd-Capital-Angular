import { TestBed } from '@angular/core/testing';

import { AffectationActuelleService } from './affectation-actuelle.service';

describe('AffectationActuelleService', () => {
  let service: AffectationActuelleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AffectationActuelleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
