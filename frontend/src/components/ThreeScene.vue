<template>
   <div ref="container" class="map-container"></div>

   <div v-if="isBuildingSelected" class="height-editor">
      <h3>Building</h3>
      <label> Height </label>
      <input
         type="number"
         v-model.number="selectedBuildingHeight"
         @input="updateBuildingHeight()"
      />
   </div>

   <div class="layer-panel">
      <h3>Layers</h3>
      <label>
         <input
            type="checkbox"
            v-model="layers.tiles"
            @change="updateLayerVisibility"
         />
         Tiles
      </label>

      <label>
         <input
            type="checkbox"
            v-model="layers.points"
            @change="updateLayerVisibility"
         />
         Points
      </label>

      <label>
         <input
            type="checkbox"
            v-model="layers.lines"
            @change="updateLayerVisibility"
         />
         Lines
      </label>

      <label>
         <input
            type="checkbox"
            v-model="layers.polygons"
            @change="updateLayerVisibility"
         />
         Polygons
      </label>

      <label>
         <input
            type="checkbox"
            v-model="layers.buildings"
            @change="updateLayerVisibility"
         />
         Buildings
      </label>
   </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createTile } from "../utils/TileLoader";
import {
   saveGeometry,
   loadGeometry,
   deleteGeometry,
   updateGeometry,
} from "../api/geometryApi";

const props = defineProps({
   mode: String,
});

const container = ref(null);

let scene;
let camera;
let renderer;
let controls;
let raycaster;
let mouse;

const tileCache = new Map();

let points = [];
// let mode = "POINT";

let lines = [];
let currentLine = null;
// mode = "LINE";

let polygons = [];
let currentPolygon = null;
// mode = "POLYGON";

let buildings = [];
// mode = "EXTRUDE";

let selectedFeature = ref(null);
const selectedBuildingHeight = ref(0);
const layers = ref({
   tiles: true,
   points: true,
   lines: true,
   polygons: true,
   buildings: true,
});

let tileGroup;
let pointGroup;
let lineGroup;
let polygonGroup;
let buildingGroup;

const selectedColor = 0xffff00;
const TILE_SIZE = 256;
const TILE_RADIUS = 2;

let currentZoom = 13;
let lastZoom = currentZoom;

let currentCenterX = 3500;
let currentCenterY = 5928;

let lastCenterTileX = currentCenterX;
let lastCenterTileY = currentCenterY;

onMounted(async () => {
   init();
   await loadTiles(currentCenterX, currentCenterY);
   await loadSavedGeometry();
   animate();
});

const isBuildingSelected = computed(() => {
   return selectedFeature.value && selectedFeature.value.type === "building";
});

function init() {
   scene = new THREE.Scene();
   // scene.background = new THREE.Color(0x202020);
   scene.background = new THREE.Color(0x101216);

   tileGroup = new THREE.Group();
   scene.add(tileGroup);

   pointGroup = new THREE.Group();
   scene.add(pointGroup);

   lineGroup = new THREE.Group();
   scene.add(lineGroup);

   polygonGroup = new THREE.Group();
   scene.add(polygonGroup);

   buildingGroup = new THREE.Group();
   scene.add(buildingGroup);

   raycaster = new THREE.Raycaster();
   mouse = new THREE.Vector2();

   camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000,
   );

   camera.position.set(800, 800, 800);

   renderer = new THREE.WebGLRenderer({
      antialias: true,
   });
   renderer.setSize(window.innerWidth, window.innerHeight);

   container.value.appendChild(renderer.domElement);

   controls = new OrbitControls(camera, renderer.domElement);
   controls.enableDamping = true;
   controls.dampingFactor = 0.05;
   controls.enablePan = true;
   controls.enableZoom = true;
   controls.enableRotate = true;
   controls.minDistance = 50;
   controls.maxDistance = 3000;
   controls.maxPolarAngle = Math.PI / 2.1;
   controls.target.set(0, 0, 0);

   // const axes = new THREE.AxesHelper(100);
   // scene.add(axes);

   // const grid = new THREE.GridHelper(1000, 1000);
   // scene.add(grid);

   const ambientLight = new THREE.AmbientLight(0xffffff, 1);
   scene.add(ambientLight);

   window.addEventListener("resize", onWindowResize);
   renderer.domElement.addEventListener("pointerdown", onPointerDown);
   renderer.domElement.addEventListener("contextmenu", onRightClick);
   window.addEventListener("keydown", onKeyDown);

   updateLayerVisibility();
}

