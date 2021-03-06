import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';
import { Observable, pipe } from 'rxjs';
import { finalize, map, tap, catchError } from 'rxjs/operators';
import { FireDTO } from '../../fire-dto';
import { Image } from '../../Image';

import { FilePath } from '@ionic-native/file-path/ngx';
import { Storage } from '@ionic/storage';

import { File, FileEntry } from '@ionic-native/file/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';


import { ActionSheetController, ToastController, LoadingController, Platform } from '@ionic/angular';
import { PhotoType } from '../../PhotoType';

import { Camera, CameraOptions, PictureSourceType } from '@ionic-native/camera/ngx';

import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {

  // Upload Task
  task: AngularFireUploadTask;

  // Progress in percentage
  percentage: Observable<number>;

  // Snapshot of uploading file
  snapshot: Observable<any>;

  // Uploaded File URL
  UploadedFileURL: Observable<string>;

  //Uploaded Image List
  // images: Observable<Image[]>;

  uglyPhotos: Observable<Image[]>;
  beautyPhotos: Observable<Image[]>;

  //File details
  fileName: string;
  fileSize: number;

  //Status check
  isUploading: boolean;
  isUploaded: boolean;


  private beautyPhotosCollection: AngularFirestoreCollection<FireDTO>;
  private uglyPhotosCollection: AngularFirestoreCollection<FireDTO>;

  images = [];

  public verTodas: any;
  public verMisFotos: any;
  public tomarFoto: any;
  public usuario: any;
  constructor(
    private camera: Camera,
    private file: File,
    private webview: WebView,
    private actionSheetController: ActionSheetController,
    private toastController: ToastController,
    private platform: Platform,
    private database: AngularFirestore,
    private fireStorage: AngularFireStorage,
    public authService: AuthenticationService
  ) {
    this.verTodas = false;
    this.verMisFotos = false;
    this.tomarFoto = true;
    // console.log(this.authService.usuario);
    this.beautyPhotosCollection = database.collection<FireDTO>('beautyPhotos', ref => ref.orderBy('uploadInstant', 'desc'));
    this.uglyPhotosCollection = database.collection<FireDTO>('uglyPhotos', ref => ref.orderBy('uploadInstant', 'desc'));

    this.cargarFotosLindas();
    this.cargarFotosFeas();
  }

  ngOnInit() {
    this.platform.ready().then(() => {
      // this.loadStoredImages();
    });

    this.usuario = this.authService.usuario;
  }

  cargarFotosLindas() {
    this.beautyPhotos = this.beautyPhotosCollection.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as FireDTO;
          const documentId = a.payload.doc.id;
          return { documentId, ...data };
        })
      )
    );
  }

  cargarFotosFeas() {
    this.uglyPhotos = this.uglyPhotosCollection.snapshotChanges().pipe(
      map(actions =>
        actions.map(a => {
          const data = a.payload.doc.data() as FireDTO;
          const documentId = a.payload.doc.id;
          return { documentId, ...data };
        })
      )
    );
  }

  takeUploadPicture(isBeauty) {

    this.camera.getPicture(this.getCameraOptions()).then(imagePath => {
      // console.log("Ya capturo la foto: ", imagePath);
      var correctPath = imagePath.substr(0, imagePath.lastIndexOf('/') + 1);
      var currentName = imagePath.substr(imagePath.lastIndexOf('/') + 1);
      this.saveAndUploadNewPhoto(correctPath, currentName, this.createNewPhotoName(), isBeauty);
    });
  }

  sacarFotos(tipo) {
    // console.log(tipo);
  }

  logout() {
    this.authService.logout();
  }

  getCameraOptions() {
    return {
      quality: 20,
      sourceType: PictureSourceType.CAMERA,
      saveToPhotoAlbum: false,
      correctOrientation: true
    }
  }

  getPhotoData(name) {
    let filePath = this.file.dataDirectory + name;
    let resPath = this.pathForImage(filePath);

    return {
      name: name,
      path: resPath,
      filePath: filePath
    }
  }

  createNewPhotoName() {
    var d = new Date(),
      n = d.getTime(),
      newFileName = n + ".jpg";

    // console.log("Creando nuevo nombre de foto.. ");
    return newFileName;
  }

  saveAndUploadNewPhoto(namePath, currentName, newFileName, isBeauty) {
    // console.log("Subiendo foto 1");
    this.file.copyFile(namePath, currentName, this.file.dataDirectory, newFileName).then(success => {
      // console.log("Aparentemente se guardo bien en el filesystem, vamos a subirla..");
      this.sendPhotoToFirestore(this.getFilePath(newFileName), isBeauty);
    }, error => {
      // console.log("Error al guardar foto tomada");
      this.presentToast('Error guardando foto tomada.');
    });
  }

  getFilePath(name) {
    // console.log("Obteniendo filepath.");
    return this.file.dataDirectory + name;
  }

  sendPhotoToFirestore(filePath, isBeauty) {
    // console.log("Mandando foto...");
    this.file.resolveLocalFilesystemUrl(filePath)
      .then(entry => {
        (<FileEntry>entry).file(file => this.uploadPhoto(file, isBeauty));
      })
      .catch(err => {
        this.presentToast('Error leyendo foto guardada.');
      });
  }

  uploadPhoto(file: any, isBeauty) {
    // console.log("Armando BLOB");
    const reader = new FileReader();
    reader.onloadend = () => {
      const imgBlob = new Blob([reader.result], {
        type: ".jpg"
      });

      const path = `buildingStorage/${new Date().getTime()}_${file.name}`;

      // console.log("Obteniendo referencia")
      const fileRef = this.fireStorage.ref(path);

      // console.log("Obteniendo tarea de upload")
      this.task = this.fireStorage.upload(path, imgBlob);
      // console.log("Tarea obtenida")

      this.task.then(as=>{
        // console.log("Finalizo el upload")
        // console.log("Obteniendo path de descarga del archivo")
        // Get uploaded file storage path
        this.UploadedFileURL = fileRef.getDownloadURL();

        // console.log("Iniciando upload a la DB")
        this.UploadedFileURL.subscribe(resp => {
          this.addImagetoDB({
            name: file.name,
            filepath: resp,
            votes: 0,
            uploadInstant: Date.now(),
            email: this.authService.usuario.email
          }, isBeauty ? this.beautyPhotosCollection : this.uglyPhotosCollection);
          this.isUploading = false;
          this.isUploaded = true;
          this.deleteImage(file.name)
        }, error => {
          // console.log("Erorrr")
          console.error(error);
        })
      });
    };
    reader.readAsArrayBuffer(file);
  }

  pathForImage(img) {
    if (img === null) {
      return '';
    } else {
      let converted = this.webview.convertFileSrc(img);
      return converted;
    }
  }

  addImagetoDB(image: FireDTO, imagesCollection: AngularFirestoreCollection<FireDTO>) {
    //Create an ID for document

    // console.log("Agregando foto a la DB");
    // console.log("Creando ID");
    const id = this.database.createId();

    // console.log("Id creado, enviando...");
    //Set document id with value in database
    imagesCollection.doc(id).set(image).then(resp => {
      // console.log("Response del envio", resp);
      // console.log(resp);
    }).catch(error => {
      console.log("error " + error);
    });
  }

  async presentToast(text) {
    const toast = await this.toastController.create({
      message: text,
      position: 'bottom',
      duration: 3000
    });
    toast.present();
  }

  deleteImage(imageName) {
    let imgEntry = this.getPhotoData(imageName);
    var correctPath = imgEntry.filePath.substr(0, imgEntry.filePath.lastIndexOf('/') + 1);
    this.file.removeFile(correctPath, imgEntry.name).then(res => {
      // console.log("Foto borrada de la cache.")
    });
  }

  async selectImage(isBeauty) {
    const actionSheet = await this.actionSheetController.create({
      header: "Origen",
      buttons: [
        {
          text: 'Camara',
          handler: () => {
            this.takeUploadPicture(isBeauty);
          }
        },
        {
          text: 'Cancelar',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  listarTodas() {
    this.cargarFotosLindas();
    this.cargarFotosFeas();
    this.verTodas = true;
    this.verMisFotos = false;
    this.tomarFoto = false;
  }
  listarMisFotos() {
    this.cargarFotosLindas();
    this.cargarFotosFeas();
    this.verTodas = false;
    this.verMisFotos = true;
    this.tomarFoto = false;
  }
  crearFoto() {
    this.verTodas = false;
    this.verMisFotos = false;
    this.tomarFoto = true;
  }




  // constructor(private storage: AngularFireStorage, private database: AngularFirestore, private platform: Platform) {
  //   this.isUploading = false;
  //   this.isUploaded = false;
  //   //Set collection where our documents/ images info will save
  //   // this.imageCollection = database.collection<FireDTO>('freakyImages');

  //   this.beautyPhotosCollection = database.collection<FireDTO>('beautyPhotos', ref => ref.orderBy('uploadInstant', 'desc'));
  //   this.uglyPhotosCollection = database.collection<FireDTO>('uglyPhotos', ref => ref.orderBy('uploadInstant', 'desc'));

  //   this.beautyPhotos = this.beautyPhotosCollection.snapshotChanges().pipe(map(actions => actions.map(a => {
  //     const data = a.payload.doc.data() as FireDTO;
  //     const documentId = a.payload.doc.id;
  //     return { documentId, ...data };
  //   })));

  //   this.uglyPhotos = this.uglyPhotosCollection.snapshotChanges().pipe(
  //     map(actions =>
  //       actions.map(a => {
  //         const data = a.payload.doc.data() as FireDTO;
  //         const documentId = a.payload.doc.id;
  //         return { documentId, ...data };
  //       })
  //     ));

  // }


  // uploadFile(event: FileList, isBeauty: boolean) {

  //   // The File object
  //   const file = event.item(0)

  //   // Validation for Images Only
  //   if (file.type.split('/')[0] !== 'image') {
  //     console.error('unsupported file type :( ')
  //     return;
  //   }

  //   this.isUploading = true;
  //   this.isUploaded = false;


  //   this.fileName = file.name;

  //   // The storage path
  //   const path = `buildingStorage/${new Date().getTime()}_${file.name}`;

  //   // Totally optional metadata
  //   const customMetadata = { app: 'Relevamiento en edificios' };

  //   //File reference
  //   const fileRef = this.storage.ref(path);

  //   // The main task
  //   this.task = this.storage.upload(path, file, { customMetadata });

  //   // Get file progress percentage
  //   this.percentage = this.task.percentageChanges();

  //   this.snapshot = this.task.snapshotChanges().pipe(

  //     finalize(() => {
  //       // Get uploaded file storage path
  //       this.UploadedFileURL = fileRef.getDownloadURL();

  //       this.UploadedFileURL.subscribe(resp => {
  //         this.addImagetoDB({
  //           name: file.name,
  //           filepath: resp,
  //           size: this.fileSize,
  //           votes: 0,
  //           uploadInstant: Date.now(),
  //           userName: "el usuario"
  //         }, isBeauty ? this.beautyPhotosCollection : this.uglyPhotosCollection);
  //         this.isUploading = false;
  //         this.isUploaded = true;
  //       }, error => {
  //         console.error(error);
  //       })
  //     }),
  //     tap(snap => {
  //       this.fileSize = snap.totalBytes;
  //     })
  //   )
  // }

  // addImagetoDB(image: FireDTO, imagesCollection: AngularFirestoreCollection<FireDTO>) {
  //   //Create an ID for document
  //   const id = this.database.createId();

  //   //Set document id with value in database
  //   imagesCollection.doc(id).set(image).then(resp => {
  //     console.log(resp);
  //   }).catch(error => {
  //     console.log("error " + error);
  //   });
  // }

  vote(docId, incrementVotes: boolean, photoType: PhotoType) {

    const imageRef = photoType == PhotoType.POSITIVE ? this.beautyPhotosCollection.doc(docId).ref : this.uglyPhotosCollection.doc(docId).ref;

    this.database.firestore.runTransaction(transaction => {
      return transaction.get(imageRef).then(res => {
        if (!res.exists) {
          throw "Document does not exist!";
        }

        transaction.update(imageRef, {
          votes: incrementVotes ? res.data().votes + 1 : res.data().votes - 1
        });

      })
    });
  }
}
