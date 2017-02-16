import dotenv from 'dotenv';
import path from 'path';

// any machine specific env vars you set will overide these default values 
process.env = Object.assign(
  {},
  {
    NODE_ENV: 'development',
    REDIS_HOST: '127.0.0.1',
    REDIS_PORT: 6379,
  },
  process.env,
);

const { NODE_ENV } = process.env;

// dotenv does not overide env vars that have already been set
// so set any general env vars above
dotenv.config({
  path: path.join(__dirname, '../../', `.env.${NODE_ENV}`),
  silent: true,
});
