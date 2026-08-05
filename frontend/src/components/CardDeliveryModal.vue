<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { CardInput, CustomerInput, DeliveryInput } from '@/types/checkout';
import {
  detectCardBrand,
  formatCardNumber,
  isExpiryValid,
  isValidCardNumber,
} from '@/utils/card';

const emit = defineEmits<{
  close: [];
  submit: [
    payload: { customer: CustomerInput; delivery: DeliveryInput; card: CardInput },
  ];
}>();

const customer = reactive<CustomerInput>({
  fullName: '',
  email: '',
  phone: '',
});

const delivery = reactive<DeliveryInput>({
  recipientName: '',
  phone: '',
  addressLine1: '',
  city: '',
  region: '',
  country: 'CO',
  postalCode: '',
});

const card = reactive({
  cardNumber: '',
  cardholderName: '',
  expirationMonth: '',
  expirationYear: '',
  cvv: '',
});

const errors = ref<string[]>([]);

const cardBrand = computed(() => detectCardBrand(card.cardNumber));

function onCardNumberInput(event: Event): void {
  const target = event.target as HTMLInputElement;
  card.cardNumber = formatCardNumber(target.value);
}

function validate(): boolean {
  const problems: string[] = [];

  if (!customer.fullName.trim()) problems.push('Falta el nombre del cliente.');
  if (!/^\S+@\S+\.\S+$/.test(customer.email)) problems.push('Correo inválido.');
  if (!customer.phone.trim()) problems.push('Falta el teléfono del cliente.');

  if (!delivery.recipientName.trim()) problems.push('Falta el destinatario.');
  if (!delivery.addressLine1.trim()) problems.push('Falta la dirección.');
  if (!delivery.city.trim()) problems.push('Falta la ciudad.');
  if (!delivery.region.trim()) problems.push('Falta el departamento/región.');

  if (!isValidCardNumber(card.cardNumber)) {
    problems.push('Número de tarjeta inválido.');
  }
  if (!cardBrand.value) {
    problems.push('Solo se aceptan tarjetas Visa o MasterCard.');
  }
  if (!card.cardholderName.trim()) {
    problems.push('Falta el nombre del titular.');
  }
  if (!isExpiryValid(card.expirationMonth, card.expirationYear)) {
    problems.push('Fecha de expiración inválida o vencida.');
  }
  if (!/^\d{3,4}$/.test(card.cvv)) {
    problems.push('CVV inválido.');
  }

  errors.value = problems;
  return problems.length === 0;
}

function onSubmit(): void {
  if (!validate()) return;

  emit('submit', {
    customer: { ...customer },
    delivery: { ...delivery },
    card: { ...card },
  });
}
</script>

<template>
  <div class="backdrop" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-modal="true">
      <header class="modal-header">
        <h2>Pagar con tarjeta de crédito</h2>
        <button class="close-button" @click="emit('close')" aria-label="Cerrar">
          ×
        </button>
      </header>

      <form class="modal-body" @submit.prevent="onSubmit">
        <fieldset>
          <legend>Datos del cliente</legend>
          <input v-model="customer.fullName" placeholder="Nombre completo" />
          <input v-model="customer.email" type="email" placeholder="Correo" />
          <input v-model="customer.phone" placeholder="Teléfono" />
        </fieldset>

        <fieldset>
          <legend>Entrega</legend>
          <input v-model="delivery.recipientName" placeholder="Destinatario" />
          <input v-model="delivery.phone" placeholder="Teléfono de entrega" />
          <input v-model="delivery.addressLine1" placeholder="Dirección" />
          <div class="row">
            <input v-model="delivery.city" placeholder="Ciudad" />
            <input v-model="delivery.region" placeholder="Departamento" />
          </div>
          <input
            v-model="delivery.postalCode"
            placeholder="Código postal (opcional)"
          />
        </fieldset>

        <fieldset>
          <legend>
            Tarjeta
            <span v-if="cardBrand === 'visa'" class="brand visa">VISA</span>
            <span v-else-if="cardBrand === 'mastercard'" class="brand mc">
              MasterCard
            </span>
          </legend>
          <input
            :value="card.cardNumber"
            @input="onCardNumberInput"
            placeholder="Número de tarjeta"
            inputmode="numeric"
            maxlength="23"
          />
          <input v-model="card.cardholderName" placeholder="Nombre del titular" />
          <div class="row">
            <input
              v-model="card.expirationMonth"
              placeholder="MM"
              inputmode="numeric"
              maxlength="2"
            />
            <input
              v-model="card.expirationYear"
              placeholder="AAAA"
              inputmode="numeric"
              maxlength="4"
            />
            <input
              v-model="card.cvv"
              placeholder="CVV"
              inputmode="numeric"
              maxlength="4"
              type="password"
            />
          </div>
        </fieldset>

        <ul v-if="errors.length" class="errors">
          <li v-for="error in errors" :key="error">{{ error }}</li>
        </ul>

        <button type="submit" class="submit-button">Continuar</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}

@media (min-width: 640px) {
  .backdrop {
    align-items: center;
  }
}

.modal {
  background: white;
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1rem 1.25rem 1.5rem;
}

@media (min-width: 640px) {
  .modal {
    border-radius: 16px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

fieldset {
  border: none;
  padding: 0;
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

legend {
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  color: white;
}

.brand.visa {
  background: #1a1f71;
}

.brand.mc {
  background: #eb001b;
}

input {
  padding: 0.6rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
}

.row {
  display: flex;
  gap: 0.5rem;
}

.row input {
  flex: 1;
  min-width: 0;
}

.errors {
  color: #b91c1c;
  font-size: 0.85rem;
  margin: 0.5rem 0;
  padding-left: 1.1rem;
}

.submit-button {
  width: 100%;
  padding: 0.75rem;
  background: #16a34a;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}
</style>
