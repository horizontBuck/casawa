import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesCasa } from './services-casa';

describe('ServicesCasa', () => {
  let component: ServicesCasa;
  let fixture: ComponentFixture<ServicesCasa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServicesCasa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServicesCasa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
