// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractSpeech from './AbstractSpeech';

/**
 * The built-in class for asynchronous Promises.
 * @external Audio
 * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement/Audio
 */

/**
 * @extends AbstractSpeech
 * @alias core/Speech
 */
class Speech extends AbstractSpeech {
  /**
   * @constructor
   *
   * @param {TextToSpeech} speaker - The owner of the Speech that will emit speechmark
   * messages.
   * @param {string} text - The text of the speech.
   * @param {Array.<Object>} [speechmarks=[]] - An array of speechmark objects representing
   * the text and timing of the speech.
   * @param {Object} audioConfig - Object containing audio and url.
   * @param {external:Audio} audioConfig.audio - Playable audio object.
   */
  constructor(speaker, text, speechmarks = [], audioConfig) {
    super(speaker, text, speechmarks);
    this._audio = audioConfig.audio;

    // Keep track of whether the audio has finished playing through
    this._audio.onended = () => {
      this._audioFinished = true;
    };
    this._audioFinished = true;
  }

  _checkFinished() {
    return this._audioFinished && super._checkFinished();
  }

  /**
   * Gets the playable audio for the speech.
   *
   * @readonly
   * @type {external:Audio}
   */
  get audio() {
    return this._audio;
  }

  /**
   * Gets the audio volume for the speech.
   *
   * @type {number}
   */
  get volume() {
    return this._audio.volume;
  }

  /**
   * Sets the audio volume for the speech.
   */
  set volume(volume) {
    this._audio.volume = volume;
  }

  /**
   * Set the audio's current local time and play it.
   *
   * @private
   */
  _playAudio() {
    if (this._speechmarkOffset < 0) {
      this._audio.currentTime = this._speechmarkOffset;
      setTimeout(() => {
        if (this._playing) {
          this._audio.currentTime =
            (this._localTime + this._speechmarkOffset) / 1000;
          this._audio.play();
        }
      }, -this._speechmarkOffset);
    } else {
      this._audio.currentTime = 0;
      this._audio.play();
    }
  }

  /**
   * Pause the audio once it is playable.
   *
   * @private
   */
  _pauseAudio() {
    this._audio.play().then(() => {
      if (!this._playing) {
        this._audio.pause();
      }
    });
  }

  play(currentTime, onFinish, onError, onInterrupt) {
    this._audioFinished = false;
    this._playAudio();

    return super.play(currentTime, onFinish, onError, onInterrupt);
  }

  pause(currentTime) {
    this._pauseAudio();
    super.pause(currentTime);
  }

  resume(currentTime, onFinish, onError, onInterrupt) {
    this._audioFinished = false;
    this._audio.play();

    return super.resume(currentTime, onFinish, onError, onInterrupt);
  }

  cancel() {
    this._pauseAudio();
    super.cancel();
  }

  stop() {
    this._pauseAudio();
    this._audio.currentTime = 0;
    super.stop();
  }
}

export default Speech;
