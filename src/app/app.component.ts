import { Component, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Parking App';
  
  constructor(
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
  
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Check token validity on app start
      console.log('App started, checking token validity...');
      // Short timeout to ensure services are fully initialized
      setTimeout(() => {
        this.authService.refreshAuthState().subscribe({
          next: isAuthenticated => console.log('Initial token validation:', isAuthenticated ? 'valid' : 'invalid'),
          error: err => console.error('Error validating token on startup:', err)
        });
      }, 100);
    }
  }
}
