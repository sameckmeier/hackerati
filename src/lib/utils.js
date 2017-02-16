export const isType = (val, type) => toString.call(val) === `[object ${type}]`;

export const defaults = (object, defaultValues) => {
  const defaultKeys = Object.keys(defaultValues);

  defaultKeys.forEach(k => {
    object[k] = object[k] || defaultValues[k];
  });

  return object;
};

export const objMatch = toMatch => obj => {
  let matches = true;
  const keys = Object.keys(toMatch);

  keys.forEach(k => {
    if (obj[k] !== toMatch[k]) {
      matches = false;
    }
  });

  return matches;
};

export const isDefined = val => {
  let boolean;

  boolean = val !== undefined && val !== null;

  if (isType(val, 'String')) {
    boolean = val.trim().length > 0;
  }

  return boolean;
};

export const consecutiveRuns = integers => {
  let indexes = null;
  let currentInteger;
  let a;
  let b;

  const integersLeng = integers.length;
  // finishes iterating when index reaches second to last element
  for (let i = 0; i < integersLeng - 2; i += 1) {
    currentInteger = integers[i];
    a = integers[i + 1];
    b = integers[i + 2];

    if (
      (a === currentInteger + 1 && b === currentInteger + 2) ||
      (a === currentInteger - 1 && b === currentInteger - 2)
    ) {
      indexes = indexes || [];
      indexes.push(i);
    }
  }

  return indexes;
};

export const convertType = value => {
  let converted = value;

  if (value === '') {
    converted = null;
  } else if (isType(value, 'Number')) {
    converted = String(value);
  } else if (isType(value, 'String') && value !== '' && !isNaN(Number(value))) {
    converted = Number(value);
  } else if (isType(value, 'Boolean')) {
    converted = String(value);
  } else if (value === 'true') {
    converted = true;
  } else if (value === 'false') {
    converted = false;
  } else if (isType(value, 'Null')) {
    converted = '';
  }

  return converted;
};
