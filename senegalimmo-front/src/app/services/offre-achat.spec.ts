import { TestBed } from '@angular/core/testing';
import { OffreAchat } from './offre-achat';

describe('OffreAchat', () => {
  let service: OffreAchat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OffreAchat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
