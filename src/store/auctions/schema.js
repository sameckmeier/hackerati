import { isType } from '../../lib/utils';
import { buildStoreKey } from '../../lib/actionsHelpers';

export const AUCTIONS = 'auctions';

// key to keep track of the current unique id for auctions
export const auctionsIdIndexKey = () => buildStoreKey('.', AUCTIONS, 'id', 'index');
// id key for an auction record
export const auctionsIdKey = id => buildStoreKey(':', AUCTIONS, id);
// key to an auction record's list of bid ids
export const auctionsBidsIdsKey = bidId => buildStoreKey('.', AUCTIONS, 'bids', bidId);

export const schema = {
  fields: [
    'auctioneersId',
    'itemsId',
    'winnersId',
    'success',
    'active',
  ],
  constraints: {
    auctioneersId: auctioneersId => isType(auctioneersId, 'Number'),
    itemsId: itemsId => isType(itemsId, 'Number'),
    winnersId: winnersId => isType(winnersId, 'Number') || isType(winnersId, 'Null'),
    success: success => isType(success, 'Boolean') || isType(success, 'Null'),
    active: active => isType(active, 'Boolean'),
  },
  defaults: {
    active: true,
    success: null,
    winnersId: null,
  },
};
