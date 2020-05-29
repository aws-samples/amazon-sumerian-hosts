// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreSpeech from 'core/awspack/Speech';

export default class Speech extends CoreSpeech {
  /**
   * @private
   *
   * @param {TextToSpeech} speaker - The owner of the Speech that will emit speechmark
   * messages.
   * @param {string} text - The text of the speech.
   * @param {Array.<Object>} speechmarks - An array of speechmark objects representing
   * the text and timing of the speech.
   * @param {Object} audioConfig - Object containing audio and url.
   * @param {Audio} audioConfig.audio - Playable audio object.
   * @param {(THREE.Audio|THREE.PositionalAudio)} audioConfig.threeAudio - THREE
   * audio object.
   */
  constructor(textToSpeech, text, speechmarks = [], audioConfig) {
    super(textToSpeech, text, speechmarks, audioConfig);
    this._threeAudio = audioConfig.threeAudio;
  }

  /**
   * Gets the Three.js audio object for the speech.
   */
  get audio() {
    return this._threeAudio;
  }

  play(currentTime, onFinish, onError, onInterrupt) {
    // Re-connect the Audio element to stop playback
    this._threeAudio.disconnect();
    this._threeAudio.connect();

    return super.play(currentTime, onFinish, onError, onInterrupt);
  }
}
