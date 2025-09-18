import { NgModule } from '@angular/core';
import {
  MatSlideToggleModule
} from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';


const material = [
  MatSlideToggleModule,
  MatButtonModule,
  MatSelectModule,
  MatSnackBarModule,
  MatSortModule,
  MatProgressSpinnerModule,
  MatCardModule,
  MatDialogModule,
  MatInputModule,
  MatIconModule, // Cho mat-icon
  MatTableModule, // Cho mat-table
  MatPaginatorModule, // Cho mat-paginator
  ReactiveFormsModule,
  MatCheckboxModule
];

@NgModule({
  exports: [material],
  imports: [
    material
  ]
})
export class MaterialModule { }
