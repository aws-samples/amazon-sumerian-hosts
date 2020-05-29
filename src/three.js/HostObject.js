// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreHostObject from 'core/HostObject';

export default class HostObject extends CoreHostObject {
  /**
   * @private
   *
   * @param {Object=} options - Options for the host.
   * @param {Object=} options.owner - Optional engine-specific owner of the host.
   * @param {THREE.Clock=} options.clock - Optional clock to manage time.
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
