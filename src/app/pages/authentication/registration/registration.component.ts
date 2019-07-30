import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { HusersService, HUser } from '@hyperiot/core';
import { AuthenticationHttpErrorHandlerService } from 'src/app/services/authentication-http-error-handler.service';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { Handler } from 'src/app/services/models/models';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RegistrationComponent implements OnInit {

  error: string[] = [null, null, null, null, null, null, null];
  registrationOkText: string;

  registerForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    lastName: new FormControl('', [Validators.required]),
    userName: new FormControl('', [Validators.required, Validators.pattern(new RegExp('^[a-zA-Z0-9]+$'))]),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    confPassword: new FormControl('', [Validators.required]),
    acceptConditions: new FormControl(false, [Validators.required])
  });

  constructor(
    private hUserService: HusersService,
    private i18n: I18n,
    private httperrorHandler: AuthenticationHttpErrorHandlerService
  ) { }

  ngOnInit() {
  }

  exception: boolean = false;
  errorMessage: string[] = [];

  injectedErrorState: boolean[] = [false, false, false, false, false, false];

  register() {
    //DISABLE BUTTON
    this.error = [null, null, null, null, null, null, null];
    this.registrationOkText = '';

    let user: HUser = {
      name: this.registerForm.value.name,
      lastname: this.registerForm.value.lastName,
      username: this.registerForm.value.userName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      passwordConfirm: this.registerForm.value.confPassword
    }

    this.hUserService.register(user).subscribe(
      res => {
        this.registrationOkText = this.i18n('HYT_registration_form_ok');
      },
      err => {
        let k: Handler[] = this.httperrorHandler.handle(err);
        for (let e of k) {
          this.error[e.container] = e.message;
        }
        console.log(this.error)
      }
    )
  }

}
