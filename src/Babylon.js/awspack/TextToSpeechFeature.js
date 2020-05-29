// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractTextToSpeechFeature from 'core/awspack/AbstractTextToSpeechFeature';
import CoreTextToSpeechFeature from 'core/awspack/TextToSpeechFeature';

export default class TextToSpeechFeature extends CoreTextToSpeechFeature {
  /**
   * @private
   *
   * @param {HostObject} host - Host object managing the feature.
   * @param {Object=} options - Options that will be sent to Polly for each speech.
   * @param {string=} options.voice - The name of the Polly voice to use for all speech.
   * @param {string=} options.engine - The name of the Polly engine to use for all speech.
   * @param {string=} options.language - The name of the language to use for all speech.
   * @param {audioFormat} [options.audioFormat=mp3] - The format to use for generated
   * audio for all speeches.
   * @param {string=} options.sampleRate - The sample rate for audio files for all
   * speeches.
   * @param {BABYLON.Scene} options.scene - Babylon scene containing the host owner.
   * @param {BABYLON.Mesh=} options.attachTo - Optional mesh to attach the speech
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

  /**
   * Create a streaming Babylon.js audio object of speech audio for the given speech
   * text.
   *
   * @param {Object} params - Parameters object compatible with Polly.synthesizeSpeech.
   *
   * @returns {Promise} Resolves with an object containing the audio URL and Audio
   * objects.
   */
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
