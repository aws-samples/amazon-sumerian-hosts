// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable max-classes-per-file */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import {Messenger, AbstractHostFeature} from '@amazon-sumerian-hosts/core';
import describeEnvironment from './EnvironmentHarness';

describeEnvironment('AbstractHostFeature', (options = {}) => {
  let hostFeature;
  let mockHost;

  class MockFeature extends AbstractHostFeature {}

  beforeEach(() => {
    hostFeature = new MockFeature();
    mockHost = {
      owner: options.owner,
      _features: {MockFeature},
      _callbacks: {},
      listenTo: () => {},
      stopListening: () => {},
      stopListeningToAll: () => {},
      emit: () => {},
    };
    hostFeature._host = mockHost;
  });

  describe('installApi', () => {
    it('should add a property with the name of the feature class to the host set to an object that contains an EVENT property object', () => {
      hostFeature.installApi();

      expect(mockHost.MockFeature).toBeDefined();
      expect(mockHost.MockFeature.EVENTS).toBeDefined();

      const expected = 'object';
      const actual = typeof mockHost.MockFeature.EVENTS;

      expect(expected).toEqual(actual);
    });
  });

  describe('host', () => {
    it('should return the object that owns the feature', () => {
      const expected = mockHost;
      const actual = hostFeature.host;

      expect(expected).toEqual(actual);
    });
  });

  describe('owner', () => {
    it('should return the object that owns the host that owns the feature', () => {
      const expected = options.owner;
      const actual = hostFeature.owner;

      expect(expected).toEqual(actual);
    });
  });

  describe('listenTo', () => {
    it("should execute the host's listenTo method", () => {
      const hostFn = spyOn(mockHost, 'listenTo');
      const listener = () => {};
      hostFeature.listenTo('message', listener);

      expect(hostFn).toHaveBeenCalledWith('message', listener);
    });
  });

  describe('stopListening', () => {
    it("should execute the host's stopListening method", () => {
      const hostFn = spyOn(mockHost, 'stopListening');
      const listener = () => {};
      hostFeature.stopListening('message', listener);

      expect(hostFn).toHaveBeenCalledWith('message', listener);
    });
  });

  describe('stopListeningToAll', () => {
    it("should execute the host's stopListeningToAll method", () => {
      const hostFn = spyOn(mockHost, 'stopListeningToAll');
      hostFeature.stopListeningToAll();

      expect(hostFn).toHaveBeenCalledWith();
    });
  });

  describe('emit', () => {
    it("should execute the host's emit method", () => {
      const hostFn = spyOn(mockHost, 'emit');
      hostFeature.emit('message', 'value');

      expect(hostFn).toHaveBeenCalled();
    });

    it("should prefix the emitted message with the name of the feature's class", () => {
      const hostFn = spyOn(mockHost, 'emit');
      hostFeature.emit('message', 'value');

      expect(hostFn).toHaveBeenCalledWith('MockFeature.message', 'value');
    });
  });

  describe('constructor.emit', () => {
    it("should execute Messenger's static emit method", () => {
      const messengerFn = spyOn(Messenger, 'emit');
      AbstractHostFeature.emit('message', 'value');

      expect(messengerFn).toHaveBeenCalled();
    });

    it("should prefix the emitted message with the name of the feature's class", () => {
      const messengerFn = spyOn(Messenger, 'emit');
      AbstractHostFeature.emit('message', 'value');

      expect(messengerFn).toHaveBeenCalledWith(
        'AbstractHostFeature.message',
        'value'
      );
    });
  });

  describe('update', () => {
    it('should emit the update event with the value passed to update', () => {
      const emitSpy = spyOn(hostFeature, 'emit');
      hostFeature.update(0.01);

      expect(emitSpy).toHaveBeenCalledWith(
        AbstractHostFeature.EVENTS.update,
        0.01
      );
    });
  });

  describe('discard', () => {
    it("should delete the host's property reference to the feature", () => {
      hostFeature.installApi();

      expect(mockHost.MockFeature).toBeDefined();

      hostFeature.discard();

      expect(mockHost.MockFeature).not.toBeDefined();
    });

    it("should delete the feature's property reference to the host", () => {
      hostFeature.installApi();

      expect(hostFeature.host).toBeDefined();

      hostFeature.discard();

      expect(hostFeature.host).not.toBeDefined();
    });
  });

  describe('mix', () => {
    let MockInterface1;
    let MockInterface2;

    beforeAll(() => {
      MockInterface1 = class MockInterface1 {
        static Mixin(BaseClass) {
          return class extends BaseClass {};
        }
      };

      MockInterface2 = class MockInterface2 {
        static Mixin(BaseClass) {
          return class extends BaseClass {};
        }
      };
    });

    it('should execute each class factory in sequence', () => {
      const onMixin1 = spyOn(MockInterface1, 'Mixin');
      const onMixin2 = spyOn(MockInterface2, 'Mixin');
      AbstractHostFeature.mix(MockInterface1.Mixin, MockInterface2.Mixin);

      expect(onMixin1).toHaveBeenCalledBefore(onMixin2);
    });

    it('should return a class that inherits from AbstractHostFeature', () => {
      const MixClass = AbstractHostFeature.mix(
        MockInterface1.Mixin,
        MockInterface2.Mixin
      );

      expect(MixClass.prototype).toBeInstanceOf(AbstractHostFeature);
    });
  });
});
