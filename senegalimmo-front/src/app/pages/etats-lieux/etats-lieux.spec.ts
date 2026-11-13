import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EtatsLieux } from './etats-lieux';

describe('EtatsLieux', () => {
  let component: EtatsLieux;
  let fixture: ComponentFixture<EtatsLieux>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtatsLieux],
    }).compileComponents();

    fixture = TestBed.createComponent(EtatsLieux);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
