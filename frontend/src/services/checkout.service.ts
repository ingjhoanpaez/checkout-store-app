import { api } from './api';
import type {
  CheckoutCommand,
  CheckoutSettings,
  CheckoutTransaction,
} from '@/types/checkout';

export async function fetchCheckoutSettings(): Promise<CheckoutSettings> {
  const { data } = await api.get<CheckoutSettings>('/checkouts/settings');
  return data;
}

export async function createCheckout(
  command: CheckoutCommand,
): Promise<CheckoutTransaction> {
  const { data } = await api.post<CheckoutTransaction>('/checkouts', command);
  return data;
}

export async function fetchCheckoutByReference(
  reference: string,
): Promise<CheckoutTransaction> {
  const { data } = await api.get<CheckoutTransaction>(
    `/checkouts/${reference}`,
  );
  return data;
}

export async function reconcileCheckout(
  reference: string,
): Promise<CheckoutTransaction> {
  const { data } = await api.post<CheckoutTransaction>(
    `/checkouts/${reference}/reconcile`,
  );
  return data;
}
