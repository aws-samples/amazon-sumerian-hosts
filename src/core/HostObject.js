// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Messenger from 'app/Messenger';
import AbstractHostFeature from './AbstractHostFeature';

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
