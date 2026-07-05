import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sale',
  standalone: false,
  templateUrl: './sale.html',
  styleUrl: './sale.css',
})
export class Sale implements OnInit {
  
  constructor(private authService: AuthService, private router: Router) {    
    
  }

  ngOnInit(): void {
    
  }

  }
