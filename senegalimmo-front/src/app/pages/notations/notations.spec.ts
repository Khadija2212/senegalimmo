import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Notations } from './notations';

describe('Notations', () => {
  let component: Notations;
  let fixture: ComponentFixture<Notations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Notations],
    }).compileComponents();

    fixture = TestBed.createComponent(Notations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
