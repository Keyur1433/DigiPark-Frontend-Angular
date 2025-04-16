import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-owner-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './owner-sidebar.component.html',
  styleUrls: ['./owner-sidebar.component.css']
})
export class OwnerSidebarComponent implements OnInit {
  userId: number | null = null;
  
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      this.userId = currentUser.id;
    }
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
} 