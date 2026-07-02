// src/utils/Mercator.js

export class Mercator {
   static lonToX(lon) {
      return (lon + 180) / 360;
   }

   static latToY(lat) {
      const rad = (lat * Math.PI) / 180;

      return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2;
   }
}
