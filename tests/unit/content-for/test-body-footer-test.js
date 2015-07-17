/* global a11y, axe */
import Ember from 'ember';
import { module, test } from 'qunit';
import sinon from 'sinon';

let sandbox;

module('Unit | Content For | test-body-footer', {
  beforeEach: function() {
    sandbox = sinon.sandbox.create();
  },

  afterEach: function() {
    sandbox.restore();
  }
});

/* Registration */

test('axe.ember.a11yCheck has been registered as an accessibility audit', function(assert) {
  assert.notEqual(a11y._audits.indexOf(axe.ember.a11yCheck), -1, 'callback is registered');
});

/* axe.ember.a11yCheck */

test('a11yCheck calls axe.a11yCheck scoped to the testing container and with the logger', function(assert) {
  assert.expect(2);

  let a11yCheckStub = sandbox.stub(axe, 'a11yCheck');

  axe.ember.a11yCheck();

  assert.ok(a11yCheckStub.calledOnce, 'axe.a11yCheck is only called once');
  assert.ok(a11yCheckStub.calledWith('#ember-testing-container', undefined, axe.ember.a11yCheckLogger), 'axe.a11yCheck is called with the expected arguments');
});

/* axe.ember.a11yCheckLogger */

test('a11yCheckLogger should log no issues if none are present', function(assert) {
  let loggerSpy = sandbox.spy(Ember.Logger, 'error');
  let results = { violations: [] };

  axe.ember.a11yCheckLogger(results);

  assert.ok(loggerSpy.notCalled, 'logger is not called');
});

test('a11yCheckLogger should log a single issue if found and throw an error', function(assert) {
  assert.expect(2);

  let loggerSpy = sandbox.spy(Ember.Logger, 'error');
  let results = { violations: ['first violation'] };

  assert.throws(() => axe.ember.a11yCheckLogger(results), /The page should have no accessibility violations/);
  assert.ok(loggerSpy.calledOnce, 'logger is only called once');
});

test('a11yCheckLogger should log multiple issues if found and throw an error', function(assert) {
  assert.expect(2);

  let loggerSpy = sandbox.spy(Ember.Logger, 'error');
  let results = { violations: ['first violation', 'second violation'] };

  assert.throws(() => axe.ember.a11yCheckLogger(results), /The page should have no accessibility violations/);
  assert.ok(loggerSpy.calledTwice, 'logger is only called twice');
});

/* axe.ember.a11yCheckCallback */

test('a11yCheckCallback should receive the results from the a11yCheckLogger', function(assert) {
  assert.expect(2);

  let fakeResults = { violations: [] };
  let callbackSpy = sandbox.spy();
  axe.ember.a11yCheckCallback = callbackSpy;

  axe.ember.a11yCheckLogger(fakeResults);

  assert.ok(callbackSpy.calledOnce, 'a11yCheckCallback is called only once');
  assert.ok(callbackSpy.calledWith(fakeResults), 'a11yCheckCallback is called with the results');

  axe.ember.a11yCheckCallback = undefined;
});

test('a11yCheckCallback should throw an error if defined but not a function', function(assert) {
  axe.ember.a11yCheckCallback = 'not a function';
  assert.throws(() => axe.ember.a11yCheckLogger({ violations: [] }), /a11yCheckCallback should be a function/);
  axe.ember.a11yCheckCallback = undefined;
});

/* axe.ember.testOptions */

test('testOptions should be passed into axe.a11yCheck when it is called', function(assert) {
  assert.expect(2);

  let a11yCheckStub = sandbox.stub(axe, 'a11yCheck');
  let options = { option: 'some-option-value' };

  axe.ember.testOptions = options;
  axe.ember.a11yCheck();

  assert.ok(a11yCheckStub.calledOnce, 'a11yCheck is only called once');
  assert.ok(a11yCheckStub.calledWith('#ember-testing-container', options), 'a11yCheck is called with the expected options');

  axe.ember.testOptions = undefined;
});
