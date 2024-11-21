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

const material = [
  MatSlideToggleModule,
  MatInputModule,
  MatButtonModule,
  MatSelectModule,
  MatPaginatorModule,
  MatSnackBarModule,
  MatSortModule
];

@NgModule({
  exports: [material],
  imports: [
    material
  ]
})
export class MaterialModule { }
