import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Movie } from '../shared/models/movie.model';

@Component({
  selector: 'app-movie-edit-dialog',
  templateUrl: './movie-edit-dialog.component.html',
  styleUrls: ['./movie-edit-dialog.component.css']
})
export class MovieEditDialogComponent implements OnInit {
  editForm!: FormGroup;
  movie: Movie;

  constructor(
    public dialogRef: MatDialogRef<MovieEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { movie: Movie },
    private formBuilder: FormBuilder
  ) {
    this.movie = data.movie;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Initialize the form with movie data
   */
  initializeForm(): void {
    this.editForm = this.formBuilder.group({
      fileName: [this.movie.fileName, [Validators.required, Validators.minLength(3)]],
      path: [this.movie.path, Validators.required],
      year: [this.movie.year || '', Validators.compose([
        Validators.pattern(/^\d{4}$/),
        (control: any) => {
          if (control.value && control.value !== '') {
            const year = parseInt(control.value);
            if (year < 1900 || year > new Date().getFullYear()) {
              return { invalidYear: true };
            }
          }
          return null;
        }
      ])],
      isProcessed: [this.movie.isProcessed],
      tags: [this.movie.tags?.join(', ') || '']
    });
  }

  /**
   * Get form control for template
   */
  getFormControl(name: string) {
    return this.editForm.get(name);
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string, errorType: string): boolean {
    const control = this.editForm.get(fieldName);
    return control ? (control.hasError(errorType) && (control.dirty || control.touched)) : false;
  }

  /**
   * Cancel dialog
   */
  onCancel(): void {
    this.dialogRef.close();
  }

  /**
   * Save changes
   */
  onSave(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    const formValue = this.editForm.value;
    const updatedData = {
      fileName: formValue.fileName,
      path: formValue.path,
      year: formValue.year ? parseInt(formValue.year) : undefined,
      isProcessed: formValue.isProcessed,
      tags: formValue.tags ? formValue.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag) : []
    };

    // Remove year if undefined to avoid Firebase errors
    if (updatedData.year === undefined) {
      delete (updatedData as any).year;
    }

    this.dialogRef.close(updatedData);
  }

  /**
   * Mark all fields as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
