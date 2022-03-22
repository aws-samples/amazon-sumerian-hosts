// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Deferred from '../Deferred';
import Utils from '../Utils';
import MathUtils from '../MathUtils';
import {Linear} from './Easing';

/**
 * A collection of useful animation functions.
 *
 * @hideconstructor
 */
class AnimationUtils {
  static lerp(from, to, factor) {
    console.warn(
      `AnimationUtils.lerp is being deprecated. Use MathUtils.lerp instead.`
    );

    return MathUtils.lerp(from, to, factor);
  }

  /**
   * Clamp a number between 2 values.
   *
   * @param {number} value - Value to clamp.
   * @param {number} [min=0] - Minumum value.
   * @param {number} [max=1] - Maximum value.
   *
   * @returns {number}
   */
  static clamp(value, min = 0, max = 1) {
    console.warn(
      `AnimationUtils.clamp is being deprecated. Use MathUtils.clamp instead.`
    );

    return MathUtils.clamp(value, min, max);
  }

  /**
   * Return a deferred promise that can be used to update the value of a numeric
   * property of this object over time. Pass delta time in milliseconds to the
   * deferred promise's execute method in an update loop to animate the property
   * towards the target value.
   *
   * @param {Object} propertyOwner - Object that contains the property to animation.
   * @param {string} propertyName - Name of the property to animate.
   * @param {number} targetValue - Target value to reach.
   * @param {Object=} options - Optional options object
   * @param {number} [options.seconds=0] - Number of seconds it will take to reach
   * the target value.
   * @param {Function} [options.easingFn=Linear.InOut] - Easing function to use for animation.
   * @param {Function} [options.onFinish] - Callback to execute once the animation completes.
   * The target value is passed as a parameter.
   * @param {Function=} options.onProgress - Callback to execute each time the animation
   * property is updated during the animation. The property's value at the time of
   * the update is passed as a parameter.
   * @param {Function=} options.onCancel - Callback to execute if the user cancels the
   * animation before completion. The animation property's value at the time of
   * cancel is passed as a parameter.
   * @param {Function=} options.onError - Callback to execute if the animation stops
   * because an error is encountered. The error message is passed as a parameter.
   *
   * @returns {Deferred} Resolves with the property's value once it reaches the
   * target value.
   */
  static interpolateProperty(
    propertyOwner,
    propertyName,
    targetValue,
    {seconds = 0, easingFn, onFinish, onProgress, onCancel, onError} = {}
  ) {
    // Make sure property is an object
    if (!(propertyOwner instanceof Object)) {
      const e = new Error(
        `Cannot interpolate property ${propertyName}. Property owner must be an object.`
      );

      if (typeof onError === 'function') {
        onError(e);
      }

      return Deferred.reject(e);
    }

    // Make sure property is numeric
    if (Number.isNaN(Number(propertyOwner[propertyName]))) {
      const e = new Error(
        `Cannot interpolate property ${propertyName}. Property must be numeric.`
      );

      if (typeof onError === 'function') {
        onError(e);
      }

      return Deferred.reject(e);
    }

    // Make sure the target value is numeric
    if (Number.isNaN(Number(targetValue))) {
      const e = new Error(
        `Cannot interpolate property ${propertyName} to value ${targetValue}. Target value must be numeric.`
      );

      if (typeof onError === 'function') {
        onError(e);
      }

      return Deferred.reject(e);
    }

    // Resolve immediately if the target has already been reached
    const startValue = propertyOwner[propertyName];

    if (startValue === targetValue) {
      if (typeof onFinish === 'function') {
        onFinish(targetValue);
      }

      return Deferred.resolve(targetValue);
    }

    // Default to linear interpolation
    if (typeof easingFn !== 'function') {
      if (easingFn !== undefined) {
        console.warn(
          `Invalid property interpolation easingFn. Defaulting to linear interpolation.`
        );
      }

      easingFn = Linear.InOut;
    }

    const interpolator = Utils.wait(seconds, {
      onFinish: () => {
        propertyOwner[propertyName] = targetValue;

        if (typeof onFinish === 'function') {
          onFinish(targetValue);
        }
      },
      onCancel: () => {
        if (typeof onCancel === 'function') {
          onCancel(propertyOwner[propertyName]);
        }
      },
      onProgress: progress => {
        if (propertyOwner[propertyName] !== targetValue) {
          // Calculate the lerp factor
          const easeFactor = easingFn(progress);

          if (typeof easeFactor !== 'number') {
            const e = new Error(
              `Invalid property interpolation easingFn. EasingFn must return a number.`
            );
            interpolator.reject(e);
            return;
          }

          // Update the value
          propertyOwner[propertyName] = MathUtils.lerp(
            startValue,
            targetValue,
            easeFactor
          );
        }

        // Signal progress
        if (typeof onProgress === 'function') {
          onProgress(propertyOwner[propertyName]);
        }

        // Signal completion once time is up
        if (progress === 1) {
          propertyOwner[propertyName] = targetValue;
          interpolator.resolve(targetValue);
        }
      },
      onError,
    });

    return interpolator;
  }
}

export default AnimationUtils;
