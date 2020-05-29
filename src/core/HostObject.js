// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Messenger from 'app/Messenger';
import AbstractHostFeature from './AbstractHostFeature';

/**
 * Object that manages access to all Host features. Contains a reference to
 * engine-specific visuals if applicable.
 */
export default class HostObject extends Messenger {
  /**
   * @private
   *
   * @param {Object=} options - Options for the host.
   * @param {Object=} options.owner - Optional engine-specific owner of the host.
   */
  constructor(options = {}) {
    // If an owner is specified, use its id for messaging
    const id = options.owner ? options.owner.id : undefined;
    super(id);

    this._owner = options.owner;
    this._features = {};
    this._lastUpdate = this.now;
  }

  /**
   * Gets the engine owner object of the host.
   */
  get owner() {
    return this._owner;
  }

  /**
   * Gets the current time
   */
  get now() {
    return Date.now();
  }

  /**
   * Gets the amount of time since update was last called;
   */
  get deltaTime() {
    return this.now - this._lastUpdate;
  }

  /**
   * This function should be called in the engine's render loop. Executes update
   * loops for all features.
   */
  update() {
    const dt = this.deltaTime;

    // Update all features
    Object.values(this._features).forEach(feature => {
      feature.update(dt);
    });

    // Notify listeners an update occured
    this.emit(this.constructor.EVENTS.update, dt);

    this._lastUpdate = this.now;
  }

  /**
   * Instantiate a new Host feature and store it. Features must inherit from
   * AbstractHostFeature.
   *
   * @param {Function<AbstractHostFeature>} FeatureClass - Class that will
   * instantiate the feature. Must inherit from AbstractHostFeature.
   * @param {boolean} [force=false] - Whether or not to overwrite an existing
   * feature if one of this type already exists on the object.
   * @param  {...any} args - Additional arguments to pass to the FeatureClass
   * constructor. The HostObject will always be passed as the first argument.
   *
   * @returns {boolean}
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
   * @returns {boolean}
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
