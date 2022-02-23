// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {LexFeature as CoreLexFeature} from '@amazon-sumerian-hosts/core';

/**
 * @extends core/LexFeature
 * @alias Babylon.js/LexFeature
 */
class LexFeature extends CoreLexFeature {
  _setAudioContext() {
    this._audioContext = BABYLON.Engine.audioEngine.audioContext;
  }
}

export default LexFeature;
