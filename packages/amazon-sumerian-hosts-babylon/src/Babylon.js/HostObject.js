// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {HostObject as CoreHostObject} from '@amazon-sumerian-hosts/core';

/**
 * @extends core/HostObject
 * @alias babylonjs/HostObject
 */
class HostObject extends CoreHostObject {
  /**
   * @constructor
   *
   * @param {Object=} options - Options for the host.
   * @param {Object=} options.owner - Optional engine-specific owner of the host.
   */
  constructor(options = {}) {
    super(options);

    if (this._owner) {
      Object.defineProperty(this, 'deltaTime', {
        get: () => {
          return this._owner.getEngine().getDeltaTime();
        },
      });
    }
    this._events = {};
  }

  get now() {
    return BABYLON.PrecisionDate.Now;
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

export default HostObject;
