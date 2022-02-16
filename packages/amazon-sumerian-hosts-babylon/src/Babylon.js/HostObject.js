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
  }

  get now() {
    return BABYLON.PrecisionDate.Now;
  }
}

export default HostObject;
