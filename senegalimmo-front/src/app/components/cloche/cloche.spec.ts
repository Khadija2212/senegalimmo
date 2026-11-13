import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Cloche } from './cloche';

describe('Cloche', () => {
  let component: Cloche;
  let fixture: ComponentFixture<Cloche>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cloche],
    }).compileComponents();

    fixture = TestBed.createComponent(Cloche);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
