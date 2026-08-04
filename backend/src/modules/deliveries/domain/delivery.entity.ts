export class Delivery {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly recipientName: string,
    public readonly phone: string,
    public readonly addressLine1: string,
    public readonly city: string,
    public readonly region: string,
    public readonly country: string,
    public readonly postalCode: string | null,
  ) {}
}
