import * as Joi from 'joi';

export type NodeEnvironment = 'development' | 'test' | 'production';

interface EnvironmentInput {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  PAYMENT_PROVIDER: 'disabled' | 'wompi-sandbox';
  WOMPI_API_URL?: string;
  WOMPI_PUBLIC_KEY?: string;
  WOMPI_PRIVATE_KEY?: string;
  BASE_FEE_IN_CENTS: number;
  DELIVERY_FEE_IN_CENTS: number;
  FRONTEND_URL: string;
}

interface WompiEnvironmentInput extends EnvironmentInput {
  PAYMENT_PROVIDER: 'wompi-sandbox';
  WOMPI_API_URL: string;
  WOMPI_PUBLIC_KEY: string;
  WOMPI_PRIVATE_KEY: string;
}

export interface Environment {
  readonly nodeEnv: NodeEnvironment;
  readonly port: number;
  readonly database: {
    readonly host: string;
    readonly port: number;
    readonly name: string;
    readonly user: string;
    readonly password: string;
  };
  readonly payment: {
    readonly provider: 'disabled' | 'wompi-sandbox';
    readonly wompi: {
      readonly apiUrl: string;
      readonly publicKey: string;
      readonly privateKey: string;
    } | null;
  };
  readonly checkout: {
    readonly currency: 'COP';
    readonly baseFeeInCents: number;
    readonly deliveryFeeInCents: number;
  };
  readonly frontendUrl: string;
}

export const envValidationSchema = Joi.object<EnvironmentInput>({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  PAYMENT_PROVIDER: Joi.string()
    .valid('disabled', 'wompi-sandbox')
    .default('disabled'),
  WOMPI_API_URL: Joi.string().uri().when('PAYMENT_PROVIDER', {
    is: 'wompi-sandbox',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  WOMPI_PUBLIC_KEY: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'wompi-sandbox',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  WOMPI_PRIVATE_KEY: Joi.string().when('PAYMENT_PROVIDER', {
    is: 'wompi-sandbox',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  BASE_FEE_IN_CENTS: Joi.number().integer().min(0).default(2_500),
  DELIVERY_FEE_IN_CENTS: Joi.number().integer().min(0).default(5_000),
  // Origen permitido para CORS. En Docker Compose el frontend queda en
  // localhost:5173; en despliegue real se sobreescribe por variable de entorno.
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
});

let cachedEnvironment: Environment | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isEnvironmentInput(value: unknown): value is EnvironmentInput {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.NODE_ENV === 'development' ||
      value.NODE_ENV === 'test' ||
      value.NODE_ENV === 'production') &&
    typeof value.PORT === 'number' &&
    typeof value.DB_HOST === 'string' &&
    typeof value.DB_PORT === 'number' &&
    typeof value.DB_NAME === 'string' &&
    typeof value.DB_USER === 'string' &&
    typeof value.DB_PASSWORD === 'string' &&
    typeof value.BASE_FEE_IN_CENTS === 'number' &&
    typeof value.DELIVERY_FEE_IN_CENTS === 'number' &&
    typeof value.FRONTEND_URL === 'string' &&
    (value.PAYMENT_PROVIDER === 'disabled' ||
      (value.PAYMENT_PROVIDER === 'wompi-sandbox' &&
        typeof value.WOMPI_API_URL === 'string' &&
        typeof value.WOMPI_PUBLIC_KEY === 'string' &&
        typeof value.WOMPI_PRIVATE_KEY === 'string'))
  );
}

function isWompiEnvironmentInput(
  value: EnvironmentInput,
): value is WompiEnvironmentInput {
  return (
    value.PAYMENT_PROVIDER === 'wompi-sandbox' &&
    typeof value.WOMPI_API_URL === 'string' &&
    typeof value.WOMPI_PUBLIC_KEY === 'string' &&
    typeof value.WOMPI_PRIVATE_KEY === 'string'
  );
}

function parseEnvironment(source: Record<string, unknown>): EnvironmentInput {
  const validation = envValidationSchema.validate(source, {
    abortEarly: false,
    allowUnknown: true,
  });

  if (validation.error) {
    throw new Error(
      `Configuración de entorno inválida: ${validation.error.message}`,
    );
  }

  if (!isEnvironmentInput(validation.value)) {
    throw new Error('Configuración de entorno inválida tras la validación');
  }

  return validation.value;
}

function toEnvironment(environment: EnvironmentInput): Environment {
  const wompiEnvironment = isWompiEnvironmentInput(environment)
    ? environment
    : null;

  return {
    nodeEnv: environment.NODE_ENV,
    port: environment.PORT,
    database: {
      host: environment.DB_HOST,
      port: environment.DB_PORT,
      name: environment.DB_NAME,
      user: environment.DB_USER,
      password: environment.DB_PASSWORD,
    },
    payment: {
      provider: environment.PAYMENT_PROVIDER,
      wompi: wompiEnvironment
        ? {
            apiUrl: wompiEnvironment.WOMPI_API_URL,
            publicKey: wompiEnvironment.WOMPI_PUBLIC_KEY,
            privateKey: wompiEnvironment.WOMPI_PRIVATE_KEY,
          }
        : null,
    },
    checkout: {
      currency: 'COP',
      baseFeeInCents: environment.BASE_FEE_IN_CENTS,
      deliveryFeeInCents: environment.DELIVERY_FEE_IN_CENTS,
    },
    frontendUrl: environment.FRONTEND_URL,
  };
}

export function validateEnvironment(
  source: Record<string, unknown>,
): Record<string, unknown> {
  const environment = parseEnvironment(source);
  cachedEnvironment = toEnvironment(environment);

  return { ...source, ...environment };
}

export function readEnvironment(): Environment {
  if (cachedEnvironment) {
    return cachedEnvironment;
  }

  cachedEnvironment = toEnvironment(parseEnvironment(process.env));
  return cachedEnvironment;
}
