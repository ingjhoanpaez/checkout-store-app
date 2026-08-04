import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductNotFoundError } from '@modules/products/domain/errors/product-not-found.error';
import { ProductOutOfStockError } from '@modules/products/domain/errors/product-out-of-stock.error';
import { PaymentGatewayNotConfiguredError } from '@modules/payments/domain/errors/payment-gateway-not-configured.error';
import { CheckoutUseCase } from '../../application/use-cases/checkout.use-case';
import { ReconcileCheckoutPaymentUseCase } from '../../application/use-cases/reconcile-checkout-payment.use-case';
import { GetCheckoutByReferenceUseCase } from '../../application/use-cases/get-checkout-by-reference.use-case';
import { GetCheckoutSettingsUseCase } from '../../application/use-cases/get-checkout-settings.use-case';
import { CheckoutTransactionNotFoundError } from '../../domain/errors/checkout-transaction-not-found.error';
import type { CheckoutCommand } from '../../domain/ports/checkout-repository.port';
import { CheckoutRequestPipe } from './checkout-request.pipe';

// El controller es la ÚNICA capa que traduce Result -> HTTP status.
// Los casos de uso nunca lanzan para errores de negocio esperados;
// siempre retornan Result, y aquí se inspecciona result.error.
@Controller('checkouts')
@ApiTags('Checkouts')
export class CheckoutController {
  constructor(
    private readonly checkoutUseCase: CheckoutUseCase,
    private readonly reconcileCheckoutPaymentUseCase: ReconcileCheckoutPaymentUseCase,
    private readonly getCheckoutByReferenceUseCase: GetCheckoutByReferenceUseCase,
    private readonly getCheckoutSettingsUseCase: GetCheckoutSettingsUseCase,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Consultar tarifas configuradas para checkout' })
  @ApiOkResponse({
    description: 'Tarifas que el cliente debe usar para el resumen de compra.',
    schema: {
      type: 'object',
      required: ['currency', 'baseFeeInCents', 'deliveryFeeInCents'],
      properties: {
        currency: { type: 'string', example: 'COP' },
        baseFeeInCents: { type: 'integer', example: 2_500 },
        deliveryFeeInCents: { type: 'integer', example: 5_000 },
      },
    },
  })
  getSettings(): {
    currency: 'COP';
    baseFeeInCents: number;
    deliveryFeeInCents: number;
  } {
    return this.getCheckoutSettingsUseCase.execute().value;
  }

  @Get(':reference')
  @ApiOperation({
    summary: 'Consultar el estado de un checkout por referencia',
  })
  @ApiOkResponse({
    description: 'Checkout recuperado sin datos personales ni de pago.',
    schema: {
      type: 'object',
      required: [
        'reference',
        'status',
        'productId',
        'quantity',
        'productAmountInCents',
        'baseFeeInCents',
        'deliveryFeeInCents',
        'totalAmountInCents',
      ],
      properties: {
        reference: { type: 'string' },
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'DECLINED', 'FAILED'],
        },
        productId: { type: 'string', format: 'uuid' },
        quantity: { type: 'integer', minimum: 1 },
        productAmountInCents: { type: 'integer', example: 50_000 },
        baseFeeInCents: { type: 'integer', example: 2_500 },
        deliveryFeeInCents: { type: 'integer', example: 5_000 },
        totalAmountInCents: { type: 'integer', example: 57_500 },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Checkout no encontrado.' })
  async findByReference(@Param('reference') reference: string): Promise<{
    reference: string;
    status: string;
    productId: string;
    quantity: number;
    productAmountInCents: number;
    baseFeeInCents: number;
    deliveryFeeInCents: number;
    totalAmountInCents: number;
  }> {
    const result = await this.getCheckoutByReferenceUseCase.execute(reference);

    if (result.isFailure) {
      throw new NotFoundException(result.error.message);
    }

    const transaction = result.value;

    return {
      reference: transaction.reference,
      status: transaction.status,
      productId: transaction.productId,
      quantity: transaction.quantity,
      productAmountInCents: transaction.productAmountInCents,
      baseFeeInCents: transaction.baseFeeInCents,
      deliveryFeeInCents: transaction.deliveryFeeInCents,
      totalAmountInCents: transaction.totalAmountInCents,
    };
  }

  @Post(':reference/reconcile')
  @HttpCode(200)
  @ApiOperation({ summary: 'Conciliar un checkout pendiente con la pasarela' })
  @ApiOkResponse({
    description: 'Estado de checkout actualizado o confirmado.',
    schema: {
      type: 'object',
      required: ['reference', 'status', 'totalAmountInCents'],
      properties: {
        reference: { type: 'string' },
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'DECLINED', 'FAILED'],
        },
        totalAmountInCents: { type: 'integer', example: 57_500 },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Checkout no encontrado.' })
  @ApiServiceUnavailableResponse({ description: 'Pasarela no configurada.' })
  async reconcile(@Param('reference') reference: string): Promise<{
    reference: string;
    status: string;
    totalAmountInCents: number;
  }> {
    const result =
      await this.reconcileCheckoutPaymentUseCase.execute(reference);

    if (result.isFailure) {
      const error = result.error;

      if (error instanceof CheckoutTransactionNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof PaymentGatewayNotConfiguredError) {
        throw new ServiceUnavailableException(error.message);
      }

      throw new InternalServerErrorException(
        'No fue posible conciliar el checkout',
      );
    }

    const transaction = result.value;

    return {
      reference: transaction.reference,
      status: transaction.status,
      totalAmountInCents: transaction.totalAmountInCents,
    };
  }

  @Post()
  @ApiOperation({
    summary: 'Crear un checkout con tarjeta',
    description:
      'La tarjeta se tokeniza en la pasarela y nunca se almacena ni se devuelve.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'reference',
        'productId',
        'quantity',
        'customer',
        'delivery',
        'card',
      ],
      properties: {
        reference: { type: 'string', example: 'checkout-20260803-001' },
        productId: {
          type: 'string',
          format: 'uuid',
          example: '8b4d404c-0b5e-4a8c-b09a-2a430abf3e7d',
        },
        quantity: { type: 'integer', minimum: 1, example: 1 },
        customer: {
          type: 'object',
          required: ['fullName', 'email', 'phone'],
          properties: {
            fullName: { type: 'string', example: 'Ada Lovelace' },
            email: {
              type: 'string',
              format: 'email',
              example: 'ada@example.com',
            },
            phone: { type: 'string', example: '3000000000' },
          },
        },
        delivery: {
          type: 'object',
          required: [
            'recipientName',
            'phone',
            'addressLine1',
            'city',
            'region',
            'country',
          ],
          properties: {
            recipientName: { type: 'string', example: 'Ada Lovelace' },
            phone: { type: 'string', example: '3000000000' },
            addressLine1: { type: 'string', example: 'Calle 1' },
            city: { type: 'string', example: 'Bogotá' },
            region: { type: 'string', example: 'Cundinamarca' },
            country: { type: 'string', example: 'CO' },
            postalCode: { type: 'string', nullable: true, example: '110111' },
          },
        },
        card: {
          type: 'object',
          required: [
            'cardNumber',
            'cardholderName',
            'expirationMonth',
            'expirationYear',
            'cvv',
          ],
          properties: {
            cardNumber: { type: 'string', example: '4111111111111111' },
            cardholderName: { type: 'string', example: 'Ada Lovelace' },
            expirationMonth: { type: 'string', example: '12' },
            expirationYear: { type: 'string', example: '2030' },
            cvv: { type: 'string', example: '123', writeOnly: true },
          },
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Checkout procesado. No contiene datos de tarjeta.',
    schema: {
      type: 'object',
      required: ['reference', 'status', 'totalAmountInCents'],
      properties: {
        reference: { type: 'string' },
        status: {
          type: 'string',
          enum: ['PENDING', 'APPROVED', 'DECLINED', 'FAILED'],
        },
        totalAmountInCents: { type: 'integer', example: 50_000 },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Solicitud de checkout inválida.' })
  @ApiNotFoundResponse({ description: 'Producto no encontrado.' })
  @ApiConflictResponse({ description: 'Stock insuficiente.' })
  @ApiServiceUnavailableResponse({ description: 'Pasarela no configurada.' })
  async create(
    @Body(new CheckoutRequestPipe()) command: CheckoutCommand,
  ): Promise<{
    reference: string;
    status: string;
    totalAmountInCents: number;
  }> {
    const result = await this.checkoutUseCase.execute(command);

    if (result.isFailure) {
      const error = result.error;

      if (error instanceof ProductNotFoundError) {
        throw new NotFoundException(error.message);
      }

      if (error instanceof ProductOutOfStockError) {
        throw new ConflictException(error.message);
      }

      if (error instanceof PaymentGatewayNotConfiguredError) {
        throw new ServiceUnavailableException(error.message);
      }

      throw new InternalServerErrorException(
        'No fue posible procesar el checkout',
      );
    }

    const transaction = result.value;

    return {
      reference: transaction.reference,
      status: transaction.status,
      totalAmountInCents: transaction.totalAmountInCents,
    };
  }
}
