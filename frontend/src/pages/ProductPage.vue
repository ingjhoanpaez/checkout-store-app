<template>
  <section>
    <h1>Checkout Store</h1>
    <p>Producto seleccionado: {{ productId }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import type { RootState } from '../store';

const store = useStore() as { state: RootState };
const productId = computed(() => store.state.productId);
</script>
