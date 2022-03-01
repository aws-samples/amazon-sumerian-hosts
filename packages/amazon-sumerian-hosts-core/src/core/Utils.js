// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Deferred from './Deferred';

/**
 * A collection of useful generic functions.
 *
 * @hideconstructor
 */
class Utils {
  /**
   * @static
   *
   * Generate a unique id
   *
   * @returns {String}
   */
  static createId() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const randomNumber = Math.floor((Date.now() + Math.random() * 16) % 16);
      if (c === 'x') {
        return randomNumber.toString(16);
      }
      // Set bit 6 and 7 to 0 and 1
      return ((randomNumber & 0x3) | 0x8).toString(16);
    });
  }

  /**
   * @static
   *
   * Check a name string against an array of strings to determine if it is unique.
   * If it isn't, append incremented trailing integers to the end of the name
   * until it is unique.
   *
   * @param {string} name - String name to make unique.
   * @param {Array.<string>=} nameArray - Array of string names to check agains.
   *
   * @returns {string}
   */
  static getUniqueName(name, nameArray = []) {
    // If the name isn't in the array return it right away
    if (!nameArray.includes(name)) {
      return name;
    }

    const nameSet = new Set(nameArray);

    // Separate the name into string and trailing numbers
    const matchGroup = name.match(/\d*$/);
    const {index} = matchGroup;
    const baseName = name.slice(0, index);
    let increment = Number(matchGroup[0]);

    // Find the highest trailing number value for the base of the name
    nameSet.forEach(setName => {
      const setMatchGroup = setName.match(/\d*$/);

      if (setName.slice(0, setMatchGroup.index) === baseName) {
        const setIncrement = Number(setMatchGroup[0]);

        if (setIncrement > increment) {
          increment = setIncrement;
        }
      }
    });

    // Increment the highest trailing number and append to the name
    return `${baseName}${increment + 1}`;
  }

  /**
   * Return a deferred promise that will wait a given number of seconds before
   * resolving. Pass delta time in milliseconds to the deferred promise's execute
   * method in an update loop to progress time.
   *
   * @param {number} [seconds=0] - Number of seconds to wait before resolving.
   * @param {Object=} options - Optional options object
   * @param {Function} [options.onFinish] - Callback to execute once the wait time
   * is met.
   * @param {Function=} options.onProgress - Callback to execute each time the wait
   * time progresses towards the target number of seconds. The amount of progress
   * as a 0-1 percentage is passed as an argument.
   * @param {Function=} options.onCancel - Callback to execute if the user cancels
   * the wait before completion.
   * @param {Function=} options.onError - Callback to execute if the wait stops
   * because an error is encountered. The error message is passed as a parameter.
   *
   * @returns {Deferred}
   */
  static wait(seconds = 0, {onFinish, onProgress, onCancel, onError} = {}) {
    // Make sure seconds is numeric
    if (typeof seconds !== 'number') {
      console.warn(
        `Invalid seconds value ${seconds} for wait. Defaulting to 0.`
      );

      seconds = 0;
    }

    // Resolve immediately if the wait time is not greater than 0
    if (seconds <= 0) {
      if (typeof onFinish === 'function') {
        onFinish();
      }

      return Deferred.resolve();
    }

    let currentTime = 0;
    const totalTime = seconds * 1000; // convert to milliseconds

    // Executable to pass to Deferred, meant to be run in an update loop
    const onUpdate = (resolve, reject, _cancel, deltaTime = 0) => {
      if (typeof deltaTime !== 'number') {
        const e = new Error(
          `Invalid property wait deltaTime. DeltaTime must be a number.`
        );
        reject(e);
        return;
      }

      // Make sure time has passed
      if (deltaTime === 0) {
        return;
      }

      // Signal progress
      currentTime += deltaTime;
      if (currentTime < 0) {
        currentTime = 0;
      }

      if (typeof onProgress === 'function') {
        onProgress(Math.min(currentTime / totalTime, 1));
      }

      // Signal completion once time is up
      if (currentTime >= totalTime) {
        resolve();
      }
    };

    return new Deferred(onUpdate, onFinish, onError, onCancel);
  }

  /**
   * Get a random float number between a min (inclusive) and max (exclusive) value
   * @param {number} min minimum value
   * @param {number} max maximum value
   * @returns {float}
   */
  static getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * Get a random integer number between a min (inclusive) and max (exclusive) value
   * @param {number} min minimum value
   * @param {number} max maximum value
   * @returns {integer}
   */
  static getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  /**
   * Appends the Sumerian Hosts custom user-agent to a string if it is not
   * already present.
   *
   * @private
   *
   * @param {string} currentUserAgent - String to append to if needed.
   *
   * @returns {string}
   */
  static withCustomUserAgent(currentUserAgent) {
    const sumerianHostsUserAgent = 'request-source/SumerianHosts';

    if (currentUserAgent == null) {
      return sumerianHostsUserAgent;
    }

    if (currentUserAgent.indexOf(sumerianHostsUserAgent) !== -1) {
      return currentUserAgent;
    }

    return currentUserAgent.concat(' ', sumerianHostsUserAgent);
  }
}

export default Utils;
