import { createTile } from "./TileLoader";

export class TileManager {
   constructor(tileGroup, tileCache, tileSize, tileRadius) {
      this.tileGroup = tileGroup;
      this.tileCache = tileCache;

      this.tileSize = tileSize;
      this.tileRadius = tileRadius;

      this.visibleTileKeys = new Set();

      this.isLoading = false;
      this.pendingUpdate = false;

      this.pendingCenterX = null;
      this.pendingCenterY = null;

      this.pendingZoom = null;
      this.previousZoom = null;
   }

   createTileKey(z, x, y) {
      return `${z}_${x}_${y}`;
   }

   getVisibleTiles(centerX, centerY) {
      const tiles = [];

      const tileX = Math.floor(centerX);
      const tileY = Math.floor(centerY);

      for (let x = tileX - this.tileRadius; x <= tileX + this.tileRadius; x++) {
         for (let y = tileY - this.tileRadius; y <= tileY + this.tileRadius; y++) {
            tiles.push({ x, y });
         }
      }

      return tiles;
   }

   async loadTiles(zoom, centerX, centerY) {
      const visibleTiles = this.getVisibleTiles(centerX, centerY);
      const nextVisibleKeys = new Set();
      const promises = [];

      for (const tileInfo of visibleTiles) {
         const x = tileInfo.x;
         const y = tileInfo.y;

         const key = this.createTileKey(zoom, x, y);
         nextVisibleKeys.add(key);

         if (this.tileCache.has(zoom, x, y)) {
            continue;
         }

         const parentTile = this.getParentTile(zoom, x, y);
         if (parentTile) {
            parentTile.visible = true;
            parentTile.userData.isPlaceholder = true;
         }

         promises.push({ x, y, parentTile, promise: createTile(zoom, x, y, 0, 0) });
         // promises.push({ x, y, promise: createTile(zoom, x, y, 0, 0) });
      }

      const previousVisibleKeys = new Set(this.visibleTileKeys);
      const results = await Promise.all(promises.map((p) => p.promise));
      for (let i = 0; i < results.length; i++) {
         const tile = results[i];

         if (!tile) continue;

         const x = promises[i].x;
         const y = promises[i].y;

         console.log("ZOOM :", zoom, "X :", x, "Y : ", y);

         this.tileCache.set(zoom, x, y, tile);
         this.tileGroup.add(tile);

         const parentTile = promises[i].parentTile;

         if (parentTile) {
            parentTile.userData.loadedChildren =
               (parentTile.userData.loadedChildren || 0) + 1;

            // if (parentTile.userData.loadedChildren >= 4)
            if (
               parentTile.userData.loadedChildren >=
               promises.filter((p) => p.parentTile === parentTile).length
            ) {
               parentTile.visible = false;
               parentTile.userData.isPlaceholder = false;
               parentTile.userData.loadedChildren = 0;
            }
         }

         // if (parentTile) {
         //    parentTile.visible = false;
         //    parentTile.userData.isPlaceholder = false;
         // }
      }

      this.visibleTileKeys = nextVisibleKeys;
      this.repositionTiles(centerX, centerY);
      this.removeFarTiles(previousVisibleKeys);
   }

   reposition(centerX, centerY) {
      this.repositionTiles(centerX, centerY);
   }

   repositionTiles(centerX, centerY) {
      for (const tile of this.tileCache.values()) {
         const tileX = tile.userData.x;
         const tileY = tile.userData.y;

         tile.position.set(
            (tileX - centerX) * this.tileSize,
            0,
            (tileY - centerY) * this.tileSize,
         );
      }
   }

   removeFarTiles(previousVisibleKeys) {
      const tiles = Array.from(this.tileCache.values());

      for (const tile of tiles) {
         const key = this.createTileKey(
            tile.userData.z,
            tile.userData.x,
            tile.userData.y,
         );

         const wasVisible = previousVisibleKeys.has(key);
         const isVisible = this.visibleTileKeys.has(key);

         if (
            wasVisible ||
            isVisible ||
            tile.userData.isPlaceholder ||
            tile.userData.loadedChildren > 0
         ) {
            continue;
         }

         // if (wasVisible || isVisible || tile.userData.isPlaceholder) {
         //    continue;
         // }

         this.tileGroup.remove(tile);
         tile.geometry.dispose();
         tile.material.map?.dispose();
         tile.material.dispose();
         this.tileCache.delete(tile.userData.z, tile.userData.x, tile.userData.y);
      }
   }

   update(zoom, centerX, centerY) {
      if (this.pendingZoom !== zoom) {
         this.previousZoom = this.pendingZoom;
      }
      this.pendingZoom = zoom;

      this.pendingCenterX = centerX;
      this.pendingCenterY = centerY;

      if (this.isLoading) {
         this.pendingUpdate = true;
         return;
      }

      this.runUpdate();
   }

   runUpdate() {
      this.isLoading = true;
      const zoom = this.pendingZoom;
      const centerX = this.pendingCenterX;
      const centerY = this.pendingCenterY;
      this.pendingUpdate = false;

      this.loadTiles(zoom, centerX, centerY).finally(() => {
         this.isLoading = false;

         if (this.pendingUpdate) {
            this.runUpdate();
         }
      });
   }

   getParentTile(z, x, y) {
      if (z <= 10) {
         return null;
      }
      const parentZ = z - 1;
      const parentX = Math.floor(x / 2);
      const parentY = Math.floor(y / 2);
      const parent = this.tileCache.get(parentZ, parentX, parentY);
      if (parent) {
         return parent;
      }
      if (this.previousZoom !== null) {
         return this.tileCache.get(this.previousZoom, parentX, parentY);
      }
      return null;
   }

   // getParentTile(z, x, y) {
   //    if (z <= 0) {
   //       return null;
   //    }

   //    const parentZ = z - 1;
   //    const parentX = Math.floor(x / 2);
   //    const parentY = Math.floor(y / 2);
   //    return this.tileCache.get(parentZ, parentX, parentY);
   // }
}
