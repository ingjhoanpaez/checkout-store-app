import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetProductsUseCase } from '../../application/use-cases/get-products.use-case';

// El controller SOLO traduce HTTP <-> caso de uso. No arma queries,
// no valida reglas de negocio, no sabe que existe Sequelize.
@Controller('products')
@ApiTags('Products')
export class ProductsController {
  constructor(private readonly getProductsUseCase: GetProductsUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos disponibles' })
  @ApiOkResponse({
    description: 'Productos disponibles para compra.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'name', 'description', 'priceInCents', 'stock'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          priceInCents: { type: 'integer', example: 50_000 },
          stock: { type: 'integer', example: 25 },
        },
      },
    },
  })
  async findAll() {
    const result = await this.getProductsUseCase.execute();

    if (result.isFailure) {
      throw new InternalServerErrorException(result.error.message);
    }

    return result.value;
  }
}
