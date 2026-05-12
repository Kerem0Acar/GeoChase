import { TestBed } from '@angular/core/testing';

import { ZombieService } from './zombie-service';

describe('ZombieService', () => {
  let service: ZombieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZombieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
