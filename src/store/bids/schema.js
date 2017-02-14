import { isType } from '../../lib/utils';
import { buildStoreKey } from '../../lib/actionsHelpers';

export const BIDS = 'bids';

export const bidsIdIndexKey = () => buildStoreKey('.', BIDS, 'id', 'index');
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
