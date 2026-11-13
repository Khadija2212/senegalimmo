import { TestBed } from '@angular/core/testing';
import { Notation } from './notation';

describe('Notation', () => {
  let service: Notation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Notation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
