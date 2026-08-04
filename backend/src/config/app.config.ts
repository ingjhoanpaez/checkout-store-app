import { readEnvironment } from './environment';

export default () => {
  const environment = readEnvironment();

  return {
    app: {
      port: environment.port,
      nodeEnv: environment.nodeEnv,
      frontendUrl: environment.frontendUrl,
    },
  };
};
