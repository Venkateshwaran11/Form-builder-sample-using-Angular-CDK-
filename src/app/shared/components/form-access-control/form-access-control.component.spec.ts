import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormAccessControlComponent } from './form-access-control.component';

describe('FormAccessControlComponent', () => {
  let component: FormAccessControlComponent;
  let fixture: ComponentFixture<FormAccessControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormAccessControlComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormAccessControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
