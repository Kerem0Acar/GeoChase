import { TestBed } from '@angular/core/testing';

import { Quest } from './quest';

describe('Quest', () => {
  let service: Quest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Quest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