// LOAD TILE
async function loadTiles(centerX, centerY) {
   for (let y = centerY - TILE_RADIUS; y <= centerY + TILE_RADIUS; y++) {
      for (let x = centerX - TILE_RADIUS; x <= centerX + TILE_RADIUS; x++) {
         const key = `${currentZoom}_${y}_${x}`;
         if (tileCache.has(key)) continue;

         const tile = await createTile(
            // zoom,
            // TILE_ZOOM,
            currentZoom,
            y,
            x,
            (x - centerX) * TILE_SIZE,
            (y - centerY) * TILE_SIZE,
         );

         if (tile) {
            tileCache.set(key, tile);

            tileGroup.add(tile);
            // const box = new THREE.BoxHelper(tile, 0xff0000);
            // tileGroup.add(box);
         }
      }
   }
}

async function loadSavedGeometry() {
   const geometry = await loadGeometry();
   console.log("Mongo Data:", geometry);

   for (const feature of geometry) {
      if (feature.type === "point") {
         points.push(feature);
      }
      if (feature.type === "line") {
         lines.push(feature);
      }
      if (feature.type === "polygon") {
         polygons.push(feature);
      }
      if (feature.type === "building") {
         buildings.push(feature);
      }
   }
   renderPoints();
   renderLines();
   renderPolygons();
   renderBuildings();
}

// POINTS

async function addPoint(position) {
   const pointData = {
      type: "point",
      points: [
         {
            x: position.x,
            y: position.y,
            z: position.z,
         },
      ],
   };
   console.log("Saving:", pointData);
   const savedPoint = await saveGeometry(pointData);
   console.log("Mongo Saved:", savedPoint);
   points.push(savedPoint);
   renderPoints();
}

function renderPoints() {
   pointGroup.clear();
   for (const point of points) {
      const geometry = new THREE.SphereGeometry(5, 16, 16);
      // const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const isSelected =
         selectedFeature.value &&
         selectedFeature.value.type === "point" &&
         selectedFeature.value.id === point._id;
      const material = new THREE.MeshBasicMaterial({
         // color: isSelected ? 0xffff00 : 0xff0000,
         color: isSelected ? 0xffff00 : 0xff4d4f,
      });

      const mesh = new THREE.Mesh(geometry, material);
      // mesh.position.set(point.x, point.y, point.z);

      const vertex = point.points[0];
      mesh.position.set(vertex.x, vertex.y, vertex.z);

      mesh.userData = {
         type: "point",
         id: point._id,
      };
      pointGroup.add(mesh);
      // console.log(mesh);
   }
}

// LINE
function startLine() {
   currentLine = {
      id: Date.now(),
      points: [],
   };
   lines.push(currentLine);
   // console.log("Lines : ", lines);
}

function addLinePoint(position) {
   if (!currentLine) {
      startLine();
   }

   currentLine.points.push({
      x: position.x,
      y: position.y,
      z: position.z,
   });
   renderLines();
   console.log("Current Line :", currentLine);
}

function renderLines() {
   lineGroup.clear();
   for (const line of lines) {
      if (line.points.length < 2) continue;

      const vectors = line.points.map(
         (point) => new THREE.Vector3(point.x, point.y, point.z),
      );
      // const geometry = new THREE.BufferGeometry().setFromPoints(vectors);
      const geometry = new LineGeometry();
      geometry.setFromPoints(vectors);

      const isSelected =
         selectedFeature.value &&
         selectedFeature.value.type === "line" &&
         selectedFeature.value.id === line._id;
      // const material = new THREE.LineBasicMaterial({
      const material = new LineMaterial({
         // color: isSelected ? 0xffff00 : 0xffffff,
         color: isSelected ? 0xffff00 : 0x00d4ff,
         linewidth: 2,
      });
      // const mesh = new THREE.Line(geometry, material);
      const mesh = new Line2(geometry, material);
      mesh.userData = {
         type: "line",
         id: line._id,
      };

      lineGroup.add(mesh);
   }
}

async function finishLine() {
   // currentLine = null;
   // console.log("Line Finished");
   if (!currentLine) return;
   if (currentLine.points.length < 2) return;

   const lineData = {
      type: "line",
      points: currentLine.points,
   };

   console.log("Saving Line:", lineData);
   const savedLine = await saveGeometry(lineData);

   console.log("Mongo Saved:", savedLine);

   currentLine._id = savedLine._id;
   currentLine = null;

   renderLines();
}

