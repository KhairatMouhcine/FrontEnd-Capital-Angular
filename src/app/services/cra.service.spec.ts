import { TestBed } from '@angular/core/testing';

import { CraService } from './cra.service';

describe('CraService', () => {
  let service: CraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
