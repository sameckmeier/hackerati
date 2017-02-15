import Bluebird from 'bluebird';
import client from '../../config/redis';
import { usersIdKey } from '../users/schema';
import { bidsIdKey } from '../bids/schema';
import { auctionsIdKey, auctionsBidsIdsKey } from '../auctions/schema';
import { create, get } from '../../lib/actionsHelpers';
import {
  ITEMS,
  schema,
  itemsAuctionsIdsKey,
  itemsNameKey,
  itemsIdKey,
  itemsIdIndexKey,
} from './schema';

export const createItem = params => {
  const { name } = params;

  return (
    client.getAsync(itemsNameKey(name))
    .then(item => {
      if (item) {
        throw new Error('Item already exists');
      } else {
        return (
          create({
            params,
            schema,
            idIndexKey: itemsIdIndexKey(),
            type: ITEMS,
          })
          .then(id => Bluebird.all([
            client.setAsync(itemsNameKey(name), id),
            id,
          ])
          .then(res => {
            const id = res[1];
            return id;
          }))
        );
      }
    })
  );
};

export const getItem = name => client.getAsync(itemsNameKey(name))
.then(itemsId => {
  let item = null;
  let auctionsId = null;

  if (itemsId) {
    item = get(itemsIdKey(itemsId));
    auctionsId = client.lindexAsync(itemsAuctionsIdsKey(itemsId), -1);
  } else {
    throw new Error('Item does not exist');
  }

  return (
    Bluebird.all([
      item,
      auctionsId,
    ])
  );
})
.then(res => {
  const item = res[0];
  const auctionsId = res[1];

  let auction = null;
  let highestBidId = null;

  if (auctionsId) {
    auction = get(auctionsIdKey(auctionsId));
    highestBidId = client.lindexAsync(auctionsBidsIdsKey(auctionsId), -1);
  }

  return (
    Bluebird.all([
      auction,
      highestBidId,
      item,
    ])
  );
})
.then(res => {
  const auction = res[0];
  const highestBidId = res[1];
  const item = res[2];

  let winner = null;
  let highestBid = null;

  if (auction) {
    winner = get(usersIdKey(auction.winnersId));
  }

  if (highestBidId) {
    highestBid = get(bidsIdKey(highestBidId));
  }

  return (
    Bluebird.all([
      winner,
      highestBid,
      item,
      auction,
    ])
  );
})
.then(res => {
  const winner = res[0];
  const highestBid = res[1];
  const item = res[2];
  const auction = res[3];
  const { sold } = item;
  const info = { sold };

  if (auction) {
    const { success } = auction;

    info.activeAuction = success === null;

    if (highestBid) {
      const { price } = highestBid;

      info.highestBid = price;
    }

    if (sold) {
      const { name: winnersName } = winner;

      info.success = success;
      info.winnersName = winnersName;
    }
  }

  return info;
});
