import chai from 'chai';
import sinon from 'sinon';
import {
  describe,
  it,
  after,
  afterEach,
} from 'mocha';
import client from '../config/redis';
import {
  buildStoreKey,
  validValue,
  save,
  persist,
  update,
  create,
  get,
} from './actionsHelpers';
import {
  ITEMS,
  schema,
  itemsIdIndexKey,
  itemsIdKey,
} from '../store/items/schema';

describe('buildStoreKey', () => {
  const testArgs = [
    {
      separator: ':',
      keys: ['a', 'b', 'c'],
      expectedRes: 'a:b:c',
    },
    {
      separator: '.',
      keys: ['a', 'b', 'c'],
      expectedRes: 'a.b.c',
    },
  ];

  describe('receives integers without consecutive runs', () => {
    testArgs.forEach(testArg => {
      const {
        separator,
        keys,
        expectedRes,
      } = testArg;

      it(`${JSON.stringify(keys)} should return ${expectedRes}`,
        () => chai.expect(buildStoreKey(separator, ...keys)).to.equal(expectedRes),
      );
    });
  });
});

describe('validValue', () => {
  const passingConstraint = sinon.stub().returns(true);
  const failingConstraint = sinon.stub().returns(false);
  const undefinedConstraint = undefined;
  const args = {
    field: 'test',
    value: 'test',
    type: 'tests',
  };

  describe('when value fails constraint', () => {
    it('should throw Error',
      () => chai.expect(
        validValue.bind(null, Object.assign({}, args, { constraint: failingConstraint })),
      ).to.throw(Error, /Invalid value/),
    );
  });

  describe('when value passes constraint', () => {
    it('should return true',
      () => chai.expect(
        validValue(Object.assign({}, args, { constraint: passingConstraint })),
      ).to.equal(true),
    );
  });

  describe('when constraint is undefined', () => {
    it('should throw Error',
      () => chai.expect(
        validValue.bind(null, Object.assign({}, args, { constraint: undefinedConstraint })),
      ).to.throw(Error, /Invalid constraint/),
    );
  });
});

describe('save', () => {
  afterEach(() => client.flushdb());

  const errArgs = [
    {
      descriptionMsg: 'when id is not defined',
      args: [undefined, ITEMS, { name: 'test' }],
      errMsg: 'undefined id',
    },
    {
      descriptionMsg: 'when rawRecord is empty',
      args: [1, ITEMS, {}],
      errMsg: 'empty record',
    },
    {
      descriptionMsg: 'when type is invalid',
      args: [1, 'test', { name: 'test' }],
      errMsg: /invalid type/,
    },
  ];

  const validArgs = [1, ITEMS, { name: 'test' }];

  errArgs.forEach(errArg => {
    const {
      descriptionMsg,
      args,
      errMsg,
    } = errArg;

    describe(descriptionMsg, () => {
      it('should throw Error',
        () => chai.expect(
          save.bind(null, ...args),
        ).to.throw(Error, errMsg),
      );
    });
  });

  describe('when args are valid', () => {
    it('should save record',
      () => chai.expect(
        save(...validArgs)
        .then(id => client.hgetallAsync(itemsIdKey(id))),
      ).to.eventually.have.properties({ name: 'test' }),
    );
  });
});

describe('persist', () => {
  after(() => client.flushdb());

  const itemsIdIndex = itemsIdIndexKey();
  const validArgs = [itemsIdIndex, ITEMS, { name: 'test' }];

  it('should persist record',
    () => chai.expect(
      persist(...validArgs)
      .then(id => client.hgetallAsync(itemsIdKey(id))),
    ).to.eventually.have.properties({ name: 'test' }),
  );

  it('should increment type index',
    () => chai.expect(
      client.getAsync(itemsIdIndex),
    ).to.eventually.have.equal('1'),
  );
});

describe('update', () => {
  after(() => client.flushdb());

  const itemsIdIndex = itemsIdIndexKey();
  const testItemArgs = [
    itemsIdIndex,
    ITEMS,
    {
      name: 'test',
      reservedPrice: 1.00,
      sold: false,
    },
  ];
  const updateArgs = {
    type: ITEMS,
    newValues: { name: 'new test' },
    schema,
  };

  const buildItem = () => persist(...testItemArgs);

  it('should update an existing record',
    () => chai.expect(
      buildItem()
      .then(id => update(Object.assign({}, updateArgs, { id })))
      .then(id => client.hgetallAsync(itemsIdKey(id))),
    ).to.eventually.have.properties({ name: updateArgs.newValues.name }),
  );
});

describe('create', () => {
  after(() => client.flushdb());

  const itemsIdIndex = itemsIdIndexKey();
  const testItemArgs = {
    schema,
    idIndexKey: itemsIdIndex,
    type: ITEMS,
    params: {
      name: 'test',
      reservedPrice: 1.00,
      sold: false,
    },
  };

  it('should create record from params',
    () => chai.expect(
      create(testItemArgs)
      .then(id => client.hgetallAsync(itemsIdKey(id))),
    ).to.eventually.have.properties({ name: testItemArgs.params.name }),
  );
});

describe('get', () => {
  after(() => client.flushdb());

  const nonExistantRecordKey = itemsIdKey(99);
  const itemsIdIndex = itemsIdIndexKey();
  const testItemParams = {
    name: 'test',
    reservedPrice: 1.00,
    sold: false,
  };
  const testItemArgs = [
    itemsIdIndex,
    ITEMS,
    testItemParams,
  ];

  describe('if record exists', () => {
    it('should get record',
      () => chai.expect(
        persist(...testItemArgs)
        .then(id => get(itemsIdKey(id))),
      ).to.eventually.have.properties({ name: testItemParams.name }),
    );
  });

  describe('if record does not exists', () => {
    it('should return null',
      () => chai.expect(
        get(nonExistantRecordKey),
      ).to.eventually.have.equal(null),
    );
  });
});
