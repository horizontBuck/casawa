import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WallpaperCalculatorService } from '../../services/WallpaperCalculator.service';
import { CommonModule } from '@angular/common';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './calculator.html',
  styleUrl: './calculator.scss',
})
export class Calculator {
  @ViewChild('calculatorModal') modal!: ElementRef;
  private modalRef?: NgbModalRef;
  rollsNeeded: number | null = null;
  form: FormGroup;
  units = ['ft', 'in'];

  constructor(
    private fb: FormBuilder,
    private calculator: WallpaperCalculatorService,
    private modalService: NgbModal
  ) {
    this.form = this.fb.group({
      spaceType: ['', Validators.required],
      measurementUnit: ['ft', Validators.required],
      walls: this.fb.array([]),
      rollWidth: ['', Validators.required],
      rollLength: ['', Validators.required],
      patternRepeat: ['', Validators.required]
    });
    this.addWall();
  }

  // Convert a value from one unit to feet
  private toFeet(value: number, unit: string): number {
    return unit === 'in' ? value / 12 : value;
  }

  // Convert a value from feet to the specified unit
  private fromFeet(value: number, unit: string): number {
    return unit === 'in' ? value * 12 : value;
  }

  // Get the display value based on the current unit
  getDisplayValue(value: number, unit: string): number {
    return unit === 'in' ? Math.round(value * 12 * 100) / 100 : value;
  }

  showModal() {
    this.modalRef = this.modalService.open(this.modal, { size: 'lg', centered: true });
  }

  closeModal() {
    if (this.modalRef) {
      this.modalRef.close();
    }
  }

  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => {
      this.calculate();
    });
  }

  get walls(): FormArray {
    return this.form.get('walls') as FormArray;
  }

  addWall() {
    this.walls.push(
      this.fb.group({
        width: ['', Validators.required],
        height: ['', Validators.required]
      })
    );
  }
  
  // Helper to get wall controls with proper typing
  getWallControls() {
    return this.walls.controls as FormGroup[];
  }

  removeWall(index: number) {
    this.walls.removeAt(index);
  }

  calculate() {
    if (this.form.invalid) return;

    const value = this.form.value;
    const isInches = value.measurementUnit === 'in';
    
    // Convert all inputs to the correct units for calculation
    const rollWidthInches = isInches ? value.rollWidth / 12 : value.rollWidth * 12;
    const rollLengthFt = isInches ? value.rollLength / 12 : value.rollLength;
    const patternRepeatInches = isInches ? value.patternRepeat : value.patternRepeat * 12;

    // Convert wall dimensions to feet for the calculation
    const walls = value.walls.map((wall: any) => ({
      widthFt: isInches ? wall.width / 12 : wall.width,
      heightFt: isInches ? wall.height / 12 : wall.height
    }));

    this.rollsNeeded = this.calculator.calculateRolls(
      walls,
      {
        rollWidthInches,
        rollLengthFt,
        patternRepeatInches
      }
    );
  }

}
