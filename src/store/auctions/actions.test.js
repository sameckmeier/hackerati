import Bluebird from 'bluebird';
import chai from 'chai';
import {
  describe,
  it,
  after,
} from 'mocha';
import { BIDS, bidsIdIndexKey } from '../bids/schema';
import { createAuction, closeAuction } from './actions';
import client from '../../config/redis';
import {
  get,
  persist,
} from '../../lib/actionsHelpers';
import {
  ITEMS,
  itemsIdIndexKey,
  itemsIdKey,
} from '../items/schema';
import {
  AUCTIONS,
  auctionsItemsIdKey,
  auctionsIdKey,
  auctionsBidsIdsKey,
  auctionsIdIndexKey,
} from './schema';

describe('Auctions actions', () => {
  describe('createAuction', () => {
    const validParams = {
      auctioneersId: 1,
      itemsId: 1,
      sold: false,
    };
    const itemSoldParams = {
      auctioneersId: 2,
      itemsId: 2,
      sold: true,
    };
    const itemOnAuctionParams = {
      auctioneersId: 3,
      itemsId: 3,
      sold: false,
    };

    after(() => client.flushdb());

    describe('if the item is for sale and not on auction', () => {
      let auctionsId;

      it('should persist if the item is still for sale and is not on auction',
        () => chai.expect(
          createAuction(validParams)
          .then(id => {
            auctionsId = id;
            return get(auctionsIdKey(id));
          }),
        ).to.eventually.have.properties({ itemsId: validParams.itemsId }),
      );

      it('should set auctions.items_id index',
        () => chai.expect(
          client.getAsync(auctionsItemsIdKey(validParams.itemsId)),
        ).to.eventually.equal(auctionsId),
      );
    });

    it('should throw an error if the item has been sold',
      () => chai.expect(
        createAuction(itemSoldParams),
      ).to.eventually.be.rejectedWith(Error, 'Item has already been sold'),
    );

    it('should throw an error if the item is already on auction',
      () => chai.expect(
        client.setAsync(auctionsItemsIdKey(itemOnAuctionParams.itemsId), 1)
        .then(() => createAuction(itemOnAuctionParams)),
      ).to.eventually.be.rejectedWith(Error, 'Item is already on auction'),
    );
  });

  describe('closeAuction', () => {
    const itemParams = {
      name: 'test',
      reservedPrice: 1.00,
      sold: false,
    };
    const auctionParams = {
      auctioneersId: 1,
      sold: itemParams.sold,
    };
    const bidParams = {
      participantsId: 1,
      price: 2.00,
    };

    const buildAuction = () => persist(itemsIdIndexKey(), ITEMS, itemParams)
    .then(itemsId => Bluebird.all([
      persist(
        auctionsIdIndexKey(),
        AUCTIONS,
        Object.assign({}, auctionParams, { itemsId }),
      ),
      itemsId,
    ]))
    .then(res => {
      const auctionsId = res[0];
      const itemsId = res[1];

      return (
        Bluebird.all([
          client.setAsync(auctionsItemsIdKey(itemsId), auctionsId),
          auctionsId,
          itemsId,
        ])
      );
    });

    const runCloseAuction = ids => {
      const auctionsId = ids[1];
      const itemsId = ids[2];

      return closeAuction(auctionsId, itemsId);
    };

    describe('when the highest bid is higher than the reserved price of the item', () => {
      after(() => client.flushdb());

      const buildBid = ids => {
        const auctionsId = ids[1];
        const itemsId = ids[2];

        return (
          Bluebird.all([
            auctionsId,
            itemsId,
            persist(
              bidsIdIndexKey(),
              BIDS,
              Object.assign({}, bidParams, { auctionsId }),
            ),
          ])
          .then(ids => {
            const auctionsId = ids[0];
            const itemsId = ids[1];
            const bidsId = ids[2];

            return (
              Bluebird.all([
                client.rpushAsync(auctionsBidsIdsKey(auctionsId), bidsId),
                auctionsId,
                itemsId,
              ])
            );
          })
        );
      };

      const updatedValues = ids => {
        const auctionsId = ids[0];
        const itemsId = ids[1];

        return (
          Bluebird.all([
            get(itemsIdKey(itemsId)),
            get(auctionsIdKey(auctionsId)),
          ])
          .then(res => {
            const { sold } = res[0];
            const { winnersId, success } = res[1];

            return {
              winnersId,
              sold,
              success,
            };
          })
        );
      };

      it('should be a success',
        () => chai.expect(
          buildAuction()
          .then(res => buildBid(res))
          .then(res => runCloseAuction(res))
          .then(res => updatedValues(res)),
        ).to.eventually.have.properties({
          winnersId: bidParams.participantsId,
          sold: true,
          success: true,
        }),
      );
    });

    describe('when there are no bids', () => {
      after(() => client.flushdb());

      const updatedAuctionsItemsIdIndex = ids => {
        const itemsId = ids[0];

        return client.getAsync(auctionsItemsIdKey(itemsId));
      };

      it('should reset the items auctions id',
        () => chai.expect(
          buildAuction()
          .then(res => runCloseAuction(res))
          .then(res => updatedAuctionsItemsIdIndex(res)),
        ).to.eventually.equal(null),
      );
    });
  });
});
