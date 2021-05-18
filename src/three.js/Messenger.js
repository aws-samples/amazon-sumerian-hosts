// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreMessenger from 'core/Messenger';

/**
 * @extends core/Messenger
 * @alias three.js/Messenger
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
    this._dispatcher = this;
  }

  _createEvent(message, value) {
    return {detail: value, type: message};
  }
}

// Assign Three.js EventDispatcher functionality to the Messenger class
Object.getOwnPropertyNames(THREE.EventDispatcher.prototype)
  .filter(prop => prop !== 'constructor')
  .forEach(prop => {
    Messenger.prototype[prop] = THREE.EventDispatcher.prototype[prop];
  });

Object.defineProperty(Messenger, 'GlobalMessenger', {
  value: new Messenger(),
  writable: false,
});

export default Messenger;
