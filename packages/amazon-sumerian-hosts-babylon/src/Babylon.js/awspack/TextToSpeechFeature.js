// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {
  AbstractTextToSpeechFeature,
  TextToSpeechFeature as CoreTextToSpeechFeature,
} from '@amazon-sumerian-hosts/core';
import {Sound} from '@babylonjs/core/Audio/sound';
import {Engine} from '@babylonjs/core/Engines/engine';
import '@babylonjs/core/Audio/audioEngine';
import Speech from './Speech';

/**
 * @extends core/TextToSpeechFeature
 * @alias babylonjs/TextToSpeechFeature
 */
class TextToSpeechFeature extends CoreTextToSpeechFeature {
  /**
   * @constructor
   *
   * @param {babylonjs/HostObject} host - Host object managing the feature.
   * @param {Object=} options - Options that will be sent to Polly for each speech.
   * @param {Scene} options.scene - Babylon scene containing the host owner.
   * @param {Mesh=} options.attachTo - Optional mesh to attach the speech
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
    this._audioContext = Engine.audioEngine.audioContext;
  }

  _observeAudioContext() {
    if (this._audioContext) {
      super._observeAudioContext();
      const {onstatechange} = this._audioContext;
      this._audioContext.onstatechange = () => {
        onstatechange();

        if (this._enabled) {
          Engine.audioEngine.unlock();
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
          result.audio = new Sound(
            name,
            url,
            this._scene,
            () => {
              resolve(result);
            },
            {streaming: true, skipCodecCheck: true}
          );

          if (this._attachTo !== undefined && !this._isGlobal) {
            result.audio.attachToMesh(this._attachTo);
          }
        });
      });
  }

  _createSpeech(text, speechmarks, audioConfig) {
    return new Speech(this, text, speechmarks, audioConfig);
  }

  getEngineUserAgentString() {
    // looks like babylonjs@4.2.2
    return Engine.NpmPackage;
  }
}

export default TextToSpeechFeature;
