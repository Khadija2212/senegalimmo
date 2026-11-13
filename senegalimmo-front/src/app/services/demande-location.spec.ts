import { TestBed } from '@angular/core/testing';
import { DemandeLocation } from './demande-location';

describe('DemandeLocation', () => {
  let service: DemandeLocation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemandeLocation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
