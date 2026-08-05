import type { Module } from 'vuex';
import type {
  CardInput,
  CheckoutSettings,
  CheckoutTransaction,
  CustomerInput,
  DeliveryInput,
} from '@/types/checkout';
import {
  createCheckout,
  fetchCheckoutByReference,
  fetchCheckoutSettings,
} from '@/services/checkout.service';
import type { RootState } from '../types';

interface CheckoutState {
  productId: string | null;
  quantity: number;
  customer: CustomerInput | null;
  delivery: DeliveryInput | null;
  card: CardInput | null; // SOLO en memoria: nunca entra a persist()/restore()
  settings: CheckoutSettings | null;
  transaction: CheckoutTransaction | null;
  submitting: boolean;
  error: string | null;
}

const STORAGE_KEY = 'checkout-store:checkout';

// Persistimos SOLO lo necesario para recuperar el progreso tras un refresh.
// La tarjeta (CardInput) NUNCA pasa por aquí.
type PersistedSlice = Pick<
  CheckoutState,
  'productId' | 'quantity' | 'customer' | 'delivery' | 'transaction'
>;

function persist(state: CheckoutState): void {
  const { productId, quantity, customer, delivery, transaction } = state;
  const slice: PersistedSlice = {
    productId,
    quantity,
    customer,
    delivery,
    transaction,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
}

function restore(): Partial<CheckoutState> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<CheckoutState>;
  } catch {
    return {};
  }
}

export const checkout: Module<CheckoutState, RootState> = {
  namespaced: true,
  state: (): CheckoutState => ({
    productId: null,
    quantity: 1,
    customer: null,
    delivery: null,
    card: null,
    settings: null,
    transaction: null,
    submitting: false,
    error: null,
    ...restore(),
  }),
  mutations: {
    setProduct(state, payload: { productId: string; quantity: number }) {
      state.productId = payload.productId;
      state.quantity = payload.quantity;
      persist(state);
    },
    setCustomerAndDelivery(
      state,
      payload: { customer: CustomerInput; delivery: DeliveryInput },
    ) {
      state.customer = payload.customer;
      state.delivery = payload.delivery;
      persist(state);
    },
    setCard(state, card: CardInput) {
      state.card = card;
    },
    setSettings(state, settings: CheckoutSettings) {
      state.settings = settings;
    },
    setTransaction(state, transaction: CheckoutTransaction) {
      state.transaction = transaction;
      persist(state);
    },
    setSubmitting(state, submitting: boolean) {
      state.submitting = submitting;
    },
    setError(state, error: string | null) {
      state.error = error;
    },
    reset(state) {
      state.productId = null;
      state.quantity = 1;
      state.customer = null;
      state.delivery = null;
      state.card = null;
      state.transaction = null;
      state.error = null;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
  actions: {
    async loadSettings({ commit }) {
      const settings = await fetchCheckoutSettings();
      commit('setSettings', settings);
    },
    async submit({ commit, state }) {
      if (
        !state.productId ||
        !state.customer ||
        !state.delivery ||
        !state.card
      ) {
        throw new Error('Faltan datos del checkout');
      }
      commit('setSubmitting', true);
      commit('setError', null);
      try {
        const reference = state.transaction?.reference ?? crypto.randomUUID();
        const transaction = await createCheckout({
          reference,
          productId: state.productId,
          quantity: state.quantity,
          customer: state.customer,
          delivery: state.delivery,
          card: state.card,
        });
        commit('setTransaction', transaction);
        // La tarjeta ya cumplió su propósito: se limpia de memoria de una
        // vez, no espera a un reset() completo del flujo.
        commit('setCard', null);
        return transaction;
      } catch (error) {
        commit('setError', 'No fue posible procesar el pago.');
        throw error;
      } finally {
        commit('setSubmitting', false);
      }
    },
    async refreshTransaction({ commit, state }) {
      if (!state.transaction?.reference) return;
      const transaction = await fetchCheckoutByReference(
        state.transaction.reference,
      );
      commit('setTransaction', transaction);
    },
  },
};
