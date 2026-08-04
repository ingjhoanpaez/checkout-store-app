export const transactionStatuses = [
  'PENDING',
  'APPROVED',
  'DECLINED',
  'FAILED',
] as const;

export type TransactionStatus = (typeof transactionStatuses)[number];
