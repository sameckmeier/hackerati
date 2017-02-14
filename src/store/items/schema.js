import { isType } from '../../lib/utils';
import { buildStoreKey } from '../../lib/actionsHelpers';

export const ITEMS = 'items';

export const itemsIdIndexKey = () => buildStoreKey('.', ITEMS, 'id', 'index');
export const itemsNameKey = name => buildStoreKey('.', ITEMS, name);
export const itemsIdKey = id => buildStoreKey(':', ITEMS, id);

export const schema = {
  fields: [
    'name',
    'reservedPrice',
    'sold',
  ],
  constraints: {
    name: name => isType(name, 'String'),
    reservedPrice: reservedPrice => isType(reservedPrice, 'Number'),
    sold: sold => isType(sold, 'Boolean'),
  },
  defaults: { sold: false },
};
