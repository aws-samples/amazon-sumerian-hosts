// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreMessenger from 'core/Messenger';

/**
 * Class that can execute functions when local messages are received. Local messages
 * are prefixed with the instance's id.
 */
class Messenger extends CoreMessenger {
  /**
   * @private
   *
   * @param {any=} id - Id for the object. If none is provided a new id will
   * be created. Id should be able to be represented as a string.
   */
  constructor(id) {
    super(id);
    this._dispatcher = this;
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
    return {detail: value, type: message};
  }
}

// Assign Three.js EventDispatcher functionality to the Messenger class
Object.assign(Messenger.prototype, THREE.EventDispatcher.prototype);

Object.defineProperty(Messenger, 'GlobalMessenger', {
  value: new Messenger(),
  writable: false,
});

export default Messenger;
