import { NgModule } from '@angular/core';
import {
  MatSlideToggleModule
} from '@angular/material/slide-toggle';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSortModule} from '@angular/material/sort';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatCardModule} from '@angular/material/card';
import {MatIconModule} from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';


const material = [
  MatSlideToggleModule,
  MatInputModule,
  MatButtonModule,
  MatSelectModule,
  MatPaginatorModule,
  MatSnackBarModule,
  MatSortModule,
  MatProgressSpinnerModule,
  MatCardModule,
  MatIconModule,
  MatDialogModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
  MatInputModule
];

@NgModule({
  exports: [material],
  imports: [
    material
  ]
})
export class MaterialModule { }
