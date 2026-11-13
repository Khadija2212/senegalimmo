import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Quittances } from './quittances';

describe('Quittances', () => {
  let component: Quittances;
  let fixture: ComponentFixture<Quittances>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Quittances],
    }).compileComponents();

    fixture = TestBed.createComponent(Quittances);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
