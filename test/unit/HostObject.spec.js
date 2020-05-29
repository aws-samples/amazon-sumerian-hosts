// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-undef */
import HostObject from 'app/HostObject';
import AbstractHostFeature from 'core/AbstractHostFeature';
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
