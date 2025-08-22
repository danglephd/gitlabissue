import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IssueComponent } from './issue/issue.component';
import { WalletComponent } from './wallet/wallet.component';
import { WalletAddDialogComponent } from './wallet-add-dialog/wallet-add-dialog.component';
import { CalendarDialogComponent } from './calendar-dialog/calendar-dialog.component';
import { BillDetailComponent } from './bill-detail/bill-detail.component';

const routes: Routes = [
 { path: '', redirectTo: 'issue', pathMatch: 'full' },
 { path: 'issue', component: IssueComponent },
 { path: 'wallet', component: WalletComponent },
 { path: 'walletDialog', component: WalletAddDialogComponent },
 { path: 'calendarDialog', component: CalendarDialogComponent },
 { path: 'billDetailDialog', component: BillDetailComponent },
]; 

@NgModule({
 imports: [RouterModule.forRoot(routes)],
 exports: [RouterModule]
})

export class AppRoutingModule { }
