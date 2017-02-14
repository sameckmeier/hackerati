import redis from 'redis';
import Bluebird from 'bluebird';

const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_DB,
} = process.env;

Bluebird.promisifyAll(redis.RedisClient.prototype);

const client = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT,
  db: REDIS_DB,
});

client.on('error', err => {
  throw err;
});

export default client;
