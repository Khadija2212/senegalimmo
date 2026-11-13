import { TestBed } from '@angular/core/testing';
import { EtatLieux } from './etat-lieux';

describe('EtatLieux', () => {
  let service: EtatLieux;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EtatLieux);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
