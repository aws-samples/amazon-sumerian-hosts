// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreMessenger from '../core/Messenger';

/**
 * Class that can execute functions when local messages are received. Local messages
 * are prefixed with the instance's id.
 */
class Messenger extends CoreMessenger {
  constructor(id) {
    super(id);

    this._events = {};
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
    return value => {
      callback(value);
    };
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
    this._events[message].add(listener);
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
    this._events[message].removeCallback(listener);
  }

  /**
   * Execute a function when a message is received for this object.
   *
   * @param {string} message - The message to listen for.
   * @param {Function} callback - Function to execute once the message is received.
   */
  listenTo(message, callback) {
    if (this._events[message] === undefined) {
      this._events[message] = new BABYLON.Observable();
    }

    try {
      super.listenTo(message, callback);
    } catch (e) {
      // Clean up the observable if nothing is listening to it
      if (!this._events[message].hasObservers()) {
        delete this._events[message];

        throw e;
      }
    }
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
    const event = this._events[message];

    if (event === undefined) {
      return;
    }

    super.stopListening(message, callback);

    if (!event.hasObservers()) {
      delete this._events[message];
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
    const event = this._events[message];

    if (event === undefined) {
      return;
    }

    event.notifyObservers(value);
  }
}

Object.defineProperty(Messenger, 'GlobalMessenger', {
  value: new Messenger(),
  writable: false,
});

export default Messenger;
