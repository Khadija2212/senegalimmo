import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaiementRetour } from './paiement-retour';

describe('PaiementRetour', () => {
  let component: PaiementRetour;
  let fixture: ComponentFixture<PaiementRetour>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaiementRetour],
    }).compileComponents();

    fixture = TestBed.createComponent(PaiementRetour);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
