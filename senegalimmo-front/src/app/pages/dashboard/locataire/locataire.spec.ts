import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Locataire } from './locataire';

describe('Locataire', () => {
  let component: Locataire;
  let fixture: ComponentFixture<Locataire>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Locataire],
    }).compileComponents();

    fixture = TestBed.createComponent(Locataire);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
