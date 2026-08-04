export class PaymentProviderError extends Error {
  constructor() {
    super('La pasarela de pago no pudo procesar la transacción');
    this.name = PaymentProviderError.name;
  }
}
