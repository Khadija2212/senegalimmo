import { TestBed } from '@angular/core/testing';
import { Portefeuille } from './portefeuille';

describe('Portefeuille', () => {
  let service: Portefeuille;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Portefeuille);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
