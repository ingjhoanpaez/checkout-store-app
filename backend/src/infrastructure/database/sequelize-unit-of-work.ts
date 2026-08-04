import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';
import type { UnitOfWorkPort } from '@modules/transactions/domain/ports/unit-of-work.port';

@Injectable()
export class SequelizeUnitOfWork implements UnitOfWorkPort {
  private readonly transactionStorage = new AsyncLocalStorage<Transaction>();

  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  execute<T>(work: () => Promise<T>): Promise<T> {
    return this.sequelize.transaction((transaction) =>
      this.transactionStorage.run(transaction, work),
    );
  }

  getCurrentTransaction(): Transaction | undefined {
    return this.transactionStorage.getStore();
  }
}
