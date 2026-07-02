import * as THREE from "three";

const TILE_SIZE = 256;

const textureLoader = new THREE.TextureLoader();

export async function createTile(z, x, y, worldX, worldZ) {
   const url = `https://helibhumi.ai:4001/static/heliTile/${z}/${x}/${y}.png`;

   try {
      const texture = await textureLoader.loadAsync(url);
      texture.colorSpace = THREE.SRGBColorSpace;

      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

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

      tile.position.set(worldX, 0, worldZ);

      return tile;
   } catch (error) {
      console.error("Tile Load Error", error);

      return null;
   }
}
