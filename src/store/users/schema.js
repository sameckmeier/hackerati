import { isType } from '../../lib/utils';
import { buildStoreKey } from '../../lib/actionsHelpers';

export const USERS = 'users';

export const usersIdKey = id => buildStoreKey(':', USERS, id);

export const schema = {
  fields: ['type', 'name'],
  constraints: {
    type: type => ['participant', 'auctioneer'].includes(type) && isType(type, 'String'),
    name: name => isType(name, 'String'),
  },
};
