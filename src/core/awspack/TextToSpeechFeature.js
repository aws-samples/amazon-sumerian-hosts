// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Speech from 'app/awspack/Speech';
import Deferred from 'core/Deferred';
import AbstractTextToSpeechFeature from './AbstractTextToSpeechFeature';

export default class TextToSpeechFeature extends AbstractTextToSpeechFeature {
  constructor(...args) {
    super(...args);

    this._enabled = false;
    this._setAudioContext();
    this._observeAudioContext();
  }

  /**
   * @private
   *
   * Store the audio context that will be used to ensure audio can be played.
   */
  _setAudioContext() {
    this._audioContext = new AudioContext();
  }

  /**
   * @private
   *
   * Listen for state changes on the audio context to determine whether the feature
   * is enabled.
   */
  _observeAudioContext() {
    if (this._audioContext) {
      this._audioContext.onstatechange = () => {
        if (this._audioContext.state === 'running') {
          this._enabled = true;
        } else {
          this._enabled = false;
          console.warn(
            'The audio context is not running. Speech will not be able to be played until it is resumed. Use the "TextToSpeechFeature.resumeAudio" method to try to resume it after a user gesture.'
          );
        }
      };

      this._audioContext.onstatechange();
    }
  }

  /**
   * @private
   *
   * Create an Audio object of speech audio for the given speech text.
   *
   * @param {Object} params - Parameters object compatible with Polly.synthesizeSpeech.
   *
   * @returns {Promise} Resolves with an object containing the audio URL and Audio
   * object.
   */
  _synthesizeAudio(params) {
    return super._synthesizeAudio(params).then(result => {
      const {url} = result;

      // Create an Audio object that points to the presigned url
      const audio = new Audio(url);
      audio.loop = this.loop;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      result.audio = audio;

      return new Promise(resolve => {
        // Resolve once the minimum amount is loaded
        audio.addEventListener('canplaythrough', () => {
          resolve(result);
        });

        // Start loading the audio
        document.body.appendChild(audio);
        audio.load();
      });
    });
  }

  /**
   * @private
   *
   * Create a new Speech object for the speaker.
   *
   * @param {TextToSpeech} speaker - The TextToSpeech instance that will own the speech.
   * @param {string} text - Text of the speech.
   * @param {Object} speechmarks - Speechmarks for the speech.
   * @param {Object} audioConfig - Audio for the speech.
   *
   * @returns {Speech}
   */
  _createSpeech(text, speechmarks, audioConfig) {
    return new Speech(this, text, speechmarks, audioConfig);
  }

  /**
   * Gets whether or not the audio context is running and speech can be played.
   */
  get enabled() {
    return this._enabled;
  }

  /**
   * Try to resume the audio context. This will be automatically each time speech
   * is played. If using manually, it should be called after a user interaction
   * occurs.
   *
   * @returns {Deferred}
   */
  resumeAudio() {
    const promise = new Deferred((resolve, reject) => {
      this._audioContext
        .resume()
        .then(() => {
          this._enabled = true;
          resolve(promise.canceled);
        })
        .catch(e => {
          reject(e);
        });
    });
    return promise;
  }

  play(...args) {
    // Try to start the audio context
    const promise = this.resumeAudio();

    return promise.then(() => {
      if (!promise.canceled && this._enabled) {
        // Cancel the currently playing speech
        if (this._currentSpeech && this._currentSpeech.playing) {
          this._currentSpeech.cancel();
        }

        return super.play(...args);
      } else {
        return Promise.reject(
          new Error(
            `Cannot play speech on host ${this._host.id}. The audio context is not running. Use the "TextToSpeechFeature.resumeAudio" method to try to resume it after a user gesture.`
          )
        );
      }
    });
  }

  resume(...args) {
    // Try to start the audio context
    const promise = this.resumeAudio();

    return promise.then(() => {
      if (!promise.canceled && this._enabled) {
        // Cancel the currently playing speech
        if (this._currentSpeech && this._currentSpeech.playing) {
          this._currentSpeech.cancel();
        }
        return super.resume(...args);
      } else {
        return Promise.reject(
          new Error(
            `Cannot resume speech on host ${this._host.id}. The audio context is not running. Use the "TextToSpeechFeature.resumeAudio" method to try to resume it after a user gesture.`
          )
        );
      }
    });
  }

  installApi() {
    const api = super.installApi();

    Object.defineProperty(api, 'enabled', {
      get: () => this._enabled,
    });

    return api;
  }
}
