import { computed } from 'vue';
import { useStore } from 'vuex';
import type { RootState } from '../store';

export const useCheckout = () => {
  const store = useStore() as { state: RootState };
  const productId = computed(() => store.state.productId);

  return { productId };
};
