// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Deferred from 'core/Deferred';
import {Linear} from './Easing';

export default class AnimationUtils {
  /**
   * Linearly interpolate between two values.
   *
   * @param {number} from - Start value.
   * @param {number} to - Target value.
   * @param {number} factor - 0-1 amount to interpolate between from and to.
   *
   * @returns {number}
   */
  static lerp(from, to, factor) {
    return from + (to - from) * factor;
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
    return Math.max(min, Math.min(value, max));
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
   * @param {Function} [easingFn=Linear.InOut] - Easing function to use for animation.
   * @param {Function} [onFinish] - Callback to execute once the animation completes.
   * The target value is passed as a parameter.
   * @param {Function=} onProgress - Callback to execute each time the animation
   * property is updated during the animation. The property's value at the time of
   * the update is passed as a parameter.
   * @param {Function=} onCancel - Callback to execute if the user cancels the
   * animation before completion. The animation property's value at the time of
   * cancel is passed as a parameter.
   * @param {Function=} onError - Callback to execute if the animation stops
   * because an error is encountered. The error message is passed as a parameter.
   *
   * @returns {Deferred} Resolves with the property's value once it reaches the
   * target value.
   */
  static interpolateProperty(
    propertyOwner,
    propertyName,
    targetValue,
    options = {}
  ) {
    let {seconds, easingFn} = options;
    const {onFinish, onProgress, onCancel, onError} = options;

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

    // Make sure seconds is numeric
    if (typeof seconds !== 'number') {
      if (seconds !== undefined) {
        console.warn(
          `Invalid seconds value ${seconds} for property interpolation. Defaulting to 0.`
        );
      }

      seconds = 0;
    }

    // Resolve immediately if the interpolation time is not greater than 0
    if (seconds <= 0) {
      propertyOwner[propertyName] = targetValue;

      if (typeof onFinish === 'function') {
        onFinish(targetValue);
      }

      return Deferred.resolve();
    }

    let currentTime = 0;
    const totalTime = seconds * 1000; // convert to milliseconds

    // Default to linear interpolation
    if (typeof easingFn !== 'function') {
      if (easingFn !== undefined) {
        console.warn(
          `Invalid property interpolation easingFn. Defaulting to linear interpolation.`
        );
      }

      easingFn = Linear.InOut;
    }

    // Executable to pass to Deferred, meant to be run in an update loop
    const onUpdate = (resolve, reject, deltaTime = 0) => {
      if (typeof deltaTime !== 'number') {
        const e = new Error(
          `Invalid property interpolation deltaTime. DeltaTime must be a number.`
        );
        reject(e);
        return;
      }

      // Make sure time has passed
      if (deltaTime === 0) {
        return;
      }

      // Stop updating current time if rewinding past the beginning
      currentTime += deltaTime;
      if (currentTime < 0) {
        currentTime = 0;
        return;
      }

      const linearFactor = this.clamp(currentTime / totalTime, 0, 1);

      if (propertyOwner[propertyName] !== targetValue) {
        // Calculate the lerp factor
        const easeFactor = easingFn(linearFactor);

        if (typeof easeFactor !== 'number') {
          const e = new Error(
            `Invalid property interpolation easingFn. EasingFn must return a number.`
          );
          reject(e);
          return;
        }

        // Update the value
        propertyOwner[propertyName] = AnimationUtils.lerp(
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
      if (linearFactor === 1) {
        propertyOwner[propertyName] = targetValue;
        resolve();
      }
    };

    return new Deferred(onUpdate, onFinish, onError, onCancel);
  }
}
