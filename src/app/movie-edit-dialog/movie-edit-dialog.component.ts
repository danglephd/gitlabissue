import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Movie } from '../shared/models/movie.model';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
  selector: 'app-movie-edit-dialog',
  templateUrl: './movie-edit-dialog.component.html',
  styleUrls: ['./movie-edit-dialog.component.css']
})
export class MovieEditDialogComponent implements OnInit {
  editForm!: FormGroup;
  movie: Movie;
  availableTags: string[] = [];
  selectedTags: string[] = [];
  tagsInputControl = new FormControl('');
  filteredTags$!: Observable<string[]>;

  constructor(
    public dialogRef: MatDialogRef<MovieEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { movie: Movie },
    private formBuilder: FormBuilder
  ) {
    this.movie = data.movie;
  }

  ngOnInit(): void {
    this.loadAvailableTags();
    this.initializeForm();
  }

  /**
   * Load available tags from localStorage
   */
  loadAvailableTags(): void {
    try {
      const tagsJson = localStorage.getItem('movieTags');
      if (tagsJson) {
        this.availableTags = JSON.parse(tagsJson);
      }
    } catch (error) {
      console.error('Error loading tags from localStorage:', error);
      this.availableTags = [];
    }
  }

  /**
   * Initialize the form with movie data
   */
  initializeForm(): void {
    this.selectedTags = this.movie.tags ? [...this.movie.tags] : [];
    
    this.editForm = this.formBuilder.group({
      fileName: [this.movie.fileName, [Validators.required, Validators.minLength(3)]],
      path: [this.movie.path || ''],
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
      IMDBlink: [this.movie.IMDBlink || ''],
      isProcessed: [this.movie.isProcessed]
    });

    // Setup autocomplete for tags
    this.setupTagsAutocomplete();
  }

  /**
   * Setup autocomplete for tags field
   */
  setupTagsAutocomplete(): void {
    this.filteredTags$ = this.tagsInputControl.valueChanges.pipe(
      startWith(''),
      map(value => this.filterTags(value))
    );
  }

  /**
   * Filter tags based on input
   */
  filterTags(input: string): string[] {
    if (!input || typeof input !== 'string') {
      return this.availableTags.filter(tag => !this.selectedTags.includes(tag));
    }

    const filterValue = input.toLowerCase();
    return this.availableTags.filter(tag =>
      tag.toLowerCase().includes(filterValue) && !this.selectedTags.includes(tag)
    );
  }

  /**
   * Handle tag selection from autocomplete
   */
  onTagSelected(event: MatAutocompleteSelectedEvent): void {
    const tag = event.option.value;
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    }
    this.tagsInputControl.setValue('');
  }

  /**
   * Add tag by pressing Enter key
   */
  onAddTagByEnter(): void {
    const inputValue = this.tagsInputControl.value?.trim();
    if (inputValue && inputValue.length > 0) {
      // If tag is not in selectedTags, add it
      if (!this.selectedTags.includes(inputValue)) {
        this.selectedTags.push(inputValue);
        this.tagsInputControl.setValue('');
      } else {
        // Tag already exists, just clear input
        this.tagsInputControl.setValue('');
      }
    }
  }

  /**
   * Remove tag and trigger filter update
   */
  removeTag(tag: string): void {
    const index = this.selectedTags.indexOf(tag);
    if (index > -1) {
      this.selectedTags.splice(index, 1);
      // Trigger filter update to show removed tag in autocomplete
      this.tagsInputControl.setValue(this.tagsInputControl.value || '');
    }
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
      IMDBlink: formValue.IMDBlink,
      year: formValue.year ? parseInt(formValue.year) : undefined,
      isProcessed: formValue.isProcessed,
      tags: this.selectedTags
    };

    // Remove year if undefined to avoid Firebase errors
    if (updatedData.year === undefined) {
      delete (updatedData as any).year;
    }

    // Check and save new tags to localStorage
    this.saveNewTagsToLocalStorage();

    this.dialogRef.close(updatedData);
  }

  /**
   * Save new tags to localStorage
   */
  private saveNewTagsToLocalStorage(): void {
    try {
      const updatedTags = new Set(this.availableTags);
      let hasNewTags = false;

      // Add any new tags from selectedTags
      this.selectedTags.forEach(tag => {
        if (!this.availableTags.includes(tag)) {
          updatedTags.add(tag);
          hasNewTags = true;
        }
      });

      // Save updated tags to localStorage if there are new tags
      if (hasNewTags) {
        const sortedTags = Array.from(updatedTags).sort();
        localStorage.setItem('movieTags', JSON.stringify(sortedTags));
        console.log('New tags saved to localStorage:', sortedTags);
      }
    } catch (error) {
      console.error('Error saving tags to localStorage:', error);
    }
  }

  /**
   * Open IMDB link in new tab
   */
  openIMDBLink(): void {
    const imdbLink = this.editForm.get('IMDBlink')?.value;
    if (imdbLink && imdbLink.trim()) {
      window.open(imdbLink, '_blank', 'noopener,noreferrer');
    }
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
