export class TileCache {
   constructor() {
      this.tiles = new Map();
   }

   createKey(z, x, y) {
      return `${z}_${x}_${y}`;
   }

   has(z, x, y) {
      return this.tiles.has(this.createKey(z, x, y));
   }

   get(z, x, y) {
      return this.tiles.get(this.createKey(z, x, y));
   }

   set(z, x, y, tile) {
      this.tiles.set(this.createKey(z, x, y), tile);
   }

   delete(z, x, y) {
      this.tiles.delete(this.createKey(z, x, y));
   }

   values() {
      return this.tiles.values();
   }
}
