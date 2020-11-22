// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreSpeech from 'core/awspack/Speech';
import AbstractSpeech from 'core/awspack/AbstractSpeech';

/**
 * @extends core/Speech
 * @alias Babylon.js/Speech
 */
class Speech extends CoreSpeech {
  /**
   * @constructor
   *
   * @param {Babylon.js/TextToSpeechFeature} speaker - The owner of the Speech
   * that will emit speechmark messages.
   * @param {string} text - The text of the speech.
   * @param {Array.<Object>} [speechmarks=[]] - An array of speechmark objects representing
   * the text and timing of the speech.
   * @param {Object} audioConfig - Object containing audio and url.
   * @param {external:Audio} audioConfig.audio - Playable audio object.
   */
  constructor(...args) {
    super(...args);

    this._audio.onEndedObservable.add(() => {
      this._audioFinished = true;
    });
  }

  _playAudio() {
    if (this._speechmarkOffset < 0) {
      this._audio.play(-this._speechmarkOffset / 1000);
    } else {
      this._audio.play();
    }
  }

  _pauseAudio() {
    this._audio.pause();
  }

  get volume() {
    return this._audio.getVolume();
  }

  set volume(volume) {
    this._audio.setVolume(volume);
  }

  play(currentTime, onFinish, onError, onInterrupt) {
    this._audio.stop();

    return super.play(currentTime, onFinish, onError, onInterrupt);
  }

  stop() {
    this._audio.stop();

    AbstractSpeech.prototype.stop.call(this);
  }
}

export default Speech;
