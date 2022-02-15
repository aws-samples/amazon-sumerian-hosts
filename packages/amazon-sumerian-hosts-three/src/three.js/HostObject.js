// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Threejs Clock object
 *
 * @external "THREE.Clock"
 * @see https://threejs.org/docs/#api/en/core/Clock
 */

import CoreHostObject from '@amazon-sumerian-hosts/core';

/**
 * @alias three.js/HostObject
 * @extends core/HostObject
 */
class HostObject extends CoreHostObject {
  /**
   * @constructor
   *
   * @param {Object=} options - Options for the host.
   * @param {Object=} options.owner - Optional engine-specific owner of the host.
   * @param {external:"THREE.Clock"=} options.clock - Optional clock to manage time.
   */
  constructor(options = {}) {
    super(options);

    this._clock = options.clock;

    if (this._clock) {
      Object.defineProperty(this, 'now', {
        get: () => {
          return this._clock.getElapsedTime() * 1000;
        },
      });

      this._lastUpdate = this.now;
    }
  }
}

export default HostObject;
