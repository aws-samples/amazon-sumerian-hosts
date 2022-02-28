// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {
  AnimationFeature as CoreAnimationFeature,
  AnimationTypes,
} from '@amazon-sumerian-hosts/core';
import SingleState from './state/SingleState';

/**
 * Threejs AnimationMixer object
 * @external "THREE.AnimationMixer"
 * @see https://threejs.org/docs/#api/en/animation/AnimationMixer
 */
AnimationTypes.single = SingleState;

/**
 * @extends core/AnimationFeature
 * @alias threejs/AnimationFeature
 */
class AnimationFeature extends CoreAnimationFeature {
  /**
   * @constructor
   *
   * @param {threejs/HostObject} host - Host object that owns the feature.
   */
  constructor(host) {
    super(host);

    this._mixer = new THREE.AnimationMixer(host.owner);
  }

  _createSingleState(options) {
    // Duplicate the clip if it is already in use by another three action
    let {clip} = options;
    if (this._mixer.existingAction(clip)) {
      clip = clip.clone();
    }

    const threeAction = this._mixer.clipAction(clip);
    return new SingleState(options, threeAction);
  }

  /**
   * Gets the THREE.AnimationMixer for the host.
   *
   * @readonly
   * @type {external:"THREE.AnimationMixer"}
   */
  get mixer() {
    return this._mixer;
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (!this._paused) {
      this._mixer.update(deltaTime / 1000); // THREE.AnimationMixer requires delta time in seconds
    }
  }

  discard() {
    // Release THREE animation resources
    this._mixer.uncacheRoot(this._host.owner);

    super.discard();
  }
}
export {AnimationTypes};
export default AnimationFeature;
