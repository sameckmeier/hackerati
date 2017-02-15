import { isType } from '../../lib/utils';
import { buildStoreKey } from '../../lib/actionsHelpers';

export const BIDS = 'bids';

// key to keep track of the current unique id for bids
export const bidsIdIndexKey = () => buildStoreKey('.', BIDS, 'id', 'index');
// id key for a bid record
export const bidsIdKey = id => buildStoreKey(':', BIDS, id);

export const schema = {
  fields: [
    'auctionsId',
    'participantsId',
    'price',
  ],
  constraints: {
    auctionsId: auctionsId => isType(auctionsId, 'Number'),
    participantsId: participantsId => isType(participantsId, 'Number'),
    price: price => isType(price, 'Number'),
  },
};
