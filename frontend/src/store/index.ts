import { createStore } from 'vuex';

export interface RootState {
  productId: string;
}

export const store = createStore({
  state: {
    productId: 'sku-1',
  } as RootState,
  mutations: {
    setProductId(state: RootState, productId: string) {
      state.productId = productId;
    },
  },
});
