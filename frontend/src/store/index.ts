import { createStore } from 'vuex';
import { products } from './modules/products';
import { checkout } from './modules/checkout';
import type { RootState } from './types';

export default createStore<RootState>({
  modules: { products, checkout },
});
