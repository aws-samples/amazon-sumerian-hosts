// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractTextToSpeechFeature from 'core/awspack/AbstractTextToSpeechFeature';
import CoreTextToSpeechFeature from 'core/awspack/TextToSpeechFeature';

/**
 * Babylonjs Scene object
 * @external "BABYLON.Scene"
 * @see https://doc.babylonjs.com/api/classes/babylon.scene
 */

/**
 * Babylonjs Mesh object
 * @external "BABYLON.Mesh"
 * @see https://doc.babylonjs.com/api/classes/babylon.mesh
 */

/**
 * @extends core/TextToSpeechFeature
 * @alias Babylon.js/TextToSpeechFeature
 */
class TextToSpeechFeature extends CoreTextToSpeechFeature {
  /**
   * @constructor
   *
   * @param {Babylon.js/HostObject} host - Host object managing the feature.
   * @param {Object=} options - Options that will be sent to Polly for each speech.
   * @param {external:"BABYLON.Scene"} options.scene - Babylon scene containing the host owner.
   * @param {external:"BABYLON.Mesh"=} options.attachTo - Optional mesh to attach the speech
   * audio to.
   */
  constructor(
    host,
    options = {
      voice: undefined,
      engine: undefined,
      language: undefined,
      audioFormat: 'mp3',
      sampleRate: undefined,
      scene: undefined,
      attachTo: undefined,
    }
  ) {
    super(host, options);
    this._scene = options.scene;
    this._attachTo = options.attachTo || host.owner;
  }

  _setAudioContext() {
    this._audioContext = BABYLON.Engine.audioEngine.audioContext;
  }

  _observeAudioContext() {
    if (this._audioContext) {
      super._observeAudioContext();
      const {onstatechange} = this._audioContext;
      this._audioContext.onstatechange = () => {
        onstatechange();

        if (this._enabled) {
          BABYLON.Engine.audioEngine.unlock();
        }
      };
    }
  }

  _synthesizeAudio(params) {
    // Babylon audio will create the web Audio object, so we don't need coreAws.TextToSpeechFeature
    // to create it. Use AbstractTextToSpeechFeature.prototype._synthesizeAudio instead.
    // eslint-disable-next-line no-underscore-dangle
    return AbstractTextToSpeechFeature.prototype._synthesizeAudio
      .call(this, params)
      .then(result => {
        return new Promise(resolve => {
          const {url} = result;
          const name = params.Text;
          result.audio = new BABYLON.Sound(
            name,
            url,
            this._scene,
            () => {
              resolve(result);
            },
            {streaming: true, skipCodecCheck: true}
          );

          if (this._attachTo !== undefined) {
            result.audio.attachToMesh(this._attachTo);
          }
        });
      });
  }
}

export default TextToSpeechFeature;
