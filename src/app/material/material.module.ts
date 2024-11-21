import { NgModule } from '@angular/core';
import {
  MatSlideToggleModule
} from '@angular/material/slide-toggle';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatPaginatorModule} from '@angular/material/paginator';

const material = [
  MatSlideToggleModule,
  MatInputModule,
  MatButtonModule,
  MatSelectModule,
  MatPaginatorModule
];

@NgModule({
  exports: [material],
  imports: [
    material
  ]
})
export class MaterialModule { }
