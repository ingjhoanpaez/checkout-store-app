import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { CheckoutUseCase } from '../src/modules/transactions/application/use-cases/checkout.use-case';
import { ReconcileCheckoutPaymentUseCase } from '../src/modules/transactions/application/use-cases/reconcile-checkout-payment.use-case';
import { GetCheckoutByReferenceUseCase } from '../src/modules/transactions/application/use-cases/get-checkout-by-reference.use-case';
import { GetCheckoutSettingsUseCase } from '../src/modules/transactions/application/use-cases/get-checkout-settings.use-case';
import { CheckoutTransaction } from '../src/modules/transactions/domain/checkout-transaction.entity';
import { CheckoutController } from '../src/modules/transactions/infrastructure/http/checkout.controller';

describe('CheckoutController (e2e)', () => {
  let app: INestApplication<App>;
  const execute = jest.fn<CheckoutUseCase['execute']>();
  const reconcile = jest.fn<ReconcileCheckoutPaymentUseCase['execute']>();
  const findByReference = jest.fn<GetCheckoutByReferenceUseCase['execute']>();
  const getSettings = jest.fn<GetCheckoutSettingsUseCase['execute']>();
  const validRequest = {
    reference: 'checkout-http-1',
    productId: '8b4d404c-0b5e-4a8c-b09a-2a430abf3e7d',
    quantity: 1,
    customer: {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: '3000000000',
    },
    delivery: {
      recipientName: 'Ada Lovelace',
      phone: '3000000000',
      addressLine1: 'Calle 1',
      city: 'Bogotá',
      region: 'Cundinamarca',
      country: 'co',
      postalCode: null,
    },
    card: {
      cardNumber: '4111111111111111',
      cardholderName: 'Ada Lovelace',
      expirationMonth: '12',
      expirationYear: '2030',
      cvv: '123',
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CheckoutController],
      providers: [
        {
          provide: CheckoutUseCase,
          useValue: { execute },
        },
        {
          provide: ReconcileCheckoutPaymentUseCase,
          useValue: { execute: reconcile },
        },
        {
          provide: GetCheckoutByReferenceUseCase,
          useValue: { execute: findByReference },
        },
        {
          provide: GetCheckoutSettingsUseCase,
          useValue: { execute: getSettings },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('POST /checkouts returns only non-sensitive checkout data', async () => {
    execute.mockResolvedValue(
      new CheckoutTransaction(
        'transaction-1',
        validRequest.reference,
        'APPROVED',
        validRequest.productId,
        'customer-1',
        'delivery-1',
        1,
        50_000,
        0,
        0,
        50_000,
        'provider-1',
        'APPROVED',
      ),
    );

    await request(app.getHttpServer())
      .post('/checkouts')
      .send(validRequest)
      .expect(201)
      .expect({
        reference: validRequest.reference,
        status: 'APPROVED',
        totalAmountInCents: 50_000,
      });

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('POST /checkouts rejects an invalid request before invoking checkout', async () => {
    await request(app.getHttpServer())
      .post('/checkouts')
      .send({ ...validRequest, quantity: 0 })
      .expect(400);

    expect(execute).not.toHaveBeenCalled();
  });

  it('GET /checkouts/:reference returns persisted checkout data without personal details', async () => {
    findByReference.mockResolvedValue(
      new CheckoutTransaction(
        'transaction-1',
        validRequest.reference,
        'APPROVED',
        validRequest.productId,
        'customer-1',
        'delivery-1',
        1,
        50_000,
        2_500,
        5_000,
        57_500,
        'provider-1',
        'APPROVED',
      ),
    );

    await request(app.getHttpServer())
      .get(`/checkouts/${validRequest.reference}`)
      .expect(200)
      .expect({
        reference: validRequest.reference,
        status: 'APPROVED',
        productId: validRequest.productId,
        quantity: 1,
        productAmountInCents: 50_000,
        baseFeeInCents: 2_500,
        deliveryFeeInCents: 5_000,
        totalAmountInCents: 57_500,
      });
  });

  it('GET /checkouts/settings returns the configured pricing policy', async () => {
    getSettings.mockReturnValue({
      currency: 'COP',
      baseFeeInCents: 2_500,
      deliveryFeeInCents: 5_000,
    });

    await request(app.getHttpServer()).get('/checkouts/settings').expect(200, {
      currency: 'COP',
      baseFeeInCents: 2_500,
      deliveryFeeInCents: 5_000,
    });
  });

  it('POST /checkouts/:reference/reconcile returns the reconciled checkout status', async () => {
    reconcile.mockResolvedValue(
      new CheckoutTransaction(
        'transaction-1',
        validRequest.reference,
        'APPROVED',
        validRequest.productId,
        'customer-1',
        'delivery-1',
        1,
        50_000,
        2_500,
        5_000,
        57_500,
        'provider-1',
        'APPROVED',
      ),
    );

    await request(app.getHttpServer())
      .post(`/checkouts/${validRequest.reference}/reconcile`)
      .expect(200)
      .expect({
        reference: validRequest.reference,
        status: 'APPROVED',
        totalAmountInCents: 57_500,
      });
  });

  afterEach(async () => {
    await app.close();
    execute.mockReset();
    reconcile.mockReset();
    findByReference.mockReset();
    getSettings.mockReset();
  });
});
