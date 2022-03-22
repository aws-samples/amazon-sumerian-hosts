// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Messenger from './Messenger';
import AbstractHostFeature from './AbstractHostFeature';
import Utils from './Utils';

/**
 * Object that manages access to all Host features. Contains a reference to
 * engine-specific visuals if applicable.
 *
 * @extends core/Messenger
 * @alias core/HostObject
 *
 * @property {Object} EVENTS - Built-in messages that the Messenger emits.
 * @property {string} [EVENTS.update='onUpdate'] - Message that is emitted after
 * each call to [update]{@link core/HostObject#update}.
 * @property {string} [EVENTS.addFeature='onAddFeature'] - Message that is emitted
 * after each call to [addFeature]{@link core/HostObject#addFeature}.
 * @property {string} [EVENTS.removeFeature='onRemoveFeature'] - Message that is emitted
 * after each call to [removeFeature]{@link core/HostObject#removeFeature}.
 */
class HostObject extends Messenger {
  /**
   * @constructor
   *
   * @param {Object=} options - Options for the host.
   * @param {Object=} options.owner - Optional engine-specific owner of the host.
   */
  constructor({owner = {}} = {}) {
    // If an owner is specified, use its id for messaging
    super(owner.id);

    this._owner = owner;
    this._features = {};
    this._waits = [];
    this._lastUpdate = this.now;
  }

  /**
   * Gets the engine owner object of the host.
   *
   * @readonly
   * @type {Object}
   */
  get owner() {
    return this._owner;
  }

  /**
   * Gets the current time in milliseconds.
   *
   * @readonly
   * @type {number}
   */
  get now() {
    return Date.now();
  }

  /**
   * Gets the amount of time in milliseconds since update was last called.
   *
   * @readonly
   * @type {number}
   */
  get deltaTime() {
    return this.now - this._lastUpdate;
  }

  /**
   * This function should be called in the engine's render loop. Executes update
   * loops for all features.
   */
  update() {
    const currentTime = this.now;
    const dt = this.deltaTime;

    // Progress stored waits
    this._waits.forEach(wait => {
      wait.execute(dt);
    });

    // Update all features
    Object.values(this._features).forEach(feature => {
      feature.update(dt);
    });

    // Notify listeners an update occured
    this.emit(this.constructor.EVENTS.update, dt);

    this._lastUpdate = currentTime;
  }

  /**
   * Return a deferred promise that will wait a given number of seconds before
   * resolving. The host will continuously update the wait promise during the
   * update loop until it resolves.
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
  wait(seconds, {onFinish, onProgress, onCancel, onError} = {}) {
    const wait = Utils.wait(seconds, {onFinish, onProgress, onCancel, onError});
    this._waits.push(wait);

    // Once the wait promise is no longer pending remove it from the waits array
    const onComplete = () => {
      this._waits.splice(this._waits.indexOf(wait), 1);
    };
    wait.then(onComplete, onComplete);

    return wait;
  }

  /**
   * Instantiate a new Host feature and store it. Features must inherit from
   * AbstractHostFeature.
   *
   * @param {Class} FeatureClass - Class that will instantiate the feature. Must
   * extend {@link AbstractHostFeature}.
   * @param {boolean} [force=false] - Whether or not to overwrite an existing
   * feature if one of this type already exists on the object.
   * @param  {...any} args - Additional arguments to pass to the FeatureClass
   * constructor. The HostObject will always be passed as the first argument.
   *
   * @returns {boolean} - Whether or not a feature was successfully added.
   */
  addFeature(FeatureClass, force = false, ...args) {
    const inputType = typeof FeatureClass;

    // Make sure the FeatureClass can be executed
    if (inputType !== 'function') {
      throw new Error(
        `Cannot add feature to host ${this.id}. FeatureClass must be a class.`
      );
    }
    // Make sure the feature is a host feature
    else if (!(FeatureClass.prototype instanceof AbstractHostFeature)) {
      throw new Error(
        `Cannot add feature ${FeatureClass.name} to host ${this.id}. FeatureClass must extend AbstractHostFeature.`
      );
    }

    // Check if the FeatureClass already exists on this object
    if (this._features[FeatureClass.name] !== undefined) {
      if (force) {
        console.warn(
          `Feature ${FeatureClass.name} already exists on host ${this.id}. Existing feature will be overwritten.`
        );
      } else {
        throw new Error(
          `Feature ${FeatureClass.name} already exists on host ${this.id}. Use 'force' argument to overwrite the feature.`
        );
      }
    }

    // Initialize the feature
    const feature = new FeatureClass(this, ...args);
    feature.installApi();

    this._features[FeatureClass.name] = feature;
    this.emit(this.constructor.EVENTS.addFeature, FeatureClass.name);

    return true;
  }

  /**
   * Remove a feature from the object.
   *
   * @param {string} typeName - Name of the type of feature to remove.
   *
   * @returns {boolean} - Whether or not a feature was successfully removed.
   */
  removeFeature(typeName) {
    if (this._features[typeName] === undefined) {
      console.warn(
        `Feature of type ${typeName} does not exist on host ${this.id}. No feature will be removed.`
      );
      return false;
    } else {
      // Remove the feature
      this.emit(this.constructor.EVENTS.removeFeature, typeName);
      this._features[typeName].discard();
      delete this._features[typeName];

      return true;
    }
  }

  /**
   * Indicate whether a specified feature is installed on the host.
   *
   * @param {string} typeName - Name of the type of feature to look for.
   *
   * @returns {boolean}
   */
  hasFeature(typeName) {
    return !!this._features[typeName];
  }

  /**
   * List the names of the features installed on the host.
   *
   * @returns {Array.<string>}
   */
  listFeatures() {
    return Object.keys(this._features);
  }
}

Object.defineProperty(HostObject, 'EVENTS', {
  value: {
    ...Object.getPrototypeOf(HostObject).EVENTS,
    update: 'onUpdate',
    addFeature: 'onAddFeature',
    removeFeature: 'onRemoveFeature',
  },
  writable: false,
});

export default HostObject;
