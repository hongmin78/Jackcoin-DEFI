import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { SharedModule } from './shared/shared.module';


import { HdWalletAdapterModule } from '@heavy-duty/wallet-adapter';
import { CustomInterceptor } from './services/http.interceptor';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { SideMenuPage } from './shared/components/side-menu/side-menu.page';
import { WalletNotConnectedStateComponent } from './wallet-not-connected-state/wallet-not-connected-state.component';
import { TabsMenuComponent } from './tabs-menu/tabs-menu.component';



import Plausible from 'plausible-tracker';
@NgModule({
    declarations: [
        AppComponent, 
        SideMenuPage,
        TabsMenuComponent,
        WalletNotConnectedStateComponent
        ],
    imports: [
        SharedModule,
        BrowserModule,
        BrowserAnimationsModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        FontAwesomeModule,
        HdWalletAdapterModule.forRoot({ autoConnect: true }),
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
    constructor() {
        const { trackPageview ,enableAutoPageviews } = Plausible({
            hashMode: true,
        })
        trackPageview()
        enableAutoPageviews()
    }
}
