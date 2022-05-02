// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {LexFeature as CoreLexFeature} from '@amazon-sumerian-hosts/core';
import {Engine} from '@babylonjs/core/Engines/engine';
import '@babylonjs/core/Audio/audioSceneComponent';
import '@babylonjs/core/Audio/audioEngine';

/**
 * @extends core/LexFeature
 * @alias babylonjs/LexFeature
 */
class LexFeature extends CoreLexFeature {
  /**
   * Setup audio context
   * @override
   */
  _setupAudioContext() {
    this._audioContext = Engine.audioEngine.audioContext;
  }

  getEngineUserAgentString() {
    // looks like babylonjs@4.2.2
    return Engine.NpmPackage;
  }
}

export default LexFeature;
