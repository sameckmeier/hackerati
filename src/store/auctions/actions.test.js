import Bluebird from 'bluebird';
import chai from 'chai';
import {
  describe,
  it,
  after,
  afterEach,
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
  itemsAuctionsIdsKey,
  itemsIdIndexKey,
  itemsIdKey,
} from '../items/schema';
import {
  AUCTIONS,
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

    describe('if the item is for sale and not on auction', () => {
      afterEach(() => client.flushdb());

      it('should persist',
        () => chai.expect(
          createAuction(validParams)
          .then(id => get(auctionsIdKey(id))),
        ).to.eventually.have.properties({ itemsId: validParams.itemsId }),
      );

      it('should push auction id into list of items auction ids',
        () => chai.expect(
          createAuction(validParams)
          .then(() => client.lindexAsync(itemsAuctionsIdsKey(validParams.itemsId), -1)),
        ).to.eventually.equal('1'),
      );
    });

    describe('if the item is not for sale', () => {
      after(() => client.flushdb());

      it('should throw an error',
        () => chai.expect(
          createAuction(itemSoldParams),
        ).to.eventually.be.rejectedWith(Error, 'Item has been sold'),
      );
    });

    describe('if the item is on auction', () => {
      after(() => client.flushdb());

      it('should throw an error',
        () => chai.expect(
          createAuction(itemOnAuctionParams)
          .then(() => createAuction(itemOnAuctionParams)),
        ).to.eventually.be.rejectedWith(Error, 'Item is on auction'),
      );
    });
  });

  describe('closeAuction', () => {
    const auctionParams = {
      auctioneersId: 1,
      success: null,
      winnersId: null,
      active: true,
    };
    const itemParams = {
      name: 'test',
      reservedPrice: 1.00,
      sold: false,
    };
    const successfulBidParams = {
      participantsId: 1,
      price: 2.00,
    };
    const unsuccessfulBidParams = {
      participantsId: 1,
      price: 0.50,
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
          client.rpushAsync(itemsAuctionsIdsKey(itemsId), auctionsId),
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

    const buildBid = (bidParams, ids) => {
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
          const {
            winnersId,
            success,
            active,
           } = res[1];

          return {
            winnersId,
            sold,
            success,
            active,
          };
        })
      );
    };

    describe('when the highest bid is higher than the reserved price of the item', () => {
      after(() => client.flushdb());

      it('should be a success',
        () => chai.expect(
          buildAuction()
          .then(res => buildBid(successfulBidParams, res))
          .then(res => runCloseAuction(res))
          .then(res => updatedValues(res)),
        ).to.eventually.have.properties({
          winnersId: successfulBidParams.participantsId,
          sold: true,
          success: true,
          active: false,
        }),
      );
    });

    describe('when the highest bid is less than the reserved price of the item', () => {
      after(() => client.flushdb());

      it('should not be a success',
        () => chai.expect(
          buildAuction()
          .then(res => buildBid(unsuccessfulBidParams, res))
          .then(res => runCloseAuction(res))
          .then(res => updatedValues(res)),
        ).to.eventually.have.properties({
          winnersId: unsuccessfulBidParams.participantsId,
          sold: true,
          success: false,
          active: false,
        }),
      );
    });

    describe('when there are no bids', () => {
      afterEach(() => client.flushdb());

      it('should set auctions active and success fields to false',
        () => chai.expect(
          buildAuction()
          .then(res => runCloseAuction(res))
          .then(res => {
            const auctionsId = res[1];
            return get(auctionsIdKey(auctionsId));
          }),
        ).to.eventually.have.properties({ active: false, success: false }),
      );

      it('should push the auctions id to the list of items auctions id',
        () => chai.expect(
          buildAuction()
          .then(res => runCloseAuction(res))
          .then(res => {
            const itemsId = res[0];
            return client.lindexAsync(itemsAuctionsIdsKey(itemsId), -1);
          }),
        ).to.eventually.equal('1'),
      );

      it('should items sold field to false',
        () => chai.expect(
          buildAuction()
          .then(res => runCloseAuction(res))
          .then(res => {
            const itemsId = res[0];
            return get(itemsIdKey(itemsId));
          }),
        ).to.eventually.have.properties({ sold: false }),
      );
    });
  });
});
