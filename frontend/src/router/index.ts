import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 1. Product page
      path: '/',
      name: 'products',
      component: () => import('@/views/ProductListView.vue'),
    },
    {
      // 2. Credit Card / Delivery info
      path: '/checkout/:productId/info',
      name: 'checkout-info',
      component: () => import('@/views/CheckoutInfoView.vue'),
      props: true,
    },
    {
      // 3. Summary
      path: '/checkout/summary',
      name: 'checkout-summary',
      component: () => import('@/views/CheckoutSummaryView.vue'),
    },
    {
      // 4. Final status
      path: '/checkout/:reference/result',
      name: 'checkout-result',
      component: () => import('@/views/CheckoutResultView.vue'),
      props: true,
    },
    // 5. Vuelve a "products" (ruta '/')
  ],
});

export default router;
