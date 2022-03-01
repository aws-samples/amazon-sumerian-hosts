/* eslint-disable no-underscore-dangle */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-undef */
import { HostObject, AbstractHostFeature, Deferred} from '@amazon-sumerian-hosts/core';
import describeEnvironment from './EnvironmentHarness';

describeEnvironment('HostObject', (options = {}) => {
  let host;

  class MockFeature extends AbstractHostFeature {}

  beforeEach(() => {
    host = new HostObject(options);
  });

  describe('id', () => {
    it("should return the owner's id", () => {
      const actual = host.id;
      const expected = host.owner.id;

      expect(actual).toEqual(expected);
    });
  });

  describe('now', () => {
    it('should return a number greater than zero', () => {
      const {now} = host;

      expect(now).toBeGreaterThan(0);
    });
  });

  describe('deltaTime', () => {
    it('should return the number of milliseconds since the last time update was called', done => {
      host.update();

      setTimeout(() => {
        expect(host.deltaTime / 1000).toBeCloseTo(0.1, 0);
        done();
      }, 100);
    });
  });

  describe('wait', () => {
    it('should return a Deferred promise', () => {
      expect(host.wait(3)).toBeInstanceOf(Deferred);
    });

    it('should log a warning if the seconds argument is not a number', () => {
      const onWarn = spyOn(console, 'warn');
      host.wait('notANumber');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should add a new deferred to the _waits array', () => {
      const currentWaits = host._waits.length;
      host.wait(3);

      expect(host._waits.length).toBeGreaterThan(currentWaits);
    });

    it('should resolve immediately if the seconds argument is less than or equal to zero', async () => {
      await expectAsync(host.wait(0)).toBeResolved();

      await expectAsync(host.wait(-1)).toBeResolved();
    });

    it("should execute the deferred's execute method with delta time when update is executed", () => {
      const wait = host.wait(3);
      const onExecute = spyOn(wait, 'execute');
      const {deltaTime} = host;

      host.update();

      expect(onExecute).toHaveBeenCalledWith(deltaTime);
    });

    it('should remove the deferred from the _waits array once the deferred is no longer pending', () => {
      const wait = host.wait(0.001);

      expect(host._waits.includes(wait)).toBeTrue();

      wait.resolve();
      wait.then(() => {
        expect(host._waits.includes(wait)).toBeFalse();
      });
    });
  });

  describe('update', () => {
    it('should emit the update event', () => {
      const promise = new Promise(resolve => {
        host.listenTo(HostObject.EVENTS.update, () => {
          resolve();
        });
      });

      host.update();

      return expectAsync(promise).toBeResolved();
    });
  });

  describe('addFeature', () => {
    it('feature type should only accept type function', () => {
      expect(host.addFeature.bind(host, 'NotAFeature')).toThrowError();
    });

    it('should only accept feature types inheriting from AbstractHostFeature', () => {
      expect(host.addFeature.bind(host, AbstractHostFeature)).toThrowError();
    });

    it('should emit the addFeature event with the name of the feature that has been added', async () => {
      const promise = new Promise(resolve => {
        host.listenTo(HostObject.EVENTS.addFeature, featureName => {
          resolve(featureName);
        });
      });

      host.addFeature(MockFeature);

      await expectAsync(promise).toBeResolvedTo('MockFeature');
    });

    it('should only add a feature type that already exists if force argument is true', () => {
      host.addFeature(MockFeature);

      expect(host.addFeature.bind(host, MockFeature)).toThrowError();
      expect(host.addFeature.bind(host, MockFeature, true)).not.toThrowError();
    });
  });

  describe('hasFeature', () => {
    it('should return true if the host owns a feature with the given name', () => {
      host.addFeature(MockFeature);

      expect(host.hasFeature('MockFeature')).toBeTrue();
    });

    it('should return false if the host does not own a feature with the given name', () => {
      expect(host.hasFeature('SomeOtherHostFeature')).toBeFalse();
    });
  });

  describe('listFeatures', () => {
    it('should return an array of the names of installed features', () => {
      host.addFeature(MockFeature);

      expect(host.listFeatures()).toContain('MockFeature');
    });
  });

  describe('removeFeature', () => {
    it('should return false if no feature with the given name was installed', () => {
      expect(host.removeFeature('SomeOtherHostFeature')).toBeFalse();
    });

    it('should return true if a feature is successfully uninstalled', () => {
      host.addFeature(MockFeature);

      expect(host.removeFeature('MockFeature')).toBeTrue();
    });

    it('should emit the removeFeature event with the name of the feature that has been removed', async () => {
      host.addFeature(MockFeature);

      const promise = new Promise(resolve => {
        host.listenTo(HostObject.EVENTS.removeFeature, featureName => {
          resolve(featureName);
        });
      });

      host.removeFeature('MockFeature');

      await expectAsync(promise).toBeResolvedTo('MockFeature');
    });
  });
});
