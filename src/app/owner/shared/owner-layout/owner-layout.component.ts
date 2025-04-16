import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { OwnerSidebarComponent } from '../owner-sidebar/owner-sidebar.component';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-owner-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, OwnerSidebarComponent],
  templateUrl: './owner-layout.component.html',
  styleUrls: ['./owner-layout.component.css']
})
export class OwnerLayoutComponent implements OnInit {
  pageTitle = '';
  userName = '';
  userId: number | null = null;
  currentYear = new Date().getFullYear();

  constructor(
    private titleService: Title,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get the page title from the Title service
    this.pageTitle = this.titleService.getTitle();

    // Get user ID from route params
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        this.userId = +idParam;
      }
    });

    // Get the current user's name
    const currentUser = this.authService.getCurrentUser();
    console.log('Current user in owner layout:', currentUser);
    
    if (currentUser) {
      this.userName = `${currentUser.first_name} ${currentUser.last_name}`;
      
      // If userId not set from route params, get it from the current user
      if (!this.userId && currentUser.id) {
        this.userId = currentUser.id;
      }
    }
  }
} 