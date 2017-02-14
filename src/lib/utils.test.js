import chai from 'chai';
import {
  describe,
  it,
} from 'mocha';
import {
  objMatch,
  consecutiveRuns,
  isDefined,
  isType,
  convertType,
  defaults,
} from './utils';

describe('consecutiveRuns', () => {
  const noConsecutiveRuns = [
    [2, 4],
    [2, 4, 8, 5],
    [2, 3, 5, 4, 1],
  ];

  const hasConsecutiveRuns = [
    {
      integers: [7, 1, 2, 3, 5, 9],
      expectedRes: [1],
    },
    {
      integers: [4, 7, 6, 3, 9, 8, 7],
      expectedRes: [4],
    },
    {
      integers: [4, 5, 8, 1, 2, 3, 2, 1],
      expectedRes: [3, 5],
    },
    {
      integers: [1, 2, 3, 5, 10, 9, 8, 9, 10, 11, 7],
      expectedRes: [0, 4, 6, 7],
    },
  ];

  describe('receives integers without consecutive runs', () => {
    noConsecutiveRuns.forEach(testData => {
      it(`${JSON.stringify(testData)} should return null`,
        () => chai.expect(consecutiveRuns(testData)).to.eql(null),
      );
    });
  });

  describe('receives integers with consecutive runs', () => {
    hasConsecutiveRuns.forEach(testData => {
      it(`${JSON.stringify(testData.integers)} should return ${JSON.stringify(testData.expectedRes)}`,
        () => chai.expect(consecutiveRuns(testData.integers)).to.eql(testData.expectedRes),
      );
    });
  });
});

describe('objMatch', () => {
  const toMatch = {
    a: 1,
    b: 'two',
  };
  const match = objMatch(toMatch);

  const doesNotMatch = [
    {
      a: 1,
    },
    {
      a: 2,
      b: 'three',
    },
    {
      c: 1,
      d: 'two',
    },
    {
      a: 1,
      c: 'two',
    },
  ];

  const matches = [
    {
      a: 1,
      b: 'two',
    },
  ];
  describe('receives object that does not match', () => {
    doesNotMatch.forEach(testData => {
      it(`${JSON.stringify(testData)} should return false`,
        () => chai.expect(match(testData)).to.equal(false),
      );
    });
  });

  describe('receives object that matches', () => {
    matches.forEach(testData => {
      it(`${JSON.stringify(testData)} should return true`,
        () => chai.expect(match(testData)).to.equal(true),
      );
    });
  });
});

describe('isDefined', () => {
  const defined = [
    'test',
    1,
    {},
  ];

  const notDefined = [
    null,
    undefined,
    '',
    '     ',
  ];

  describe('receives undefined value', () => {
    notDefined.forEach(testData => {
      it(`${JSON.stringify(testData)} should return false`,
        () => chai.expect(isDefined(testData)).to.equal(false),
      );
    });
  });

  describe('receives defined value', () => {
    defined.forEach(testData => {
      it(`${JSON.stringify(testData)} should return true`,
        () => chai.expect(isDefined(testData)).to.equal(true),
      );
    });
  });
});

describe('isType', () => {
  const matchingTypes = [
    {
      type: 'Object',
      value: {},
    },
    {
      type: 'Boolean',
      value: true,
    },
    {
      type: 'String',
      value: 'test',
    },
    {
      type: 'Number',
      value: 1,
    },
  ];

  const notMatchingTypes = [
    {
      type: 'String',
      value: {},
    },
    {
      type: 'Number',
      value: {},
    },
    {
      type: 'Boolean',
      value: 1,
    },
    {
      type: 'String',
      value: true,
    },
  ];

  describe('receives type that does not match value', () => {
    notMatchingTypes.forEach(testData => {
      const { value, type } = testData;
      it(`${JSON.stringify(testData)} should return false`,
        () => chai.expect(isType(value, type)).to.equal(false),
      );
    });
  });

  describe('receives type that matches value', () => {
    matchingTypes.forEach(testData => {
      const { value, type } = testData;
      it(`${JSON.stringify(testData)} should return true`,
        () => chai.expect(isType(value, type)).to.equal(true),
      );
    });
  });
});

describe('defaults', () => {
  const defaultValues = { a: 1, c: 3 };

  it('should set default values on object',
    () => chai.expect(defaults({ b: 2, c: 4 }, defaultValues)).to.eql({
      a: 1,
      b: 2,
      c: 4,
    }),
  );
});

describe('convertType', () => {
  const testValues = [
    {
      value: '',
      convertedValue: null,
    },
    {
      value: 1,
      convertedValue: '1',
    },
    {
      value: '1',
      convertedValue: 1,
    },
    {
      value: true,
      convertedValue: 'true',
    },
    {
      value: 'true',
      convertedValue: true,
    },
    {
      value: 'false',
      convertedValue: false,
    },
    {
      value: null,
      convertedValue: '',
    },
  ];

  testValues.forEach(testValue => {
    const { value, convertedValue } = testValue;

    it(`should convert ${value} to ${convertedValue}`,
      () => chai.expect(convertType(value)).to.equal(convertedValue),
    );
  });
});
