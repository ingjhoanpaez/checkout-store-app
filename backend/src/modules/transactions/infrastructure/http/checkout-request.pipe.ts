import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import * as Joi from 'joi';
import type { CheckoutCommand } from '../../domain/ports/checkout-repository.port';

interface CheckoutRequest {
  reference: string;
  productId: string;
  quantity: number;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  delivery: {
    recipientName: string;
    phone: string;
    addressLine1: string;
    city: string;
    region: string;
    country: string;
    postalCode: string | null;
  };
  card: {
    cardNumber: string;
    cardholderName: string;
    expirationMonth: string;
    expirationYear: string;
    cvv: string;
  };
}

const checkoutRequestSchema = Joi.object<CheckoutRequest>({
  reference: Joi.string().trim().max(100).required(),
  productId: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
  customer: Joi.object({
    fullName: Joi.string().trim().min(1).max(150).required(),
    email: Joi.string().trim().email().max(254).required(),
    phone: Joi.string().trim().min(7).max(30).required(),
  }).required(),
  delivery: Joi.object({
    recipientName: Joi.string().trim().min(1).max(150).required(),
    phone: Joi.string().trim().min(7).max(30).required(),
    addressLine1: Joi.string().trim().min(1).max(255).required(),
    city: Joi.string().trim().min(1).max(100).required(),
    region: Joi.string().trim().min(1).max(100).required(),
    country: Joi.string().trim().length(2).uppercase().required(),
    postalCode: Joi.string().trim().max(20).allow(null).default(null),
  }).required(),
  card: Joi.object({
    cardNumber: Joi.string()
      .pattern(/^\d{13,19}$/)
      .required(),
    cardholderName: Joi.string().trim().min(1).max(150).required(),
    expirationMonth: Joi.string()
      .pattern(/^(0[1-9]|1[0-2])$/)
      .required(),
    expirationYear: Joi.string()
      .pattern(/^\d{4}$/)
      .required(),
    cvv: Joi.string()
      .pattern(/^\d{3,4}$/)
      .required(),
  }).required(),
});

function isCheckoutRequest(value: unknown): value is CheckoutRequest {
  return typeof value === 'object' && value !== null;
}

@Injectable()
export class CheckoutRequestPipe implements PipeTransform<
  unknown,
  CheckoutCommand
> {
  transform(value: unknown): CheckoutCommand {
    const validation = checkoutRequestSchema.validate(value, {
      abortEarly: false,
      convert: true,
      stripUnknown: true,
    });

    if (validation.error || !isCheckoutRequest(validation.value)) {
      throw new BadRequestException('Solicitud de checkout inválida');
    }

    return validation.value;
  }
}
