import { isType } from '../../lib/utils';
import { buildStoreKey } from '../../lib/actionsHelpers';

export const AUCTIONS = 'auctions';

export const auctionsIdIndexKey = () => buildStoreKey('.', AUCTIONS, 'id', 'index');
export const auctionsItemsIdKey = itemsId => buildStoreKey('.', AUCTIONS, 'items_id', itemsId);
export const auctionsIdKey = id => buildStoreKey(':', AUCTIONS, id);
export const auctionsBidsIdsKey = id => buildStoreKey('.', AUCTIONS, 'bids', id);

export const schema = {
  fields: [
    'auctioneersId',
    'itemsId',
    'winnersId',
    'success',
  ],
  constraints: {
    auctioneersId: auctioneersId => isType(auctioneersId, 'Number'),
    itemsId: itemsId => isType(itemsId, 'Number'),
    winnersId: winnersId => isType(winnersId, 'Number') || isType(winnersId, 'Null'),
    success: success => isType(success, 'Boolean') || isType(success, 'Null'),
  },
  defaults: {
    success: null,
    winnersId: null,
  },
};
