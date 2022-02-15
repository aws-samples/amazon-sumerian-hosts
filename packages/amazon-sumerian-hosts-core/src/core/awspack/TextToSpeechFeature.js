// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Speech from './Speech';
import Deferred from '../Deferred';
import AbstractTextToSpeechFeature from './AbstractTextToSpeechFeature';

/**
 * @extends AbstractTextToSpeechFeature
 * @alias core/TextToSpeechFeature
 */
class TextToSpeechFeature extends AbstractTextToSpeechFeature {
  constructor(...args) {
    super(...args);

    this._enabled = false;
    this._setAudioContext();
    this._observeAudioContext();
  }

  /**
   * Store the audio context that will be used to ensure audio can be played.
   *
   * @private
   */
  _setAudioContext() {
    this._audioContext = new AudioContext();
  }

  /**
   * Listen for state changes on the audio context to determine whether the feature
   * is enabled.
   *
   * @private
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
   * Create an Audio object of speech audio for the given speech text.
   *
   * @private
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
   * Create a new Speech object for the speaker.
   *
   * @private
   *
   * @param {TextToSpeech} speaker - The TextToSpeech instance that will own the speech.
   * @param {string} text - Text of the speech.
   * @param {Object} speechmarks - Speechmarks for the speech.
   * @param {Object} audioConfig - Audio for the speech.
   *
   * @returns {AbstractSpeech}
   */
  _createSpeech(text, speechmarks, audioConfig) {
    return new Speech(this, text, speechmarks, audioConfig);
  }

  /**
   * Gets whether or not the audio context is running and speech can be played.
   *
   * @readonly
   * @type {boolean}
   */
  get enabled() {
    return this._enabled;
  }

  /**
   * Try to resume the audio context. This will be automatically executed each time
   * speech is played or resumed. If using manually, it should be called after a
   * user interaction occurs.
   *
   * @returns {Deferred} - Resolves once the audio context has resumed.
   */
  resumeAudio() {
    const promise = new Deferred((resolve, reject) => {
      this._audioContext
        .resume()
        .then(() => {
          this._enabled = true;
          resolve();
        })
        .catch(e => {
          this._enabled = false;
          reject(e);
        });
    });
    return promise;
  }

  _startSpeech(text, config, playMethod = 'play') {
    const currentPromise = {
      play: new Deferred(
        undefined,
        () => {
          currentPromise.speech.cancel();
        },
        () => {
          currentPromise.speech.cancel();
        },
        () => {
          currentPromise.speech.cancel();
        }
      ),
      speech: new Deferred(),
    };
    this._currentPromise = currentPromise;

    // Try to start the audio context
    this.resumeAudio().then(() => {
      // Exit if the promise is no longer pending because of user interaction
      if (!currentPromise.play.pending) {
        return;
      }
      // Cancel if another call to play has already been made
      else if (this._currentPromise !== currentPromise) {
        currentPromise.play.cancel();
        return;
      }

      // The audio context is running so the speech can be played
      if (this._enabled) {
        super._startSpeech(text, config, playMethod);
      }
      // Reject if the audio context is not running
      else {
        currentPromise.reject(
          new Error(
            `Cannot ${playMethod} speech on host ${this._host.id}. The audio context is not running. Use the "TextToSpeechFeature.resumeAudio" method to try to resume it after a user gesture.`
          )
        );
      }
    });

    return currentPromise.play;
  }

  play(text, config) {
    return this._startSpeech(text, config, 'play');
  }

  resume(text, config) {
    return this._startSpeech(text, config, 'resume');
  }

  installApi() {
    const api = super.installApi();

    Object.defineProperties(api, {
      /**
       * @memberof TextToSpeechFeature
       * @instance
       * @see core/TextToSpeechFeature#enabled
       */
      enabled: {
        get: () => this._enabled,
      },
    });

    return api;
  }
}

export default TextToSpeechFeature;
