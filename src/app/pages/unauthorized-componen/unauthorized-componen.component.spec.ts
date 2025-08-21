import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnauthorizedComponenComponent } from './unauthorized-componen.component';

describe('UnauthorizedComponenComponent', () => {
  let component: UnauthorizedComponenComponent;
  let fixture: ComponentFixture<UnauthorizedComponenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthorizedComponenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnauthorizedComponenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