function onKeyDown(event) {
   if (event.key === "Enter") {
      finishLine();
   }

   if (event.key === "Escape") {
      selectedFeature.value = null;
      renderSelection();
   }

   // switch (event.key) {
   //    case "1":
   //       mode = "POINT";
   //       console.log("POINT");
   //       break;

   //    case "2":
   //       mode = "LINE";
   //       console.log("LINE");
   //       break;

   //    case "3":
   //       mode = "POLYGON";
   //       console.log("POLYGON");
   //       break;

   //    case "4":
   //       mode = "EXTRUDE";
   //       console.log("EXTRUDE");
   //       break;
   // }
}

// POLYGON
function startPolygon() {
   currentPolygon = {
      id: Date.now(),
      points: [],
   };
   polygons.push(currentPolygon);
}

function addPolygonPoint(position) {
   if (!currentPolygon) {
      startPolygon();
   }
   // console.log("Clicked", position.x, position.y, position.z);

   currentPolygon.points.push({
      x: position.x,
      y: position.y,
      z: position.z,
   });
   console.log("Polygons", polygons);
   console.log("Current Polygon", currentPolygon);
   renderPolygons();
}

function renderPolygons() {
   polygonGroup.clear();

   for (const polygon of polygons) {
      if (polygon.points.length < 3) continue;

      const shape = new THREE.Shape();
      polygon.points.forEach((point, index) => {
         if (index === 0) {
            shape.moveTo(point.x, -point.z);
         } else {
            shape.lineTo(point.x, -point.z);
         }
      });

      const isSelected =
         selectedFeature.value &&
         selectedFeature.value.type === "polygon" &&
         selectedFeature.value.id === polygon._id;

      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
         // color: isSelected ? 0xffff00 : 0x00ffff,
         color: isSelected ? 0xffff00 : 0x00ffaa,
         transparent: true,
         opacity: 0.9,
         side: THREE.DoubleSide,
         depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.5;

      mesh.userData = {
         type: "polygon",
         id: polygon._id,
      };
      console.log("Polygon Mesh : ", mesh);
      polygonGroup.add(mesh);
   }
}

async function finishPolygon() {
   if (!currentPolygon) return;
   if (currentPolygon.points.length < 3) return;

   const polygonData = {
      type: "polygon",
      points: currentPolygon.points,
   };

   console.log("Saving Polygon:", polygonData);

   const savedPolygon = await saveGeometry(polygonData);
   console.log("Mongo Saved:", savedPolygon);

   currentPolygon._id = savedPolygon._id;
   currentPolygon = null;
   renderPolygons();
}

function renderBuildings() {
   buildingGroup.clear();

   for (const building of buildings) {
      console.log("renderBuildings");
      const mesh = createBuildingMesh(building);
      buildingGroup.add(mesh);
   }
}

async function extrudePolygon(polygonId) {
   const polygon = polygons.find((polygon) => polygon._id === polygonId);
   if (!polygon) return;

   const buildingData = {
      type: "building",
      height: Math.floor(Math.random() * 300) + 100,
      points: polygon.points,
   };

   console.log("Saving Building:", buildingData);

   const savedBuilding = await saveGeometry(buildingData);
   console.log("Mongo Saved:", savedBuilding);

   buildings.push(savedBuilding);
   renderBuildings();
}

function createBuildingData(polygon, height = 100) {
   return {
      id: Date.now(),
      sourcePolygonId: polygon.id,
      height: Math.floor(Math.random() * 300) + 100,
      points: [...polygon.points],
   };
}

function createBuildingMesh(building) {
   const shape = new THREE.Shape();
   building.points.forEach((point, index) => {
      if (index === 0) {
         shape.moveTo(point.x, -point.z);
      } else {
         shape.lineTo(point.x, -point.z);
      }
   });

   const isSelected =
      selectedFeature.value &&
      selectedFeature.value.type === "building" &&
      selectedFeature.value.id === building._id;

   const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: building.height,
      bevelEnabled: false,
   });
   const material = new THREE.MeshStandardMaterial({
      // color: isSelected ? 0xffff00 : 0xb0b0b0,
      color: isSelected ? 0xffd60a : 0xc7c7c7,
   });

   const mesh = new THREE.Mesh(geometry, material);
   mesh.userData = {
      type: "building",
      id: building._id,
   };

   mesh.rotation.x = -Math.PI / 2;
   mesh.position.y = 0.5;
   return mesh;
}

// SELECT
function selectFeature(object) {
   selectedFeature.value = {
      type: object.userData.type,
      id: object.userData.id,
   };
   console.log("BUILDING SELECTED", selectedFeature.value);

   if (selectedFeature.value.type === "building") {
      const building = buildings.find(
         (building) => building._id === selectedFeature.value.id,
      );

      if (building) {
         selectedBuildingHeight.value = building.height;
      }
   }

   // console.log(selectedFeature.value);
   renderSelection();
}

