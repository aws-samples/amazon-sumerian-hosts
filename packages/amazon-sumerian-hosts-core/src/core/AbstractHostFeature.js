// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Messenger from './Messenger';

/**
 * Base class for all host features. Keeps a reference to the host object managing
 * the feature.
 *
 * @abstract
 *
 * @property {Object} EVENTS - Built-in messages that the feature emits. When the
 * feature is added to a {@link core/HostObject}, event names will be prefixed by the
 * name of the feature class + '.'.
 * @property {string} [EVENTS.update=onUpdate] - Message that is emitted after
 * each call to [update]{@link AbstractHostFeature#update}.
 * @property {Object} SERVICES - Any AWS services that are necessary for the
 * feature to function.
 */
class AbstractHostFeature {
  /**
   * @constructor
   *
   * @param {core/HostObject} host - The HostObject managing the feature.
   */
  constructor(host) {
    this._host = host;
  }

  /**
   * Adds a namespace to the host with the name of the feature to contain properties
   * and methods from the feature that users of the host need access to.
   */
  installApi() {
    const events = {};
    const api = {EVENTS: events};

    // Add the class name to event names
    Object.entries(this.constructor.EVENTS).forEach(([name, value]) => {
      events[name] = `${this.constructor.name}.${value}`;
    });

    this._host[this.constructor.name] = api;

    return api;
  }

  /**
   * Gets the host that manages the feature.
   *
   * @readonly
   */
  get host() {
    return this._host;
  }

  /**
   * Gets the engine owner object of the host.
   *
   * @readonly
   */
  get owner() {
    return this._host.owner;
  }

  /**
   * Listen to a feature message from the host object.
   *
   * @param {string} message - Message to listen for.
   * @param {Function} callback - The callback to execute when the message is received.
   */
  listenTo(message, callback) {
    this._host.listenTo(message, callback);
  }

  /**
   * Listen to a feature message from the global messenger. Feature messages will
   * be prefixed with the class name of the feature.
   *
   * @param {string} message - Message to listen for.
   * @param {Function} callback - The callback to execute when the message is received.
   */
  static listenTo(message, callback) {
    message = `${this.name}.${message}`;
    Messenger.listenTo(message, callback);
  }

  /**
   * Stop listening to a message from the host object.
   *
   * @param {string} message - Message to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  stopListening(message, callback) {
    this._host.stopListening(message, callback);
  }

  /**
   * Stop listening to a message from the global messenger.
   *
   * @param {string} message - Message to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  static stopListening(message, callback) {
    message = `${this.name}.${message}`;
    Messenger.stopListening(message, callback);
  }

  /**
   * Stop listening to a message matching the given regular expression from the
   * host object.
   *
   * @param {Regexp} regexp - The regular expression to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  stopListeningByRegexp(regexp, callback) {
    this._host.stopListeningByRegexp(regexp, callback);
  }

  /**
   * Stop listening to a message matching the given regular expression from the
   * global messenger.
   *
   * @param {Regexp} regexp - The regular expression to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  static stopListeningByRegexp(regexp, callback) {
    regexp = new RegExp(`^${this.name}.${regexp.source.replace(/\^/, '')}`);
    Messenger.stopListeningByRegexp(regexp, callback);
  }

  /**
   * Stop listening to all messages.
   */
  stopListeningToAll() {
    this._host.stopListeningToAll();
  }

  /**
   * Stop listening to all feature messages.
   */
  static stopListeningToAll() {
    Messenger.stopListeningByRegexp(new RegExp(`^${this.name}.`));
  }

  /**
   * Emit feature messages from the host. Feature messages will be prefixed with
   * the class name of the feature.
   *
   * @param {string} message - The message to emit.
   * @param {any=} value - Optional parameter to pass to listener callbacks.
   */
  emit(message, value) {
    message = `${this.constructor.name}.${message}`;
    this._host.emit(message, value);
  }

  /**
   * Emit feature messages from the global messenger. Feature messages will be prefixed
   * with the class name of the feature.
   *
   * @param {string} message - The message to emit.
   * @param {any=} value - Optional parameter to pass to listener callbacks.
   */
  static emit(message, value) {
    message = `${this.name}.${message}`;
    Messenger.emit(message, value);
  }

  /**
   * Executes each time the host is updated.
   *
   * @param {number} deltaTime - Amount of time since the last host update was
   * called.
   */
  update(deltaTime) {
    this.emit(this.constructor.EVENTS.update, deltaTime);
  }

  /**
   * Clean up once the feature is no longer in use. Remove the feature namespace
   * from the host and remove reference to the host.
   */
  discard() {
    Object.keys(this._host[this.constructor.name]).forEach(name => {
      delete this._host[this.constructor.name][name];
    });

    delete this._host[this.constructor.name];
    delete this._host;
  }

  /**
   * Applies a sequence of mixin class factory functions to this class and
   * returns the result. Each function is expected to return a class that
   * extends the class it was given. The functions are applied in the order
   * that parameters are given, meaning that the first factory will
   * extend this base class.
   *
   * @param {...Function} mixinClassFactories Class factory functions that will
   * be applied.
   *
   * @returns {Class} A class that is the result of applying the factory functions.
   * The resulting class will always inherit from AbstractHostFeature.
   */
  static mix(...mixinClassFactories) {
    let ResultClass = this;

    mixinClassFactories.forEach(mixinClassFactory => {
      ResultClass = mixinClassFactory(ResultClass);
    });

    return ResultClass;
  }
}

Object.defineProperties(AbstractHostFeature, {
  EVENTS: {
    value: {
      update: 'onUpdate',
    },
    writable: false,
  },
  SERVICES: {
    value: {},
    writable: false,
  },
});

export default AbstractHostFeature;
