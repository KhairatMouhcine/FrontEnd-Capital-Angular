import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AffectationActuelleComponent } from './affectation-actuelle.component';

describe('AffectationActuelleComponent', () => {
  let component: AffectationActuelleComponent;
  let fixture: ComponentFixture<AffectationActuelleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AffectationActuelleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AffectationActuelleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
