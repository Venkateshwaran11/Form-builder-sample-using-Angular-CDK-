import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiFormGeneratorDialogComponent } from './ai-form-generator-dialog.component';

describe('AiFormGeneratorDialogComponent', () => {
  let component: AiFormGeneratorDialogComponent;
  let fixture: ComponentFixture<AiFormGeneratorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiFormGeneratorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiFormGeneratorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
