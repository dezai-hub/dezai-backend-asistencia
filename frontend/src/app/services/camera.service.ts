import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({ providedIn: 'root' })
export class CameraService {
  /**
   * Takes a photo using the device camera.
   * ANTI-FRAUD:
   *  - source: CameraSource.Camera -> forces live camera, NO gallery
   *  - allowEditing: false -> prevents image manipulation
   */
  async takePhoto(): Promise<string> {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      correctOrientation: true,
      width: 800,
    });

    if (!image.base64String) {
      throw new Error('No image captured');
    }

    return image.base64String;
  }
}
