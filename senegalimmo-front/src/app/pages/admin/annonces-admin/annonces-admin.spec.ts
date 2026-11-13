import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnnoncesAdmin } from './annonces-admin';

describe('AnnoncesAdmin', () => {
  let component: AnnoncesAdmin;
  let fixture: ComponentFixture<AnnoncesAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnoncesAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(AnnoncesAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
