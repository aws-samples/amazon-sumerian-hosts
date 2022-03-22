// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-undef */
import {AnimationUtils, Deferred} from '@amazon-sumerian-hosts/core';

describe('AnimationUtils', () => {
  describe('interpolateProperty', () => {
    it('should return a Deferred promise', () => {
      const animated = {weight: 0};

      expect(
        AnimationUtils.interpolateProperty(animated, 'weight', 1)
      ).toBeInstanceOf(Deferred);
    });

    it('should return a rejected promise if the property owner is not an object', () => {
      return expectAsync(AnimationUtils.interpolateProperty()).toBeRejected();
    });

    it('should return a rejected promise if the property value is not numeric', () => {
      const animated = {weight: 'abc'};

      return expectAsync(
        AnimationUtils.interpolateProperty(animated, 'weight', 1)
      ).toBeRejected();
    });

    it('should return a rejected promise if the target value is not numeric', () => {
      const animated = {weight: 0};

      return expectAsync(
        AnimationUtils.interpolateProperty(animated, 'weight', 'abc')
      ).toBeRejected();
    });

    it('should set the property to the target value and resolve on its own if the seconds option is 0 or undefined', async () => {
      const animated = {weight: 0};

      await expectAsync(
        AnimationUtils.interpolateProperty(animated, 'weight', 1)
      ).toBeResolved();

      expect(animated.weight).toEqual(1);

      await expectAsync(
        AnimationUtils.interpolateProperty(animated, 'weight', 2, {seconds: 0})
      ).toBeResolved();

      expect(animated.weight).toEqual(2);
    });

    it('should log a warning if the seconds option is defined and not a number', () => {
      const onWarn = spyOn(console, 'warn');
      const animated = {weight: 0};
      AnimationUtils.interpolateProperty(animated, 'weight', 1, {
        seconds: 'one',
      });

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should log a warning if the easingFn option is defined and not a function', () => {
      const onWarn = spyOn(console, 'warn');
      const animated = {weight: 0};
      AnimationUtils.interpolateProperty(animated, 'weight', 1, {
        seconds: 1,
        easingFn: 'notAFunction',
      });

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    describe('execute', () => {
      it('should reject the promise if a non-numeric deltaTime argument is passed', () => {
        const animated = {weight: 0};
        const interpolator = AnimationUtils.interpolateProperty(
          animated,
          'weight',
          1,
          {
            seconds: 1,
          }
        );

        interpolator.execute('abc');

        return expectAsync(interpolator).toBeRejected();
      });

      it('should reject the promise if the easing function does not return a numeric value', () => {
        const animated = {weight: 0};
        const interpolator = AnimationUtils.interpolateProperty(
          animated,
          'weight',
          1,
          {
            seconds: 1,
            easingFn: () => {},
          }
        );

        interpolator.execute(1000);

        return expectAsync(interpolator).toBeRejected();
      });

      it('should execute the onProgress functiuon argument', () => {
        const animated = {weight: 0};
        const onProgress = jasmine.createSpy('onProgress');
        const interpolator = AnimationUtils.interpolateProperty(
          animated,
          'weight',
          1,
          {
            seconds: 1,
            onProgress,
          }
        );
        interpolator.execute(100);

        expect(onProgress).toHaveBeenCalledWith(0.1);
      });

      it('should resolve the promise once the target value is reached and seconds has elapsed', () => {
        const animated = {weight: 0};
        const interpolator = AnimationUtils.interpolateProperty(
          animated,
          'weight',
          1,
          {
            seconds: 1,
          }
        );
        interpolator.execute(1000);

        return expectAsync(interpolator).toBeResolved();
      });
    });
  });
});
