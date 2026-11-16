export class CameraController {
   constructor(camera, controls) {
      this.camera = camera;
      this.controls = controls;
   }

   getDistance() {
      return this.camera.position.distanceTo(this.controls.target);
   }

   getZoomLevel() {
      const distance = this.getDistance();
      console.log("Camera Distance : ", distance);

      if (distance < 400) return 14;
      if (distance < 600) return 13;
      if (distance < 800) return 12;
      if (distance < 1000) return 11;
      if (distance < 1200) return 10;

      return 10;
   }

  
   getCenterWorldPosition() {
      return {
         x: this.controls.target.x,
         z: this.controls.target.z,
      };
   }
}
