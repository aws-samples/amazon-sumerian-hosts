// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {LexFeature as CoreLexFeature} from '@amazon-sumerian-hosts/core';

/**
 * @extends core/LexFeature
 * @alias three.js/LexFeature
 */
class LexFeature extends CoreLexFeature {
  _setAudioContext() {
    this._audioContext = THREE.AudioContext.getContext();
  }
}

export default LexFeature;
