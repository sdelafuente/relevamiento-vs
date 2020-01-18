import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/authentication.service';
import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
// import { PasswordValidator } from '../validators/password.validator';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  splash: boolean;
  validationsForm: FormGroup;
  matching_passwords_group: FormGroup;
  validation_messages = {
    'username': [
      { type: 'required', message: 'Username is required.' },
      { type: 'minlength', message: 'Username must be at least 5 characters long.' },
      { type: 'maxlength', message: 'Username cannot be more than 25 characters long.' },
      { type: 'pattern', message: 'Your username must contain only numbers and letters.' },
      { type: 'validUsername', message: 'Your username has already been taken.' }
    ],
    'name': [
      { type: 'required', message: 'Name is required.' }
    ],
    'lastname': [
      { type: 'required', message: 'Last name is required.' }
    ],
    'email': [
      { type: 'required', message: 'El email es necesario para acceder.' },
      { type: 'pattern', message: 'Ingrese un email valido.' }
    ],
    'phone': [
      { type: 'required', message: 'Phone is required.' },
      { type: 'validCountryPhone', message: 'The phone is incorrect for the selected country.' }
    ],
    'password': [
      { type: 'required', message: 'La contraseña es necesaria.' },
      { type: 'minlength', message: 'La contraseña tiene que tener al menos 5 caracteres.' },
      { type: 'pattern', message: 'La contraseña tiene que tener al menos una mayuscula, un numero y un caracter.' }
    ],
    'confirm_password': [
      { type: 'required', message: 'Confirm password is required.' }
    ],
    'matching_passwords': [
      { type: 'areEqual', message: 'Password mismatch.' }
    ],
    'terms': [
      { type: 'pattern', message: 'You must accept terms and conditions.' }
    ],
  };

  constructor(private authService: AuthenticationService, public formBuilder: FormBuilder) {
    this.splash = true;
  }


  ngOnInit() {
      const REGEXP = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

      // this.matching_passwords_group = new FormGroup({
      //       password: new FormControl('', Validators.compose([
      //         Validators.minLength(5),
      //         Validators.required,
      //         Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]+$')
      //       ])),
      //       confirm_password: new FormControl('', Validators.required)
      //     }, (formGroup: FormGroup) => {
      //       return PasswordValidator.areEqual(formGroup);
      // });

      this.validationsForm = this.formBuilder.group({
          // name: new FormControl('', Validators.required),
          email: new FormControl('', Validators.compose([
            Validators.required,
            Validators.pattern(REGEXP)
            // Validators.pattern('^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-.]+[a-zA-Z0-9-.]+$')
          ])),
          password: new FormControl('', Validators.compose([
            Validators.minLength(5),
            Validators.required,
            Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[a-zA-Z0-9]+$')
            // this is for the letters (both uppercase and lowercase) and numbers validation
          ]))
         // matching_passwords: this.matching_passwords_group,
      });
      this.ionViewDidLoad();
  }

  ionViewDidLoad() {
    setTimeout(() => this.splash = false, 3000);
  }

  login() {
    this.authService.login();
  }

  onSubmit(valores) {
    // console.log(valores);
    // this.login();
    this.authService.loginUser(valores.email, valores.password);
  }

  cargarUsuario(user) {
    // console.log(  this.validationsForm.value);
    switch (user) {
       case 'admin': {
           this.validationsForm = this.formBuilder.group({
             email: ['admin@gmail.com',
               Validators.compose([Validators.required, Validators.email])],
             password: [
              '111111',
               Validators.compose([Validators.required, Validators.minLength(6)]),
             ],
           });
           break;
       }
       case 'invitado': {
         this.validationsForm = this.formBuilder.group({
           email: ['invitado@gmail.com',
             Validators.compose([Validators.required, Validators.email])],
           password: [
            '222222',
             Validators.compose([Validators.required, Validators.minLength(6)]),
           ],
         });
         break;
       }
       case 'user': {
         this.validationsForm = this.formBuilder.group({
           email: ['usuario@gmail.com',
             Validators.compose([Validators.required, Validators.email])],
           password: [
            '333333',
             Validators.compose([Validators.required, Validators.minLength(6)]),
           ],
         });
         break;
       }
       case 'anon': {
          this.validationsForm = this.formBuilder.group({
             email: ['anonimo@gmail.com',
               Validators.compose([Validators.required, Validators.email])],
             password: [
              '444444',
               Validators.compose([Validators.required, Validators.minLength(6)]),
             ],
           });
          break;
       }
       case 'test': {
         this.validationsForm = this.formBuilder.group({
            email: ['tester@gmail.com',
              Validators.compose([Validators.required, Validators.email])],
            password: [
             '555555',
              Validators.compose([Validators.required, Validators.minLength(6)]),
            ],
          });
          break;
       }
       default: {
          console.log(user);
          break;
       }
    }
  }
}
