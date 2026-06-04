<template>
   <Toolbar :currentMode="mode" @change-mode="changeMode"> </Toolbar>
   <ThreeScene :mode="mode" />
</template>

<script setup>
import { ref } from "vue";
import ThreeScene from "./components/ThreeScene.vue";
import Toolbar from "./components/Toolbar.vue";

// const mode = ref("POINT");
const mode = ref(null);

function changeMode(newMode) {
   mode.value = newMode;
   console.log("Current Mode:", newMode);
}
</script>

<style>
html,
body,
#app {
   width: 100%;
   height: 100%;
   margin: 0;
   overflow: hidden;
}
</style>
