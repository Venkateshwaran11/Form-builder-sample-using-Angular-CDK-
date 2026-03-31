import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropTargetComponent } from './drop-target.component';

describe('DropTargetComponent', () => {
  let component: DropTargetComponent;
  let fixture: ComponentFixture<DropTargetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DropTargetComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DropTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
