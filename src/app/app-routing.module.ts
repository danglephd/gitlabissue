import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IssueComponent } from './issue/issue.component';
import { WalletComponent } from './wallet/wallet.component';
import { WalletAddDialogComponent } from './wallet-add-dialog/wallet-add-dialog.component';
import { CalendarDialogComponent } from './calendar-dialog/calendar-dialog.component';
import { GameTimSoComponent } from './game-tim-so/game-tim-so.component';

const routes: Routes = [
 { path: '', redirectTo: 'issue', pathMatch: 'full' },
 { path: 'issue', component: IssueComponent },
 { path: 'wallet', component: WalletComponent },
 { path: 'walletDialog', component: WalletAddDialogComponent },
 { path: 'calendarDialog', component: CalendarDialogComponent },
{ path: 'game-tim-so', component: GameTimSoComponent } // Assuming GameTimSoComponent is defined and imported      ,
]; 

@NgModule({
 imports: [RouterModule.forRoot(routes)],
 exports: [RouterModule]
})

export class AppRoutingModule { }
