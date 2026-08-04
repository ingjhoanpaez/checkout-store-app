require('dotenv').config();
const fs = require('fs');
const path = require('path');

const compiledConfigPath = path.resolve(
  __dirname,
  '..',
  'dist',
  'config',
  'database.config.js',
);

if (!fs.existsSync(compiledConfigPath)) {
  require('ts-node/register');
}

const { createPostgresConnectionOptions } = require(
  fs.existsSync(compiledConfigPath)
    ? compiledConfigPath
    : '../src/config/database.config',
);

const connection = createPostgresConnectionOptions();

module.exports = {
  development: connection,
  test: connection,
  production: connection,
};