function handleSelection(intersects) {
   const featureHit = intersects.find((hit) => hit.object.userData.type);
   if (!featureHit) {
      selectedFeature.value = null;
      renderSelection();
      return;
   }
   console.log("SLECTED OBJECT", featureHit);
   selectFeature(featureHit.object);
}

function renderSelection() {
   renderPoints();
   renderLines();
   renderPolygons();
   renderBuildings();
}

async function updateBuildingHeight() {
   if (!selectedFeature.value) return;
   const building = buildings.find(
      (building) => building._id === selectedFeature.value.id,
   );

   if (!building) return;
   building.height = Number(selectedBuildingHeight.value);
   renderBuildings();

   await updateGeometry(building._id, building);
}

// DELETE
async function handleDelete(intersects) {
   const featureHit = intersects.find((hit) => hit.object.userData.type);
   if (!featureHit) {
      selectedFeature.value = null;
      renderSelection();
   }

   await deleteFeature(featureHit.object);
}

async function deleteFeature(object) {
   const type = object.userData.type;
   const id = object.userData.id;

   console.log("Deleting:", type, id);

   await deleteGeometry(id);
   console.log("Mongo Delete Complete");

   switch (type) {
      case "point":
         deletePoint(id);
         break;

      case "line":
         deleteLine(id);
         break;

      case "polygon":
         deletePolygon(id);
         break;

      case "building":
         deleteBuilding(id);
         break;
   }

   selectedFeature.value = null;
   renderSelection();
}

function deletePoint(id) {
   points = points.filter((point) => point._id !== id);
   renderPoints();
}

function deleteLine(id) {
   lines = lines.filter((line) => line._id !== id);
   renderLines();
}

function deletePolygon(id) {
   polygons = polygons.filter((polygon) => polygon._id !== id);
   renderPolygons();
}

function deleteBuilding(id) {
   buildings = buildings.filter((building) => building._id !== id);
   renderBuildings();
}

// Layers
function updateLayerVisibility() {
   tileGroup.visible = layers.value.tiles;

   pointGroup.visible = layers.value.points;

   lineGroup.visible = layers.value.lines;

   polygonGroup.visible = layers.value.polygons;

   buildingGroup.visible = layers.value.buildings;
}

// Mouse click
function onPointerDown(event) {
   if (event.button !== 0) return;
   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
   raycaster.setFromCamera(mouse, camera);
   const intersects = raycaster.intersectObjects(scene.children, true);
   if (intersects.length === 0) return;
   // const hit = intersects[0];

   const hit = intersects.find((i) => i.object.userData.isTile);

   // if (!hit) return;

   // console.log("World Position:", hit, hit.point);
   // createMarker(hit.point);
   // addPoint(hit.point);

   switch (props.mode) {
      case "POINT":
         if (!hit) return;
         addPoint(hit.point);
         break;

      case "LINE":
         if (!hit) return;
         addLinePoint(hit.point);
         break;

      case "POLYGON":
         if (!hit) return;
         addPolygonPoint(hit.point);
         break;

      case "EXTRUDE":
         const polygonHit = intersects.find(
            (intersect) => intersect.object.userData.type === "polygon",
         );
         if (!polygonHit) return;
         extrudePolygon(polygonHit.object.userData.id);
         break;

      case "SELECT":
         handleSelection(intersects);
         break;

      case "DELETE":
         handleDelete(intersects);
         break;
   }
}

function onRightClick(event) {
   event.preventDefault();

   if (props.mode === "LINE") {
      finishLine();
      return;
   }

   if (props.mode === "POLYGON") {
      finishPolygon();
      return;
   }

   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

   raycaster.setFromCamera(mouse, camera);

   const intersects = raycaster.intersectObjects(pointGroup.children, true);
   if (intersects.length === 0) return;

   const pointMesh = intersects[0].object;
   console.log(pointMesh);
}

function onWindowResize() {
   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();
   renderer.setSize(window.innerWidth, window.innerHeight);
}

function convertTileCenter(oldZoom, newZoom, x, y) {
   const zoomDiff = newZoom - oldZoom;

   if (zoomDiff > 0) {
      const factor = Math.pow(2, zoomDiff);
      return {
         x: Math.floor(x * factor),
         y: Math.floor(y * factor),
      };
   }

   if (zoomDiff < 0) {
      const factor = Math.pow(2, Math.abs(zoomDiff));
      return {
         x: Math.floor(x / factor),
         y: Math.floor(y / factor),
      };
   }
   return { x, y };
}

