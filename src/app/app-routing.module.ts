import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IssueComponent } from './issue/issue.component';
import { WalletComponent } from './wallet/wallet.component';
import { WalletCalendarComponent } from './wallet-calendar/wallet-calendar.component';
import { DogWhistleComponent } from './dog-whistle/dog-whistle.component';

const routes: Routes = [
    { path: '', redirectTo: 'dog-whistle', pathMatch: 'full' },
    { path: 'issue', component: IssueComponent },
    { path: 'wallet', component: WalletComponent },
    { path: 'wallet-calendar', component: WalletCalendarComponent },
    { path: 'dog-whistle', component: DogWhistleComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule { }
