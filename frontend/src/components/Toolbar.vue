<template>
   <div class="toolbar">
      <button :class="{ active: currentMode === 'POINT' }" @click="setMode('POINT')">
         Point
      </button>
      <button :class="{ active: currentMode === 'LINE' }" @click="setMode('LINE')">
         Line
      </button>
      <button
         :class="{ active: currentMode === 'POLYGON' }"
         @click="setMode('POLYGON')"
      >
         Polygon
      </button>
      <button
         :class="{ active: currentMode === 'EXTRUDE' }"
         @click="setMode('EXTRUDE')"
      >
         Extrude
      </button>
      <button
         :class="{ active: currentMode === 'SELECT' }"
         @click="setMode('SELECT')"
      >
         Select
      </button>

      <button
         :class="{ active: currentMode === 'DELETE' }"
         @click="setMode('DELETE')"
      >
         Delete
      </button>
   </div>
</template>

<script setup>
const props = defineProps({
   currentMode: String,
});

const emit = defineEmits(["change-mode"]);
function setMode(mode) {
   emit("change-mode", mode);
}
</script>

<style scoped>
.toolbar {
   position: absolute;
   top: 16px;
   left: 16px;
   display: flex;
   gap: 8px;
   padding: 10px;
   background: rgba(20, 20, 20, 0.75);
   backdrop-filter: blur(12px);
   border: 1px solid rgba(255, 255, 255, 0.08);
   border-radius: 16px;
   z-index: 1000;
   box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
}

.toolbar button {
   width: 120px;
   height: 46px;
   padding: 0 16px;
   font-size: 16px;
   font-weight: 600;
   border: none;
   border-radius: 12px;
   background: rgba(255, 255, 255, 0.05);
   color: white;
   cursor: pointer;
   transition: all 0.2s ease;
   font-size: 20px;
}

.toolbar button:hover {
   transform: translateY(-2px);
   background: rgba(255, 255, 255, 0.12);
}

.toolbar button.active {
   background: linear-gradient(135deg, #00b4ff, #4d7cff);
   color: white;
   box-shadow: 0 0 20px rgba(0, 180, 255, 0.4);
}
</style>
