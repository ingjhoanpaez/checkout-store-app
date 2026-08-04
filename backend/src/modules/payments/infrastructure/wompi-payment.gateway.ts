import { Injectable } from '@nestjs/common';
import { PaymentProviderError } from '../domain/errors/payment-provider-error';
import type {
  ChargeCardPaymentCommand,
  PaymentGatewayPort,
  PaymentResult,
} from '../domain/ports/payment-gateway.port';

interface WompiConfiguration {
  readonly apiUrl: string;
  readonly publicKey: string;
  readonly privateKey: string;
}

interface WompiTokenResponse {
  readonly data: {
    readonly id: string;
  };
}

interface WompiTransactionResponse {
  readonly data: {
    readonly id: string;
    readonly status: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isWompiTokenResponse(value: unknown): value is WompiTokenResponse {
  return (
    isRecord(value) && isRecord(value.data) && typeof value.data.id === 'string'
  );
}

function isWompiTransactionResponse(
  value: unknown,
): value is WompiTransactionResponse {
  return (
    isRecord(value) &&
    isRecord(value.data) &&
    typeof value.data.id === 'string' &&
    typeof value.data.status === 'string'
  );
}

@Injectable()
export class WompiPaymentGateway implements PaymentGatewayPort {
  constructor(private readonly configuration: WompiConfiguration) {}

  async chargeCard(command: ChargeCardPaymentCommand): Promise<PaymentResult> {
    const cardToken = await this.tokenizeCard(command);
    const transaction = await this.createTransaction(command, cardToken);

    return {
      status: this.toTransactionStatus(transaction.status),
      providerReference: transaction.id,
      providerStatus: transaction.status,
    };
  }

  async getPaymentStatus(providerReference: string): Promise<PaymentResult> {
    const response = await this.request(
      `/transactions/${encodeURIComponent(providerReference)}`,
      this.configuration.privateKey,
      'GET',
    );

    if (!isWompiTransactionResponse(response)) {
      throw new PaymentProviderError();
    }

    return {
      status: this.toTransactionStatus(response.data.status),
      providerReference: response.data.id,
      providerStatus: response.data.status,
    };
  }

  private async tokenizeCard(
    command: ChargeCardPaymentCommand,
  ): Promise<string> {
    const response = await this.request(
      '/tokens/cards',
      this.configuration.publicKey,
      'POST',
      {
        number: command.card.cardNumber,
        cvc: command.card.cvv,
        exp_month: command.card.expirationMonth,
        exp_year: command.card.expirationYear,
        card_holder: command.card.cardholderName,
      },
    );

    if (!isWompiTokenResponse(response)) {
      throw new PaymentProviderError();
    }

    return response.data.id;
  }

  private async createTransaction(
    command: ChargeCardPaymentCommand,
    cardToken: string,
  ): Promise<WompiTransactionResponse['data']> {
    const response = await this.request(
      '/transactions',
      this.configuration.privateKey,
      'POST',
      {
        amount_in_cents: command.amountInCents,
        currency: command.currency,
        customer_email: command.customerEmail,
        payment_method: {
          type: 'CARD',
          token: cardToken,
        },
        reference: command.transactionReference,
      },
    );

    if (!isWompiTransactionResponse(response)) {
      throw new PaymentProviderError();
    }

    return response.data;
  }

  private async request(
    path: string,
    authorizationKey: string,
    method: 'GET' | 'POST',
    body?: Record<string, unknown>,
  ): Promise<unknown> {
    let response: Response;

    try {
      response = await fetch(`${this.configuration.apiUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${authorizationKey}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new PaymentProviderError();
    }

    if (!response.ok) {
      throw new PaymentProviderError();
    }

    try {
      return (await response.json()) as unknown;
    } catch {
      throw new PaymentProviderError();
    }
  }

  private toTransactionStatus(providerStatus: string): PaymentResult['status'] {
    if (providerStatus === 'PENDING') {
      return 'PENDING';
    }

    if (providerStatus === 'APPROVED') {
      return 'APPROVED';
    }

    if (providerStatus === 'DECLINED') {
      return 'DECLINED';
    }

    return 'FAILED';
  }
}
