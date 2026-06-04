import * as THREE from "three";

const TILE_SIZE = 256;

const textureLoader = new THREE.TextureLoader();

export async function createTile(z, y, x, worldX, worldZ) {
   const url = `https://helibhumi.ai:4001/static/heliTile/${z}/${y}/${x}.png`;
   // const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

   try {
      const texture = await textureLoader.loadAsync(url);

      texture.colorSpace = THREE.SRGBColorSpace;

      const geometry = new THREE.PlaneGeometry(TILE_SIZE, TILE_SIZE);

      const material = new THREE.MeshBasicMaterial({
         map: texture,
      });

      const tile = new THREE.Mesh(geometry, material);
      tile.userData = {
         isTile: true,
         x,
         y,
         z,
      };

      tile.rotation.x = -Math.PI / 2;

      // tile.position.set(x * TILE_SIZE, 0, y * TILE_SIZE);
      tile.position.set(worldX, 0, worldZ);

      return tile;
   } catch (error) {
      console.error("Tile Load Error", error);

      return null;
   }
}
