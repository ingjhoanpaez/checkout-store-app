export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export default (): { app: AppConfig } => ({
  app: {
    port: Number(process.env.PORT ?? 3000),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },
});
