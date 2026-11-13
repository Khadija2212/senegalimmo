import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Promesses } from './promesses';

describe('Promesses', () => {
  let component: Promesses;
  let fixture: ComponentFixture<Promesses>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Promesses],
    }).compileComponents();

    fixture = TestBed.createComponent(Promesses);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
