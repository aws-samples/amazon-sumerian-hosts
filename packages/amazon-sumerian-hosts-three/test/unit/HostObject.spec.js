// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { HostObject } from '@amazon-sumerian-hosts/three';
import describeEnvironment from './EnvironmentHarness';

describeEnvironment('HostObject', (options = {}) => {
  let host;

  beforeEach(() => {
    host = new HostObject(options);
  });

  describe('listenTo', () => {
    it('can execute a listener when a message is received', () => {
      const listener = jasmine.createSpy('listener');
      host.listenTo('test', listener);
      host.emit('test');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('can execute a listener multiple times if listenTo is called with the same message and listener multiple times', () => {
      const listener = jasmine.createSpy('listener');
      host.listenTo('test', listener);
      host.emit('test');
      host.emit('test');
      host.emit('test');

      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('throws an error if the listener callback is not a function', () => {
      expect(host.listenTo.bind(host, 'test', 'test')).toThrowError();
    });

    it('does not throw an error if the message is not a string', () => {
      const listener = () => {};

      expect(
        host.listenTo.bind(host, 5, listener)
      ).not.toThrowError();

      expect(
        host.listenTo.bind(host, HostObject, listener)
      ).not.toThrowError();
    });
  });

  describe('stopListening', () => {
    it('can stop a specific listener from being executed when a message is received', () => {
      const listener1 = jasmine.createSpy('listener1');
      const listener2 = jasmine.createSpy('listener2');
      host.listenTo('test', listener1);
      host.listenTo('test', listener2);
      host.stopListening('test', listener1);
      host.emit('test');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('can stop all listeners from being executed when a message is received', () => {
      const listener1 = jasmine.createSpy('listener1');
      const listener2 = jasmine.createSpy('listener2');
      const listener3 = jasmine.createSpy('listener3');
      host.listenTo('test', listener1);
      host.listenTo('test', listener2);
      host.listenTo('test', listener3);
      host.stopListening('test');
      host.emit('test');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });

    it('fails gracefully if the message is not a string', () => {
      expect(
        host.stopListening.bind(host, host)
      ).not.toThrowError();
    });

    it('fails gracefully if the callback is not a function', () => {
      expect(
        host.stopListening.bind(host, 'test', null)
      ).not.toThrowError();
    });
  });

  describe('stopListeningToAll', () => {
    it('can stop all listeners from being executed when any message is received', () => {
      const listener1 = jasmine.createSpy('listener1');
      const listener2 = jasmine.createSpy('listener2');
      const listener3 = jasmine.createSpy('listener3');
      const listener4 = jasmine.createSpy('listener4');
      host.listenTo('test1', listener1);
      host.listenTo('test2', listener2);
      host.listenTo('test1', listener3);
      host.listenTo('test2', listener4);
      host.stopListeningToAll();
      host.emit('test1');
      host.emit('test2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
      expect(listener4).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('can send a value to listeners of a message', () => {
      const listener = jasmine.createSpy('listener');
      const value = 'value';
      host.listenTo('test', listener);
      host.emit('test', value);

      expect(listener).toHaveBeenCalledWith(value);
    });

    it('does not trigger listener of another host with same owner id', () => {
      const host2 = new HostObject(options);
      const listener1 = jasmine.createSpy('listener');
      const listener2 = jasmine.createSpy('listener');
      const value = 'value';

      host.listenTo('test', listener1);
      host2.listenTo('test', listener2);

      host.emit('test', value);

      expect(listener2).not.toHaveBeenCalled();
    });

    it('does not throw errors if there are no listeners for a message', () => {
      expect(
        host.emit.bind(host, 'messageWithNoListeners')
      ).not.toThrowError();
    });

    it('does not throw errors if a non-string is supplied for the message argument', () => {
      expect(host.emit.bind(host, 55)).not.toThrowError();
      expect(host.emit.bind(host, [55, 73])).not.toThrowError();
      expect(host.emit.bind(host, HostObject)).not.toThrowError();
    });
  });
});
