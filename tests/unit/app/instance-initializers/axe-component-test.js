/* global sinon, axe */
import Ember from 'ember';
import AxeComponent from 'dummy/instance-initializers/axe-component';
import A11yComponent from 'dummy/instance-initializers/a11y-component';
import AutoRunComponent from 'dummy/instance-initializers/auto-run-component';
import A11yError from 'ember-accessibility-automation/utils/a11y-error';
import { module, test, skip } from 'qunit';

let application;
let sandbox;

module('Unit | Instance Initializer | axe-component', {
  beforeEach() {
    Ember.run(() => {
      application = Ember.Application.create({
        rootElement: '#ember-testing'
      });
      application.deferReadiness();
    });

    sandbox = sinon.sandbox.create();

    AutoRunComponent.initialize(application);
    A11yComponent.initialize(application);
    AxeComponent.initialize(application);
  },

  afterEach() {
    sandbox.restore();
  }
});

/* Basic Behavior */

test('initializer should not re-open Ember.Component more than once', function(assert) {
  // Depending on if the initializer has already ran, we will either expect the
  // reopen method to be called once or not at all.
  let assertMethod = Ember.Component.prototype.audit ? 'notCalled' : 'calledOnce';
  let reopenSpy = sandbox.spy(Ember.Component, 'reopen');

  AxeComponent.initialize(application);
  AxeComponent.initialize(application);

  assert.ok(reopenSpy[assertMethod]);
});

test('audit is registered as an automatedCallback on init', function(assert) {
  let component = Ember.Component.create({});

  assert.notEqual(component.get('automatedCallbacks').indexOf(component.audit), -1);

  Ember.run(() => component.destroy());
});

/* Ember.Component.audit */

test('audit should "throw" any violations found and mark those DOM nodes', function(assert) {
  assert.expect(2);

  let throwStub = sandbox.stub(A11yError, 'throw');
  let a11yCheckStub = sandbox.stub(axe, 'a11yCheck', function(el, options, callback) {
    callback({
      violations: [{
        name: 'test',
        nodes: [{ target: [ '#test' ] }]
      }]
    });
  });

  let component = Ember.Component.create({});
  let highlightStub = sandbox.stub(component, 'highlightIssue');
  component.audit();

  assert.ok(throwStub.calledOnce, 'only one violation is thrown');
  assert.ok(highlightStub.calledOnce, 'issue is highlighted');
});

test('audit should do nothing if no violations found', function(assert) {
  let throwStub = sandbox.stub(A11yError, 'throw');
  let a11yCheckStub = sandbox.stub(axe, 'a11yCheck', function(el, options, callback) {
    callback({
      violations: []
    });
  });

  let component = Ember.Component.create({});
  component.audit();

  assert.ok(throwStub.notCalled, 'nothing is thrown');
});

/* Ember.Component.axeCallback */

test('axeCallback receives the results of the audit', function(assert) {
  let results = { violations: [] };
  let a11yCheckStub = sandbox.stub(axe, 'a11yCheck', (el, opts, callback) => {
    callback(results);
  });

  let axeCallbackSpy = sandbox.spy();
  let component = Ember.Component.create({
    axeCallback: axeCallbackSpy
  });

  component.audit();

  assert.ok(axeCallbackSpy.calledOnce, 'axeCallback is only called once');
  assert.ok(axeCallbackSpy.calledWith(results), 'axeCallback is called with the results');
});

test('axeCallback throws an error if it is not a function', function(assert) {
  let results = { violations: [] };
  let a11yCheckStub = sandbox.stub(axe, 'a11yCheck', (el, opts, callback) => {
    callback(results);
  });

  let component = Ember.Component.create({
    axeCallback: 'not a function'
  });

  assert.throws(() => component.audit(), /axeCallback should be a function./);
});

/* Ember.Component.axeOptions */

test('axeOptions are passed in as the second param to a11yCheck', function(assert) {
  assert.expect(2);

  let a11yCheckStub = sandbox.stub(axe, 'a11yCheck');

  let axeOptions = { test: 'test' };
  let component = Ember.Component.create({ axeOptions });
  component.audit();

  assert.ok(a11yCheckStub.calledOnce, 'a11yCheck is only called once');
  assert.ok(a11yCheckStub.calledWith(component.$(), axeOptions), 'a11yCheck is called with proper options');
});
