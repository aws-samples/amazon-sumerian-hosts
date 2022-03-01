// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {Messenger} from '@amazon-sumerian-hosts/core';
import describeEnvironment from './EnvironmentHarness';

describeEnvironment('Messenger', () => {
  let messenger;

  beforeEach(() => {
    messenger = new Messenger();
  });

  describe('constructor.GlobalMessenger', () => {
    it('should be an instance of Messenger', () => {
      expect(Messenger.GlobalMessenger).toBeInstanceOf(Messenger);
    });
  });

  describe('id', () => {
    it('should return a string', () => {
      const actual = typeof messenger.id;
      const expected = 'string';

      expect(actual).toEqual(expected);
    });

    it('should be unique if it was not user-defined', () => {
      const messenger2 = new Messenger();
      const messenger3 = new Messenger();

      expect(messenger.id).not.toEqual(messenger2.id);
      expect(messenger.id).not.toEqual(messenger3.id);
      expect(messenger2.id).not.toEqual(messenger3.id);
    });
  });

  describe('listenTo', () => {
    it('can execute a listener when a message is received', () => {
      const listener = jasmine.createSpy('listener');
      messenger.listenTo('test', listener);
      messenger.emit('test');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('can execute a listener multiple times if listenTo is called with the same message and listener multiple times', () => {
      const listener = jasmine.createSpy('listener');
      messenger.listenTo('test', listener);
      messenger.emit('test');
      messenger.emit('test');
      messenger.emit('test');

      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('throws an error if the listener callback is not a function', () => {
      expect(messenger.listenTo.bind(messenger, 'test', 'test')).toThrowError();
    });

    it('does not throw an error if the message is not a string', () => {
      const listener = () => {};

      expect(
        messenger.listenTo.bind(messenger, 5, listener)
      ).not.toThrowError();

      expect(
        messenger.listenTo.bind(messenger, Messenger, listener)
      ).not.toThrowError();
    });
  });

  describe('stopListening', () => {
    it('can stop a specific listener from being executed when a message is received', () => {
      const listener1 = jasmine.createSpy('listener1');
      const listener2 = jasmine.createSpy('listener2');
      messenger.listenTo('test', listener1);
      messenger.listenTo('test', listener2);
      messenger.stopListening('test', listener1);
      messenger.emit('test');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('can stop all listeners from being executed when a message is received', () => {
      const listener1 = jasmine.createSpy('listener1');
      const listener2 = jasmine.createSpy('listener2');
      const listener3 = jasmine.createSpy('listener3');
      messenger.listenTo('test', listener1);
      messenger.listenTo('test', listener2);
      messenger.listenTo('test', listener3);
      messenger.stopListening('test');
      messenger.emit('test');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });

    it('fails gracefully if the message is not a string', () => {
      expect(
        messenger.stopListening.bind(messenger, messenger)
      ).not.toThrowError();
    });

    it('fails gracefully if the callback is not a function', () => {
      expect(
        messenger.stopListening.bind(messenger, 'test', null)
      ).not.toThrowError();
    });
  });

  describe('stopListeningToAll', () => {
    it('can stop all listeners from being executed when any message is received', () => {
      const listener1 = jasmine.createSpy('listener1');
      const listener2 = jasmine.createSpy('listener2');
      const listener3 = jasmine.createSpy('listener3');
      const listener4 = jasmine.createSpy('listener4');
      messenger.listenTo('test1', listener1);
      messenger.listenTo('test2', listener2);
      messenger.listenTo('test1', listener3);
      messenger.listenTo('test2', listener4);
      messenger.stopListeningToAll();
      messenger.emit('test1');
      messenger.emit('test2');

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
      messenger.listenTo('test', listener);
      messenger.emit('test', value);

      expect(listener).toHaveBeenCalledWith(value);
    });

    it('does not throw errors if there are no listeners for a message', () => {
      expect(
        messenger.emit.bind(messenger, 'messageWithNoListeners')
      ).not.toThrowError();
    });

    it('does not throw errors if a non-string is supplied for the message argument', () => {
      expect(messenger.emit.bind(messenger, 55)).not.toThrowError();
      expect(messenger.emit.bind(messenger, [55, 73])).not.toThrowError();
      expect(messenger.emit.bind(messenger, Messenger)).not.toThrowError();
    });
  });
});
