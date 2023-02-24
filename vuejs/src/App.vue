<script setup lang="ts">
import headerVue from "./components/header.vue";
import { useUser } from "@/stores/user";
import { onMounted } from "@vue/runtime-core";
let isShowHeader = true;
</script>

<template>
  <div class="container">
    <headerVue v-if="isShowHeader" :title="'None'" />
    <RouterView />
  </div>
</template>

<style scoped></style>
