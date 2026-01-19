import { Component } from '@angular/core';

@Component({
 selector: 'app-root',
 template: `
 <div class="app-nav">
   <nav class="navbar">
     <div class="nav-brand">
       <span>MyApp</span>
     </div>
     <ul class="nav-menu">
       <li><a routerLink="/issue" routerLinkActive="active">Issues</a></li>
       <li><a routerLink="/wallet" routerLinkActive="active">Wallet</a></li>
       <li><a routerLink="/wallet-calendar" routerLinkActive="active">Calendar</a></li>
       <li><a routerLink="/game-tim-so" routerLinkActive="active">Game</a></li>
       <li><a routerLink="/dog-whistle" routerLinkActive="active">Dog Whistle</a></li>
       <li><a routerLink="/movie-manage" routerLinkActive="active">Movie Manage</a></li>
     </ul>
   </nav>
 </div>
 <div class="container-md">
   <router-outlet></router-outlet>
 </div>
 `,
 styles: [`
   .app-nav {
     background-color: #1976d2;
     padding: 0;
     margin: 0;
     box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   }
   
   .navbar {
     display: flex;
     align-items: center;
     padding: 0 20px;
     max-width: 1400px;
     margin: 0 auto;
   }
   
   .nav-brand {
     font-size: 1.5rem;
     font-weight: bold;
     color: white;
     margin-right: 40px;
     padding: 15px 0;
   }
   
   .nav-menu {
     display: flex;
     list-style: none;
     margin: 0;
     padding: 0;
     gap: 5px;
   }
   
   .nav-menu li {
     margin: 0;
   }
   
   .nav-menu a {
     display: block;
     padding: 20px 15px;
     color: rgba(255, 255, 255, 0.8);
     text-decoration: none;
     transition: all 0.3s ease;
     border-bottom: 3px solid transparent;
   }
   
   .nav-menu a:hover {
     color: white;
     background-color: rgba(0, 0, 0, 0.1);
   }
   
   .nav-menu a.active {
     color: white;
     border-bottom-color: #ffc107;
   }
   
   @media (max-width: 768px) {
     .navbar {
       flex-direction: column;
       padding: 10px;
     }
     
     .nav-brand {
       margin-right: 0;
       margin-bottom: 10px;
     }
     
     .nav-menu {
       width: 100%;
       flex-wrap: wrap;
       justify-content: center;
       gap: 0;
     }
     
     .nav-menu a {
       padding: 10px;
       font-size: 0.9rem;
     }
   }
 `]
})
export class AppComponent { }
