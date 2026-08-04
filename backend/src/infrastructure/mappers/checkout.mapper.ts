import { CustomerModel } from '@infrastructure/database/models/customer.model';
import { DeliveryModel } from '@infrastructure/database/models/delivery.model';
import { TransactionModel } from '@infrastructure/database/models/transaction.model';
import { Customer } from '@modules/customers/domain/customer.entity';
import { Delivery } from '@modules/deliveries/domain/delivery.entity';
import { CheckoutTransaction } from '@modules/transactions/domain/checkout-transaction.entity';

export class CheckoutMapper {
  static customerToDomain(this: void, model: CustomerModel): Customer {
    return new Customer(model.id, model.fullName, model.email, model.phone);
  }

  static deliveryToDomain(this: void, model: DeliveryModel): Delivery {
    return new Delivery(
      model.id,
      model.customerId,
      model.recipientName,
      model.phone,
      model.addressLine1,
      model.city,
      model.region,
      model.country,
      model.postalCode,
    );
  }

  static transactionToDomain(
    this: void,
    model: TransactionModel,
  ): CheckoutTransaction {
    return new CheckoutTransaction(
      model.id,
      model.reference,
      model.status,
      model.productId,
      model.customerId,
      model.deliveryId,
      model.quantity,
      model.productAmountInCents,
      model.baseFeeInCents,
      model.deliveryFeeInCents,
      model.totalAmountInCents,
      model.providerReference,
      model.providerStatus,
    );
  }
}
