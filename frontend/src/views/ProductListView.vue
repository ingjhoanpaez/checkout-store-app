<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

const products = computed(() => store.state.products.items);
const loading = computed(() => store.state.products.loading);
const error = computed(() => store.state.products.error);

onMounted(() => {
  store.dispatch('products/fetchAll');
});

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function buy(productId: string): void {
  store.commit('checkout/setProduct', { productId, quantity: 1 });
  router.push({ name: 'checkout-info', params: { productId } });
}
</script>

<template>
  <main class="product-list">
    <h1>Nuestros productos</h1>

    <p v-if="loading" class="state-message">Cargando productos…</p>
    <p v-else-if="error" class="state-message error">{{ error }}</p>

    <div v-else class="grid">
      <article v-for="product in products" :key="product.id" class="card">
        <h2>{{ product.name }}</h2>
        <p class="description">{{ product.description }}</p>
        <p class="price">{{ formatPrice(product.priceInCents) }}</p>
        <p class="stock" :class="{ low: product.stock <= 5 }">
          {{ product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock' }}
        </p>
        <button
          class="buy-button"
          :disabled="product.stock === 0"
          @click="buy(product.id)"
        >
          Comprar
        </button>
      </article>
    </div>
  </main>
</template>

<style scoped>
.product-list {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.card {
  border: 1px solid #e2e2e2;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.description {
  color: #555;
  font-size: 0.9rem;
  flex-grow: 1;
}

.price {
  font-weight: 700;
  font-size: 1.1rem;
}

.stock {
  font-size: 0.85rem;
  color: #2a7a2a;
}

.stock.low {
  color: #b45309;
}

.buy-button {
  padding: 0.6rem;
  border: none;
  border-radius: 8px;
  background: #16a34a;
  color: white;
  font-weight: 600;
  cursor: pointer;
}

.buy-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.state-message {
  text-align: center;
  padding: 2rem 0;
}

.state-message.error {
  color: #b91c1c;
}
</style>
