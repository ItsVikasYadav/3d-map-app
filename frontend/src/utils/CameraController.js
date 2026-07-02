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

   // getZoomLevel() {
   //    const distance = this.getDistance();

   //    if (distance < 100) return 14;
   //    if (distance < 200) return 13;
   //    if (distance < 400) return 12;
   //    if (distance < 800) return 11;
   //    if (distance < 1600) return 10;

   //    return 10;
   // }

   // getZoomLevel() {
   //    const distance = this.getDistance();
   //    if (distance > 2500) return 10;
   //    if (distance > 1500) return 11;
   //    if (distance > 900) return 12;
   //    if (distance > 500) return 13;

   //    return 14;
   // }
   getCenterWorldPosition() {
      return {
         x: this.controls.target.x,
         z: this.controls.target.z,
      };
   }
}
