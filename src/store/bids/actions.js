import Bluebird from 'bluebird';
import client from '../../config/redis';
import { auctionsBidsIdsKey } from '../auctions/schema';
import { create, get } from '../../lib/actionsHelpers';
import {
  BIDS,
  schema,
  bidsIdKey,
  bidsIdIndexKey,
} from './schema';

export default params => {
  const {
    auctionsId,
    participantsId,
    price,
  } = params;

  return (
    client.lindexAsync(auctionsBidsIdsKey(auctionsId), -1)
    .then(highestBidId => get(bidsIdKey(highestBidId)))
    .then(bid => {
      if (bid && price <= bid.price) {
        throw new Error('Invalid bid');
      } else {
        return (
          create({
            params: {
              auctionsId,
              participantsId,
              price,
            },
            schema,
            idIndexKey: bidsIdIndexKey(),
            type: BIDS,
          })
          .then(bidsId => Bluebird.all([
            client.rpushAsync(auctionsBidsIdsKey(auctionsId), bidsId),
            bidsId,
          ]))
          .then(res => res[1])
        );
      }
    })
  );
};
