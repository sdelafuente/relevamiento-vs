import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(private authService: AuthenticationService) { }

  canActivate(): boolean | Observable<boolean> | Promise<boolean> {
    // console.log('isAuthenticatedFirebase');
    return this.authService.isAuthenticatedFirebase();
  }
}
