import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AccountService } from '../../../../core/services/account';
import { AuthService } from '../../../../core/services/auth';
import { LoginDTO } from '../../../../shared/model/account/login-dto';
import { AccountDTO } from '../../../../shared/model/account/account-dto';

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
  ) {
    // Inicializamos el formulario con sus reglas de validación obligatorias
    this.loginForm = this.fb.group({
      username: ['michael.vargas', [Validators.required, Validators.minLength(4)]],
      password: ['Colombia2026+', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      
      if (isLoggedIn) {
        this.router.navigate(['/home']);
      }
    });
    
  }

  /**
   * Se ejecuta al hacer submit en el formulario HTML
   */
  onSubmit(): void {
    
    if (this.loginForm.valid) {

      //this.modal.mostrarCargando();
      let credentials = new LoginDTO();
      let authInfo = new AccountDTO();

      credentials.username = this.loginForm.get("username")?.value;
      credentials.password = this.loginForm.get("password")?.value;


      this.accountService.login(credentials)
      .subscribe(reps => {

        var dto = reps.Data;

        if (dto) {

          this.authService.login(dto);

        }else{
          //this.modal.modalGeneral("Inicio de Sesión", reps.Message, "error");
        }

        //this.authService.setRoles(dto?.roles || []);
        this.authService.signalSyncLogin();

        this.router.navigate(['/home']);

      }, error => {
        if (error.status==400){
          //this.modal.modalGeneral("Inicio de Sesión", error.error.Message, "warning");  
        }else{
          //this.modal.modalGeneral("Inicio de Sesión", error.error.Message, "error");  
        }

        if (error.status==401){
          this.router.navigate(['/login']);
        }

      });
      
    }
  }
}
