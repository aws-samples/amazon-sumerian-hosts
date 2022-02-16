// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {
  AnimationFeature as CoreAnimationFeature,
  AnimationTypes,
} from '@amazon-sumerian-hosts/core';
import SingleState from './state/SingleState';

AnimationTypes.single = SingleState;
export {AnimationTypes};

/**
 * @extends core/AnimationFeature
 * @alias babylonjs/AnimationFeature
 */
class AnimationFeature extends CoreAnimationFeature {
  /**
   * @constructor
   *
   * @param {babylonjs/HostObject} host - Host object that owns the feature.
   */
  constructor(host) {
    super(host);

    this._babylonScene = host.owner.getScene();
  }

  _createSingleState(options) {
    return new SingleState(options, options.clip, this._babylonScene);
  }

  discard() {
    delete this._babylonScene;

    super.discard();
  }
}

export default AnimationFeature;
