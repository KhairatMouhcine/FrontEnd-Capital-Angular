import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemplirCraComponent } from './remplir-cra.component';

describe('RemplirCraComponent', () => {
  let component: RemplirCraComponent;
  let fixture: ComponentFixture<RemplirCraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemplirCraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemplirCraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
