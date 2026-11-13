import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Portefeuille } from './portefeuille';

describe('Portefeuille', () => {
  let component: Portefeuille;
  let fixture: ComponentFixture<Portefeuille>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Portefeuille],
    }).compileComponents();

    fixture = TestBed.createComponent(Portefeuille);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
