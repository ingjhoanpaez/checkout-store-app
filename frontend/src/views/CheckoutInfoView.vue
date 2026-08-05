<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import type { CardInput, CustomerInput, DeliveryInput } from '@/types/checkout';
import CardDeliveryModal from '@/components/CardDeliveryModal.vue';

const props = defineProps<{ productId: string }>();

const store = useStore();
const router = useRouter();

const showModal = ref(false);

// Resiliencia: si el usuario llega directo a esta URL (ej. tras un
// refresh), la lista de productos puede estar vacía en memoria — se
// vuelve a pedir.
onMounted(() => {
  if (store.state.products.items.length === 0) {
    store.dispatch('products/fetchAll');
  }
});

const product = computed(() => store.getters['products/byId'](props.productId));

function onSubmit(payload: {
  customer: CustomerInput;
  delivery: DeliveryInput;
  card: CardInput;
}): void {
  store.commit('checkout/setCustomerAndDelivery', {
    customer: payload.customer,
    delivery: payload.delivery,
  });
  store.commit('checkout/setCard', payload.card);
  showModal.value = false;
  router.push({ name: 'checkout-summary' });
}
</script>

<template>
  <main class="checkout-info">
    <div v-if="product" class="recap">
      <h1>{{ product.name }}</h1>
      <p>{{ product.description }}</p>
    </div>

    <button class="pay-button" @click="showModal = true">
      Pagar con tarjeta de crédito
    </button>

    <CardDeliveryModal
      v-if="showModal"
      @close="showModal = false"
      @submit="onSubmit"
    />
  </main>
</template>

<style scoped>
.checkout-info {
  max-width: 480px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
  text-align: center;
}

.pay-button {
  margin-top: 1.5rem;
  width: 100%;
  padding: 0.85rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}
</style>
