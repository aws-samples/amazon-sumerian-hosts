// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {Messenger as CoreMessenger} from '@amazon-sumerian-hosts/core';

/**
 * @extends core/Messenger
 * @alias babylonjs/Messenger
 */
class Messenger extends CoreMessenger {
  /**
   * @constructor
   *
   * @param {any=} id - Id for the object. If none is provided a new id will
   * be created. Id should be able to be represented as a string.
   */
  constructor(id) {
    super(id);

    this._events = {};
  }

  _createListener(callback) {
    return value => {
      callback(value);
    };
  }

  _addListener(message, listener) {
    this._events[message].add(listener);
  }

  _removeListener(message, listener) {
    this._events[message].removeCallback(listener);
  }

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
