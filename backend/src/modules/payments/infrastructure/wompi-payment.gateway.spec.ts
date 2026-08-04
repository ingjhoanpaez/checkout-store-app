import { PaymentProviderError } from '../domain/errors/payment-provider-error';
import { WompiPaymentGateway } from './wompi-payment.gateway';

describe('WompiPaymentGateway', () => {
  const gateway = new WompiPaymentGateway({
    apiUrl: 'https://sandbox.wompi.co/v1',
    publicKey: 'pub_test_example',
    privateKey: 'prv_test_example',
  });
  const command = {
    transactionReference: 'checkout-1',
    amountInCents: 50_000,
    currency: 'COP',
    customerEmail: 'ada@example.com',
    card: {
      cardNumber: '4242424242424242',
      cardholderName: 'Ada Lovelace',
      expirationMonth: '12',
      expirationYear: '2030',
      cvv: '123',
    },
  };
  const fetchMock = jest.spyOn(global, 'fetch');

  afterEach(() => {
    fetchMock.mockReset();
  });

  it('tokenizes a card and creates an approved sandbox transaction', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 'tok_test_1' } }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { id: 'transaction_1', status: 'APPROVED' } }),
          { status: 201 },
        ),
      );

    const result = await gateway.chargeCard(command);

    expect(result).toEqual({
      status: 'APPROVED',
      providerReference: 'transaction_1',
      providerStatus: 'APPROVED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://sandbox.wompi.co/v1/tokens/cards',
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://sandbox.wompi.co/v1/transactions',
    );
  });

  it('preserves a pending provider status for later reconciliation', async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 'tok_test_1' } }), {
          status: 201,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { id: 'transaction_2', status: 'PENDING' } }),
          { status: 201 },
        ),
      );

    const result = await gateway.chargeCard(command);

    expect(result.status).toBe('PENDING');
  });

  it('retrieves a transaction status for reconciliation', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: { id: 'transaction_3', status: 'DECLINED' } }),
        { status: 200 },
      ),
    );

    const result = await gateway.getPaymentStatus('transaction_3');

    expect(result).toEqual({
      status: 'DECLINED',
      providerReference: 'transaction_3',
      providerStatus: 'DECLINED',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.wompi.co/v1/transactions/transaction_3',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('does not surface provider response details when a request fails', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 401 }));

    await expect(gateway.chargeCard(command)).rejects.toBeInstanceOf(
      PaymentProviderError,
    );
  });
});
