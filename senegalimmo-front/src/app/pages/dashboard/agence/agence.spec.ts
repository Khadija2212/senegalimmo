import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Agence } from './agence';

describe('Agence', () => {
  let component: Agence;
  let fixture: ComponentFixture<Agence>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Agence],
    }).compileComponents();

    fixture = TestBed.createComponent(Agence);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
