export class PaymentGatewayNotConfiguredError extends Error {
  constructor() {
    super('No hay una pasarela de pago configurada');
    this.name = PaymentGatewayNotConfiguredError.name;
  }
}
