import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeviseSwitch } from './devise-switch';

describe('DeviseSwitch', () => {
  let component: DeviseSwitch;
  let fixture: ComponentFixture<DeviseSwitch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviseSwitch],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviseSwitch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
