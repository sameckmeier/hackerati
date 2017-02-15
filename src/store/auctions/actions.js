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
  itemsAuctionsIdsKey,
} from '../items/schema';
import {
  AUCTIONS,
  schema,
  auctionsIdKey,
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
    promise = Bluebird.reject(new Error('Item has been sold'));
  } else {
    promise = client.lindexAsync(itemsAuctionsIdsKey(itemsId), -1)
    .then(auctionsId => get(auctionsIdKey(auctionsId)))
    .then(auction => {
      if (auction && auction.active) {
        throw new Error('Item is on auction');
      } else {
        return (
          // creates auction
          create({
            params: { auctioneersId, itemsId },
            schema,
            idIndexKey: auctionsIdIndexKey(),
            type: AUCTIONS,
          })
        );
      }
    })
    // adds auction id to item's list of auctions
    .then(auctionsId => Bluebird.all(
      [
        client.rpushAsync(itemsAuctionsIdsKey(itemsId), auctionsId),
        auctionsId,
      ],
    ))
    .then(res => {
      const auctionsId = res[1];

      return auctionsId;
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
      const highestBid = res[1];
      const { reservedPrice } = item;
      const newAuctionValues = { active: false, success: false };
      const newItemValues = {};

      if (highestBid) {
        const { price, participantsId } = highestBid;

        newAuctionValues.success = price > reservedPrice;
        newAuctionValues.winnersId = participantsId;
        newItemValues.sold = true;
      } else {
        // if the item wasn't bid on, we will make sure that the item's sold field is set to false
        // and set active and success on auction to false
        // so that an auctioneer can start an auction on this item in the future
        newItemValues.sold = false;
      }

      // updates item and auction values
      return (
        Bluebird.all([
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
        ])
      );
    })
    .then(res => {
      const itemsId = res[0];
      const auctionsId = res[1];

      return [itemsId, auctionsId];
    })
  );
};
