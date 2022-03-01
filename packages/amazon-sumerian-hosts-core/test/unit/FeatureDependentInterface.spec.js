// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable max-classes-per-file */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import {AbstractHostFeature, HostObject} from '@amazon-sumerian-hosts/core';
import describeEnvironment from './EnvironmentHarness';
import FeatureDependentInterface from '../../src/core/FeatureDependentInterface';

describeEnvironment('FeatureDependentInterface', () => {
  let hostFeature;
  let MockHostFeature1;
  let MockHostFeature2;
  let host;

  beforeEach(() => {
    const HostFeature = AbstractHostFeature.mix(
      FeatureDependentInterface.Mixin
    );
    HostFeature.prototype.dependency1 = jasmine.createSpy('dependency1');
    HostFeature.prototype.dependency2 = jasmine.createSpy('dependency2');
    HostFeature.EVENT_DEPENDENCIES.MockHostFeature1 = {
      dependency1Event: 'dependency1',
      dependency2Event: 'dependency2',
    };
    MockHostFeature1 = class MockHostFeature1 extends AbstractHostFeature {};
    Object.assign(MockHostFeature1.EVENTS, {
      dependency1Event: 'dependency1',
      dependency2Event: 'dependency2',
    });
    MockHostFeature2 = class MockHostFeature2 extends AbstractHostFeature {};
    host = new HostObject();
    host.addFeature(HostFeature);
    host.addFeature(MockHostFeature1);
    host.addFeature(MockHostFeature2);
    hostFeature = host._features.FeatureDependentMixin;
  });

  describe('_onFeatureAdded', () => {
    it("should add listeners for any EVENT_DEPENDENCIES that match the added feature's name", () => {
      const listenTo = spyOn(host, 'listenTo');
      hostFeature._onFeatureAdded('MockHostFeature1');

      expect(listenTo).toHaveBeenCalledWith(
        'MockHostFeature1.dependency1',
        hostFeature.dependency1
      );

      expect(listenTo).toHaveBeenCalledWith(
        'MockHostFeature1.dependency2',
        hostFeature.dependency2
      );
    });

    it("should not add listeners for any EVENT_DEPENDENCIES that do not match the added feature's name", () => {
      const listenTo = spyOn(host, 'listenTo');
      hostFeature._onFeatureAdded('MockHostFeature2');

      expect(listenTo).not.toHaveBeenCalledWith(
        'MockHostFeature1.dependency1',
        hostFeature.dependency1
      );

      expect(listenTo).not.toHaveBeenCalledWith(
        'MockHostFeature1.dependency2',
        hostFeature.dependency2
      );
    });
  });

  describe('_onFeatureRemoved', () => {
    it("should remove listeners for any EVENT_DEPENDENCIES that match the removed feature's name", () => {
      const stopListening = spyOn(host, 'stopListening');
      hostFeature._onFeatureRemoved('MockHostFeature1');

      expect(stopListening).toHaveBeenCalledWith(
        'MockHostFeature1.dependency1',
        hostFeature.dependency1
      );

      expect(stopListening).toHaveBeenCalledWith(
        'MockHostFeature1.dependency2',
        hostFeature.dependency2
      );
    });

    it("should not remove listeners for any EVENT_DEPENDENCIES that do not match the removed feature's name", () => {
      const stopListening = spyOn(host, 'stopListening');
      hostFeature._onFeatureRemoved('MockHostFeature2');

      expect(stopListening).not.toHaveBeenCalledWith(
        'MockHostFeature1.dependency1',
        hostFeature.dependency1
      );

      expect(stopListening).not.toHaveBeenCalledWith(
        'MockHostFeature1.dependency2',
        hostFeature.dependency2
      );
    });
  });

  describe('discard', () => {
    it('should remove listeners for all event dependencies', () => {
      const stopListening = spyOn(host, 'stopListening');
      hostFeature.discard();

      expect(stopListening).toHaveBeenCalledWith(
        'MockHostFeature1.dependency1',
        hostFeature.dependency1
      );

      expect(stopListening).toHaveBeenCalledWith(
        'MockHostFeature1.dependency2',
        hostFeature.dependency2
      );
    });
  });
});
