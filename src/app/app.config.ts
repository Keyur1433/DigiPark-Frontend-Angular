import { ApplicationConfig, importProvidersFrom, isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withComponentInputBinding, withDebugTracing, withHashLocation, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LocationStrategy, PathLocationStrategy, PlatformLocation } from '@angular/common';
import { HistoryService } from './services/history.service';

// History service initialization function
function initializeHistoryService(historyService: HistoryService) {
  return () => {
    // The service will automatically start tracking history when injected
    return historyService;
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always',
        urlUpdateStrategy: 'eager',
        canceledNavigationResolution: 'replace'
      })
    ),
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    // Initialize history service
    {
      provide: APP_INITIALIZER,
      useFactory: initializeHistoryService,
      deps: [HistoryService],
      multi: true
    },
    importProvidersFrom(
      ToastrModule.forRoot({
        timeOut: 3000,
        positionClass: 'toast-top-right',
        preventDuplicates: true,
      }),
      BrowserAnimationsModule
    )
  ]
};
