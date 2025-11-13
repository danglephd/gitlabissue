import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
// import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ReactiveFormsModule } from '@angular/forms';
import { IssueComponent } from './issue/issue.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material/material.module';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { environment } from '../environments/environment';
import { WalletComponent } from './wallet-app/wallet/wallet.component';
import { WalletAddDialogComponent } from './wallet-app/wallet-add-dialog/wallet-add-dialog.component';
import { CalendarDialogComponent } from './wallet-app/calendar-dialog/calendar-dialog.component';
import { BillDetailComponent } from './wallet-app/bill-detail/bill-detail.component';
import { WalletConfirmDialogComponent } from './confirm-dialog/wallet-confirm-dialog.component';
import { GameTimSoComponent } from './game-tim-so/game-tim-so.component';

import { WalletCalendarComponent } from './wallet-app/wallet-calendar/wallet-calendar.component';
import { NumberShortPipe } from './pipes/number-short.pipe';
import { DayTransactionsComponent } from './wallet-app/day-transactions/day-transactions.component';
import { SelectMonthDialogComponent } from './wallet-app/select-month-dialog/select-month-dialog.component';
import { DogWhistleComponent } from './dog-whistle/dog-whistle.component';


@NgModule({
  declarations: [
    AppComponent,
    IssueComponent,
    WalletComponent,
    WalletAddDialogComponent, // Thêm WalletAddDialogComponent vào declarations
    ConfirmDialogComponent,
    WalletConfirmDialogComponent,
    CalendarDialogComponent, // Thêm CalendarDialogComponent vào declarations
    BillDetailComponent, // Thêm BillDetailComponent vào declarations
    GameTimSoComponent,
    WalletCalendarComponent,
    DayTransactionsComponent,
    SelectMonthDialogComponent,
    NumberShortPipe,

    DogWhistleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebase),
    AngularFireDatabaseModule,

    // CommonModule, // Cho ngClass và date pipe
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
