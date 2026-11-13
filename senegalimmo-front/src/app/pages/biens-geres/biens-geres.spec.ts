import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BiensGeres } from './biens-geres';

describe('BiensGeres', () => {
  let component: BiensGeres;
  let fixture: ComponentFixture<BiensGeres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BiensGeres],
    }).compileComponents();

    fixture = TestBed.createComponent(BiensGeres);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
