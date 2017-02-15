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
          // creates a new bid if it is the first or higher than the previos bid
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
        );
      }
    })
    // pushes bid id to list that stores bid ids for an auction
    .then(bidsId => Bluebird.all([
      client.rpushAsync(auctionsBidsIdsKey(auctionsId), bidsId),
      bidsId,
    ]))
    .then(res => {
      const bidsId = res[1];

      return bidsId;
    })
  );
};
