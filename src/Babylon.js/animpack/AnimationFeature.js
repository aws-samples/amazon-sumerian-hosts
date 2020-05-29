// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreAnimationFeature, {AnimationTypes} from 'core/animpack/AnimationFeature';
import SingleState from './state/SingleState';

export {AnimationTypes};

export default class AnimationFeature extends CoreAnimationFeature {
  /**
   * @private
   *
   * @param {HostObject} host - Host object that owns the feature.
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
