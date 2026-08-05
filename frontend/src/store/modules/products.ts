import type { Module } from 'vuex';
import type { Product } from '@/types/product';
import { fetchProducts } from '@/services/products.service';
import type { RootState } from '../types';

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

export const products: Module<ProductsState, RootState> = {
  namespaced: true,
  state: (): ProductsState => ({
    items: [],
    loading: false,
    error: null,
  }),
  mutations: {
    setLoading(state, loading: boolean) {
      state.loading = loading;
    },
    setItems(state, items: Product[]) {
      state.items = items;
    },
    setError(state, error: string | null) {
      state.error = error;
    },
  },
  actions: {
    async fetchAll({ commit }) {
      commit('setLoading', true);
      commit('setError', null);
      try {
        const items = await fetchProducts();
        commit('setItems', items);
      } catch {
        commit('setError', 'No fue posible cargar los productos.');
      } finally {
        commit('setLoading', false);
      }
    },
  },
  getters: {
    byId: (state) => (id: string) =>
      state.items.find((product) => product.id === id) ?? null,
  },
};
