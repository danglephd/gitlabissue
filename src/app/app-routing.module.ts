import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IssueComponent } from './issue/issue.component';
import { WalletComponent } from './wallet/wallet.component';

const routes: Routes = [
 { path: '', redirectTo: 'issue', pathMatch: 'full' },
 { path: 'issue', component: IssueComponent },
 { path: 'wallet', component: WalletComponent }
]; 

@NgModule({
 imports: [RouterModule.forRoot(routes)],
 exports: [RouterModule]
})

export class AppRoutingModule { }
