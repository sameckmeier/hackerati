import chai from 'chai';
import {
  describe,
  it,
  after,
} from 'mocha';
import { bidsIdKey } from '../bids/schema';
import createBid from './actions';
import { get } from '../../lib/actionsHelpers';
import client from '../../config/redis';

describe('Bids actions', () => {
  describe('createBid', () => {
    const validParamsA = { auctionsId: 1, participantsId: 1, price: 1.00 };
    const validParamsB = { auctionsId: 1, participantsId: 2, price: 1.50 };
    const invalidParams = { auctionsId: 1, participantsId: 3, price: 1.00 };

    after(() => client.flushdb());

    it('should persist a new item if it is the first bid',
      () => chai.expect(
        createBid(validParamsA)
        .then(id => get(bidsIdKey(id))),
      ).to.eventually.have.properties({ price: validParamsA.price }),
    );

    it('should persist a new item if it is higher than the previous bid',
      () => chai.expect(
        createBid(validParamsB)
        .then(id => get(bidsIdKey(id))),
      ).to.eventually.have.properties({ price: validParamsB.price }),
    );

    it('should throw an error if the bid is not higher than the previous bid',
      () => chai.expect(
        createBid(invalidParams),
      ).to.eventually.be.rejectedWith(Error, 'Invalid bid'),
    );
  });
});
