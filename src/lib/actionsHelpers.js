import Bluebird from 'bluebird';
import client from '../config/redis';
import TYPES from '../store/types';
import { convertType, isDefined } from './utils';

export const buildStoreKey = (separator, ...keys) => keys.reduce(
  (a, b, i) => {
    let key = b;

    if (i > 0) {
      key = a + separator + b;
    }

    return key;
  },
  '',
);

export const convertObjectValues = object => {
  const convertedObject = {};
  const fields = Object.keys(object);

  fields.forEach(f => {
    convertedObject[f] = convertType(object[f]);
  });

  return convertedObject;
};

export const validValue = args => {
  const {
    field,
    value,
    constraint,
    type,
  } = args;

  if (constraint) {
    if (!constraint(value)) {
      throw new Error(`Invalid value for ${type}:${field}`);
    } else {
      return true;
    }
  } else {
    throw new Error(`Invalid constraint for ${type}:${field}`);
  }
};

export const get = key => client.hgetallAsync(key)
.then(record => {
  const r = record ? convertObjectValues(record) : record;
  return r;
});

export const save = (id, type, rawRecord) => {
  const formattedParams = convertObjectValues(rawRecord);
  let errMsg;

  if (!isDefined(id)) {
    errMsg = 'undefined id';
  } else if (Object.keys(rawRecord).length === 0) {
    errMsg = 'empty record';
  } else if (!TYPES.includes(type)) {
    errMsg = `invalid type ${type}`;
  }

  if (errMsg) {
    throw new Error(errMsg);
  }

  return (
    Bluebird.all([
      client.hmsetAsync(buildStoreKey(':', type, id), formattedParams),
      id,
    ])
    .then(res => res[1])
  );
};

export const persist = (idIndexKey, type, rawRecord) => {
  client.incr(idIndexKey);

  return (
    client.getAsync(idIndexKey)
    .then(id => save(id, type, Object.assign({}, rawRecord, { id })))
  );
};

export const update = args => {
  const {
    id,
    type,
    newValues,
    schema,
  } = args;

  const { constraints } = schema;

  return (
    get(buildStoreKey(':', type, id))
    .then(record => {
      const fields = Object.keys(newValues);
      let value;
      let constraint;

      fields.forEach(field => {
        constraint = constraints[field];
        value = newValues[field];

        validValue({
          field,
          value,
          constraint,
          type,
        });
      });

      return Object.assign({}, record, newValues);
    })
    .then(updatedRecord => save(id, type, updatedRecord))
  );
};

export const create = args => {
  const {
    params,
    schema,
    idIndexKey,
    type,
  } = args;

  const {
    fields,
    defaults,
    constraints,
  } = schema;

  return (
    new Bluebird((resolve) => {
      const validatedParams = {};
      let value;
      let constraint;

      fields.forEach(field => {
        value = params[field];
        constraint = constraints[field];

        if (defaults) {
          const defaultValue = defaults[field];
          value = value === undefined ? defaultValue : value;
        }

        validValue({
          field,
          value,
          constraint,
          type,
        });

        validatedParams[field] = value;
      });

      resolve(validatedParams);
    })
    .then(validParams => persist(idIndexKey, type, validParams))
  );
};