function calculateZoom() {
   const distance = camera.position.distanceTo(controls.target);
   if (distance < 300) return 16;
   if (distance < 600) return 15;
   if (distance < 1200) return 14;
   if (distance < 2500) return 13;
   return 12;
}

function clearTiles() {
   tileCache.forEach((tile) => {
      tileGroup.remove(tile);
      tile.geometry.dispose();
      tile.material.map.dispose();
      tile.material.dispose();
   });

   tileCache.clear();
}

async function updateTileStreaming() {
   const zoom = calculateZoom();
   // console.log("Zoom Changed:", zoom);
   if (zoom !== lastZoom) {
      const newCenter = convertTileCenter(
         currentZoom,
         zoom,
         currentCenterX,
         currentCenterY,
      );
      currentCenterX = newCenter.x;
      currentCenterY = newCenter.y;
      currentZoom = zoom;
      lastZoom = zoom;
      lastCenterTileX = currentCenterX;
      lastCenterTileY = currentCenterY;
      clearTiles();
      await loadTiles(currentCenterX, currentCenterY);
      console.log("Zoom:", currentZoom, "Center:", currentCenterX, currentCenterY);

      return;
   }

   const tileOffsetX = Math.floor(controls.target.x / TILE_SIZE);
   const tileOffsetY = Math.floor(controls.target.z / TILE_SIZE);
   const centerTileX = currentCenterX + tileOffsetX;
   const centerTileY = currentCenterY + tileOffsetY;
   if (centerTileX === lastCenterTileX && centerTileY === lastCenterTileY) return;
   lastCenterTileX = centerTileX;
   lastCenterTileY = centerTileY;
   console.log("New Tile Center:", centerTileX, centerTileY);
   await loadTiles(centerTileX, centerTileY);
   updateTilePositions(centerTileX, centerTileY);
   unloadFarTiles(centerTileX, centerTileY);
}

function unloadFarTiles(centerX, centerY) {
   // const keepRadius = TILE_RADIUS + 1;
   const keepRadius = TILE_RADIUS;
   tileCache.forEach((tile, key) => {
      const dx = Math.abs(tile.userData.x - centerX);
      const dy = Math.abs(tile.userData.y - centerY);

      if (dx > keepRadius || dy > keepRadius) {
         tileGroup.remove(tile);
         tile.geometry.dispose();
         tile.material.map.dispose();
         tile.material.dispose();
         tileCache.delete(key);
      }
   });
}

function updateTilePositions(centerX, centerY) {
   tileCache.forEach((tile) => {
      const tileX = tile.userData.x;
      const tileY = tile.userData.y;
      tile.position.x = (tileX - centerX) * TILE_SIZE;
      tile.position.z = (tileY - centerY) * TILE_SIZE;
   });
}

function animate() {
   requestAnimationFrame(animate);
   controls.update();
   updateTileStreaming();
   renderer.render(scene, camera);
}
</script>

<style scoped>
.map-container {
   width: 100vw;
   height: 100vh;
}

.height-editor {
   position: absolute;
   top: 15px;
   right: 200px;
   width: 200px;
   padding: 16px;
   background: rgba(20, 20, 20, 0.8);
   backdrop-filter: blur(14px);
   border-radius: 16px;
   border: 1px solid rgba(255, 255, 255, 0.08);
   color: white;
   box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
   z-index: 1000;
}

.height-editor input {
   width: 100%;
   height: 42px;
   border: none;
   border-radius: 10px;
   padding: 0 12px;
   background: rgba(255, 255, 255, 0.08);
   color: white;
   outline: none;
   box-sizing: border-box;
}

.height-editor label {
   display: block;
   margin-bottom: 8px;
   font-size: 14px;
   color: #bbbbbb;
}

.height-editor h3 {
   margin: 0 0 12px;
   color: white;
   font-size: 16px;
}

.layer-panel {
   position: absolute;
   top: 15px;
   right: 10px;
   width: 150px;
   padding: 10px;
   background: rgba(20, 20, 20, 0.85);
   backdrop-filter: blur(14px);
   border-radius: 16px;
   border: 1px solid rgba(255, 255, 255, 0.08);
   color: white;
}

.layer-panel label {
   display: flex;
   align-items: center;
   gap: 10px;
   margin: 5px 0;
   cursor: pointer;
}
.layer-panel h3 {
   margin-top: 0px;
   margin-bottom: 12px;
}
</style>
