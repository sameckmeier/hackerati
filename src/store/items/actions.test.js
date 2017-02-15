import Bluebird from 'bluebird';
import chai from 'chai';
import {
  describe,
  it,
  after,
  afterEach,
} from 'mocha';
import { USERS } from '../users/schema';
import { BIDS, bidsIdIndexKey } from '../bids/schema';
import { createItem, getItem } from './actions';
import client from '../../config/redis';
import {
  buildStoreKey,
  persist,
  get,
} from '../../lib/actionsHelpers';
import {
  AUCTIONS,
  auctionsIdIndexKey,
  auctionsBidsIdsKey,
} from '../auctions/schema';
import {
  ITEMS,
  itemsAuctionsIdsKey,
  itemsIdIndexKey,
  itemsNameKey,
  itemsIdKey,
} from './schema';

describe('Items actions', () => {
  describe('createItem', () => {
    const validParams = { name: 'test', reservedPrice: 1.00 };
    const invalidValueParams = { name: 1, reservedPrice: 'test' };
    const duplicateParams = validParams;

    after(() => client.flushdb());

    it('should persist a new item',
      () => chai.expect(
        createItem(validParams)
        .then(id => get(itemsIdKey(id))),
      ).to.eventually.have.properties({ name: 'test' }),
    );

    it('should throw an error params with invalid values',
      () => chai.expect(
        createItem(invalidValueParams)
        .then(id => get(itemsIdKey(id))),
      ).to.eventually.be.rejectedWith(Error, /Invalid value/),
    );

    it('should throw an error for duplicate params',
      () => chai.expect(
        createItem(duplicateParams)
        .then(id => get(itemsIdKey(id))),
      ).to.eventually.be.rejectedWith(Error, 'Item already exists'),
    );
  });

  describe('getItem', () => {
    afterEach(() => client.flushdb());

    const auctioneerParams = { type: 'auctioneer', name: 'test auctioneer' };
    const participantParams = { type: 'participant', name: 'test participant' };
    const itemParams = { name: 'test', reservedPrice: 0.50, sold: false };

    const existingAuctionSetup = (active, success, itemParams) => Bluebird.all([
      persist(buildStoreKey('.', USERS, 'id', 'index'), USERS, auctioneerParams),
      persist(buildStoreKey('.', USERS, 'id', 'index'), USERS, participantParams),
      persist(itemsIdIndexKey(), ITEMS, itemParams),
    ])
    .then(res => {
      const auctioneersId = res[0];
      const participantsId = res[1];
      const itemsId = res[2];

      return (
        Bluebird.all([
          participantsId,
          itemsId,
          client.setAsync(itemsNameKey(itemParams.name), itemsId),
          persist(auctionsIdIndexKey(), AUCTIONS, {
            auctioneersId,
            winnersId: participantsId,
            itemsId,
            success,
            active,
          }),
        ])
      );
    });

    const setAuctionsItemsIdIndex = ids => {
      const participantsId = ids[0];
      const itemsId = ids[1];
      const auctionsId = ids[3];

      return (
        Bluebird.all([
          client.rpushAsync(itemsAuctionsIdsKey(itemsId), auctionsId),
          participantsId,
          itemsId,
          auctionsId,
        ])
      );
    };

    const buildBid = ids => {
      const participantsId = ids[1];
      const auctionsId = ids[3];

      return (
        persist(bidsIdIndexKey(), BIDS, {
          participantsId,
          auctionsId,
          price: 1.00,
        })
        .then(bidsId => client.rpushAsync(auctionsBidsIdsKey(auctionsId), bidsId))
      );
    };

    it('should return if the item has been sold if there is no associated auction',
      () => chai.expect(
        persist(itemsIdIndexKey(), ITEMS, itemParams)
        .then(id => client.setAsync(itemsNameKey(itemParams.name), id))
        .then(() => getItem(itemParams.name)),
      ).to.eventually.have.properties({ sold: false }),
    );

    it('should return auction, item, and winning participant info if sold',
      () => chai.expect(
        existingAuctionSetup(false, true, Object.assign({}, itemParams, { sold: true }))
        .then(res => setAuctionsItemsIdIndex(res))
        .then(res => buildBid(res))
        .then(() => getItem(itemParams.name)),
      ).to.eventually.have.properties({
        sold: true,
        onAuction: false,
        highestBid: 1.00,
        success: true,
        winnersName: 'test participant',
      }),
    );

    it('should return item and auction info if not sold',
      () => chai.expect(
        existingAuctionSetup(true, null, itemParams)
        .then(res => setAuctionsItemsIdIndex(res))
        .then(res => buildBid(res))
        .then(() => getItem(itemParams.name)),
      ).to.eventually.have.properties({
        sold: false,
        onAuction: true,
        highestBid: 1.00,
      }),
    );
  });
});
