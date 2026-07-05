import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../../core/services/account';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  // Definición del objeto del formulario reactivo
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private accountService: AccountService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Inicializamos el formulario con sus reglas de validación obligatorias
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
    
  }

  /**
   * Se ejecuta al hacer submit en el formulario HTML
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      // 1. Simula el guardado de credenciales/token en el servicio
      this.accountService.login();
      
      // 2. Redirige a la zona interna protegida
      this.router.navigate(['/home']);
    }
  }
}
