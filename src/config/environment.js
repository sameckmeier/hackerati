import dotenv from 'dotenv';
import path from 'path';
import { defaults } from '../lib/utils';

defaults(process.env, {
  NODE_ENV: 'development',
  REDIS_HOST: '127.0.0.1',
  REDIS_PORT: 6379,
});

const { NODE_ENV } = process.env;

dotenv.config({
  path: path.join(__dirname, '../../', `.env.${NODE_ENV}`),
  silent: true,
});
