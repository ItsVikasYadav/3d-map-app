// src/utils/TileMath.js

import { Mercator } from "./Mercator";

export class TileMath {
   static latLonToTile(lat, lon, zoom) {
      const worldX = Mercator.lonToX(lon);
      const worldY = Mercator.latToY(lat);

      const scale = Math.pow(2, zoom);

      return {
         x: worldX * scale,
         y: worldY * scale,
      };
   }
}
