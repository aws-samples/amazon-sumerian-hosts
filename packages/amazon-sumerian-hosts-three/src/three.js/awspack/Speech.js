// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {Speech as CoreSpeech} from '@amazon-sumerian-hosts/core';

/**
 * Threejs Audio object
 * @external "THREE.Audio"
 * @see https://threejs.org/docs/#api/en/audio/Audio
 */

/**
 * Threejs PositionalAudio object
 * @external "THREE.PositionalAudio"
 * @see https://threejs.org/docs/#api/en/audio/PositionalAudio
 */

/**
 * @extends core/Speech
 * @alias threejs/Speech
 */
class Speech extends CoreSpeech {
  /**
   * @constructor
   *
   * @param {threejs/TextToSpeechFeature} speaker - The owner of the Speech that
   * will emit speechmark messages.
   * @param {string} text - The text of the speech.
   * @param {Array.<Object>} speechmarks - An array of speechmark objects representing
   * the text and timing of the speech.
   * @param {Object} audioConfig - Object containing audio and url.
   * @param {external:Audio} audioConfig.audio - Playable audio object.
   * @param {(external:"THREE.Audio"|external:"THREE.PositionalAudio")} audioConfig.threeAudio -
   * Three.js audio object.
   */
  constructor(textToSpeech, text, speechmarks = [], audioConfig) {
    super(textToSpeech, text, speechmarks, audioConfig);
    this._threeAudio = audioConfig.threeAudio;
  }

  /**
   * Gets the Three.js audio object for the speech.
   *
   * @readonly
   * @type {(external:"THREE.Audio"|external:"THREE.PositionalAudio")}
   */
  get audio() {
    return this._threeAudio;
  }

  _pauseAudio() {
    this._audio.pause();
  }

  play(currentTime, onFinish, onError, onInterrupt) {
    // Re-connect the Audio element to stop playback
    this._threeAudio.disconnect();
    this._threeAudio.connect();

    return super.play(currentTime, onFinish, onError, onInterrupt);
  }
}

export default Speech;
