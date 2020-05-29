// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Utils from './Utils';

/**
 * Class that can execute functions when local messages are received. Local messages
 * are prefixed with the instance's id.
 */
export default class Messenger {
  /**
   * @private
   *
   * @param {any=} id - Id for the object. If none is provided a new id will
   * be created. Id should be able to be represented as a string.
   */
  constructor(id) {
    this._id = id !== undefined ? id : Utils.createId();
    this._dispatcher = window;
    this._callbacks = {};
    this._eventListeners = {};
  }

  /**
   * Gets the string id of the object.
   */
  get id() {
    return this._id;
  }

  /**
   * @private
   *
   * Prefix a message with the instance id.
   *
   * @param {string} message
   *
   * @returns {string}
   */
  _createLocalMessage(message) {
    return `${this.id}.${message}`;
  }

  /**
   * @private
   *
   * Return a function that will call a callback function and supply the event's
   * detail property as an argument.
   *
   * @param {Function} callback
   *
   * @returns {Function}
   */
  _createListener(callback) {
    return e => {
      let value;

      if (e.detail !== null) {
        value = e.detail;
      }

      callback(value);
    };
  }

  /**
   * @private
   *
   * Create an event object and send it to listeners.
   *
   * @param {string} message - Event type name.
   * @param {any=} value - Value to send to listeners.
   */
  _createEvent(message, value) {
    return new CustomEvent(message, {detail: value});
  }

  /**
   * @private
   *
   * Register an event.
   *
   * @param {string} message - Event type name.
   * @param {Function} listener - A listener function generated using _createListener.
   */
  _addListener(message, listener) {
    this._dispatcher.addEventListener(
      this._createLocalMessage(message),
      listener
    );
  }

  /**
   * @private
   *
   * Unregister an event.
   *
   * @param {string} message - Event type name.
   * @param {Function} listener - A listener function generated using _createListener.
   */
  _removeListener(message, listener) {
    this._dispatcher.removeEventListener(
      this._createLocalMessage(message),
      listener
    );
  }

  /**
   * Execute a function when a message is received for this object.
   *
   * @param {string} message - The message to listen for.
   * @param {Function} callback - Function to execute once the message is received.
   */
  listenTo(message, callback) {
    if (typeof callback !== 'function') {
      throw new Error(
        `Cannot add listener for ${message} on ${this.id}. Callback must be a function.`
      );
    }

    if (this._callbacks[message] === undefined) {
      this._callbacks[message] = [];
      this._eventListeners[message] = [];
    }

    const listener = this._createListener(callback);
    this._callbacks[message].push(callback);
    this._eventListeners[message].push(listener);

    this._addListener(message, listener);
  }

  /**
   * Prevent a function from being executed when a message is received for this
   * object.
   *
   * @param {string} message - The message to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  stopListening(message, callback) {
    if (this._callbacks[message] === undefined) {
      return;
    } else if (callback === undefined) {
      // If no callback was defined, call stopListening on all callbacks for the message
      for (let i = this._callbacks[message].length - 1; i > -1; i--) {
        this.stopListening(message, this._callbacks[message][i]);
      }

      return;
    }

    // If a callback was defined, make sure it's a listener
    const index = this._callbacks[message].indexOf(callback);
    if (index === -1) {
      return;
    }

    const listener = this._eventListeners[message][index];
    this._removeListener(message, listener);

    this._callbacks[message].splice(index, 1);
    this._eventListeners[message].splice(index, 1);

    if (this._callbacks[message].length === 0) {
      delete this._callbacks[message];
      delete this._eventListeners[message];
    }
  }

  /**
   * Prevent any functions from being executed when any message is received for
   * this object.
   */
  stopListeningToAll() {
    const messages = Object.keys(this._callbacks);

    for (let i = messages.length - 1; i > -1; i--) {
      this.stopListening(messages[i]);
    }
  }

  /**
   * Send a message, causing listener functions for the message on this object
   * to be executed.
   *
   * @param {string} message - The message to emit.
   * @param {any=} value - Optional argument to pass to listener callbacks.
   */
  emit(message, value) {
    if (this._callbacks[message] === undefined) {
      return;
    }

    message = this._createLocalMessage(message);
    const event = this._createEvent(message, value);
    this._dispatcher.dispatchEvent(event);
  }

  /**
   * Execute a function when a message is received for the global Messenger instance.
   *
   * @param {string} message - The message to listen for.
   * @param {Function} callback - Function to execute once the message is received.
   */
  static listenTo(message, callback, messenger) {
    this.GlobalMessenger.listenTo(message, callback, messenger);
  }

  /**
   * Prevent a function from being executed when a message is received for the
   * global Messenger instance.
   *
   * @param {string} message - The message to stop listening for.
   * @param {Function=} callback - Optional callback to remove. If none is defined,
   * remove all callbacks for the message.
   */
  static stopListening(message, callback) {
    this.GlobalMessenger.stopListening(message, callback);
  }

  /**
   * Prevent any functions from being executed when any message is received for
   * the global Messenger instance.
   */
  static stopListeningToAll() {
    this.GlobalMessenger.stopListeningToAll();
  }

  /**
   * Send a message, causing listener functions for the message on the global Messenger
   * instance to be executed.
   *
   * @param {string} message - The message to emit.
   * @param {any=} value - Optional argument to pass to listener callbacks.
   */
  static emit(message, value) {
    this.GlobalMessenger.emit(message, value);
  }
}

Object.defineProperties(Messenger, {
  GlobalMessenger: {
    value: new Messenger(),
    writable: false,
  },
  EVENTS: {
    value: {},
    writable: false,
  },
});
