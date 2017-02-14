import chai from 'chai';
import chaiProperties from 'chai-properties';
import chaiAsPromised from 'chai-as-promised';
import '../src/config/environment';

[chaiProperties, chaiAsPromised].forEach(plugin => {
  chai.use(plugin);
});
