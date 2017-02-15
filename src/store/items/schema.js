import { isType } from '../../lib/utils';
import { buildStoreKey } from '../../lib/actionsHelpers';

export const ITEMS = 'items';

// key to keep track of the current unique id for items
export const itemsIdIndexKey = () => buildStoreKey('.', ITEMS, 'id', 'index');
// key to enable item record fetching from a name
export const itemsNameKey = name => buildStoreKey('.', ITEMS, name);
// id key for an auction record
export const itemsIdKey = id => buildStoreKey(':', ITEMS, id);
// key to an item record's list of auction ids
export const itemsAuctionsIdsKey = id => buildStoreKey('.', ITEMS, 'auctions', id);

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
