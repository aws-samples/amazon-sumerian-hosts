// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {LexFeature as CoreLexFeature} from '@amazon-sumerian-hosts/core';

/**
 * @extends core/LexFeature
 * @alias threejs/LexFeature
 */
class LexFeature extends CoreLexFeature {
  /**
   * Setup audio context
   * @override
   */
  _setupAudioContext() {
    this._audioContext = THREE.AudioContext.getContext();
  }
}

export default LexFeature;
