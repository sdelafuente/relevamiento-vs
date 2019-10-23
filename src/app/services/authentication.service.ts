import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Storage } from '@ionic/storage';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import { Observable } from 'rxjs';

const TOKEN_KEY = 'auth-token';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  authenticationState = new BehaviorSubject(false);
  passKeyUser: any;
  constructor(private storage: Storage, private plt: Platform) {
    this.plt.ready().then( () => {
       this.checkToken();
    });
  }

  login() {
    return this.storage.set(TOKEN_KEY, 'Bearer 1234567').then(res => {
      this.authenticationState.next(true);
    });
  }

  logout() {
    return this.storage.remove(TOKEN_KEY).then(() => {
      this.authenticationState.next(false);
    });
  }

  isAuthenticated() {
    return this.authenticationState.value;
  }

  isAuthenticatedFirebase(): boolean | Observable<boolean> | Promise<boolean> {
    return new Promise((resolve, reject) => {
      console.log('isAuthenticatedFirebase');
      firebase.auth().onAuthStateChanged((user: firebase.User) => {
        if (user) {
           resolve(true);
        } else {
          console.log('User is not logged in');
          // this.router.navigate(['/login']);
          resolve(false);
        }
      });
    });
  }

  checkToken() {
    return this.storage.get(TOKEN_KEY).then(res => {
      if (res) {
        this.authenticationState.next(true);
      }
    });
  }

  async loginUser(
    email: string,
    password: string
  ): Promise<firebase.auth.UserCredential> {
      let a: any;
      try {
        // return

        const response = await firebase.auth().signInWithEmailAndPassword(email, password);
        // console.log(response);
        if (response.user) {
          a = this.login();
        } else {
          a = this.logout();
        }

      } catch (err) {

      }

      return a;
  }

  signupUser(email: string, password: string): Promise<any> {
    return firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then((newUserCredential: firebase.auth.UserCredential) => {
        firebase
          .firestore()
          .doc(`/userProfile/${newUserCredential.user.uid}`)
          .set({ email });
      })
      .catch(error => {
        console.error(error);
        throw new Error(error);
      });
  }
}
