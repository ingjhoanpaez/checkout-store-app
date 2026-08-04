export class CheckoutTransactionNotFoundError extends Error {
  constructor(reference: string) {
    super(`No existe la transacción ${reference}`);
    this.name = CheckoutTransactionNotFoundError.name;
  }
}
