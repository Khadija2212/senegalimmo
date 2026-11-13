import { TestBed } from '@angular/core/testing';
import { PromesseVente } from './promesse-vente';

describe('PromesseVente', () => {
  let service: PromesseVente;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PromesseVente);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
