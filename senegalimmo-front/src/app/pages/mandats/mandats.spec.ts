import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Mandats } from './mandats';

describe('Mandats', () => {
  let component: Mandats;
  let fixture: ComponentFixture<Mandats>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mandats],
    }).compileComponents();

    fixture = TestBed.createComponent(Mandats);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
