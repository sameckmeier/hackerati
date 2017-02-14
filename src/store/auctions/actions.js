import Bluebird from 'bluebird';
import client from '../../config/redis';
import { bidsIdKey } from '../bids/schema';
import {
  update,
  create,
  get,
} from '../../lib/actionsHelpers';
import {
  schema as itemsSchema,
  ITEMS,
  itemsIdKey,
} from '../items/schema';
import {
  AUCTIONS,
  schema,
  auctionsItemsIdKey,
  auctionsBidsIdsKey,
  auctionsIdIndexKey,
 } from './schema';

export const createAuction = params => {
  let promise;

  const {
    auctioneersId,
    itemsId,
    sold,
  } = params;

  if (sold) {
    promise = Bluebird.reject(new Error('Item has already been sold'));
  } else {
    promise = client.getAsync(auctionsItemsIdKey(itemsId))
    .then(auctionsId => {
      if (auctionsId) {
        throw new Error('Item is already on auction');
      } else {
        return (
          create({
            params: { auctioneersId, itemsId },
            schema,
            idIndexKey: auctionsIdIndexKey(),
            type: AUCTIONS,
          })
          .then(auctionsId => Bluebird.all(
            [
              client.setAsync(auctionsItemsIdKey(itemsId), auctionsId),
              auctionsId,
            ],
          ))
          .then(res => {
            const auctionsId = res[1];

            return auctionsId;
          })
        );
      }
    });
  }

  return promise;
};

export const closeAuction = (id, itemsId) => {
  const item = get(itemsIdKey(itemsId));
  const highestBid = client.lindexAsync(auctionsBidsIdsKey(id), -1)
  .then(highestBidId => get(bidsIdKey(highestBidId)));

  return (
    Bluebird.all([
      item,
      highestBid,
    ])
    .then(res => {
      const item = res[0];
      const newAuctionValues = { success: false };
      const newItemValues = {};
      let removeItemsIdIndex = false;
      let promise;

      const highestBid = res[1];
      const { reservedPrice } = item;

      if (highestBid) {
        const { price, participantsId } = highestBid;

        if (price > reservedPrice) {
          newAuctionValues.success = true;
        }

        newAuctionValues.winnersId = participantsId;
        newItemValues.sold = true;
      } else {
        removeItemsIdIndex = true;
      }

      promise = Bluebird.all([
        update({
          newValues: newItemValues,
          schema: itemsSchema,
          id: itemsId,
          type: ITEMS,
        }),
        update({
          newValues: newAuctionValues,
          schema,
          id,
          type: AUCTIONS,
        }),
      ]);

      if (removeItemsIdIndex) {
        promise = promise
        .then(res => {
          const itemsId = res[0];
          const auctionsId = res[1];

          return (
            Bluebird.all([
              client.delAsync(auctionsItemsIdKey(itemsId)),
              itemsId,
              auctionsId,
            ])
            .then(res => {
              const itemsId = res[0];
              const auctionsId = res[1];

              return [itemsId, auctionsId];
            })
          );
        });
      }

      return promise;
    })
  );
};
