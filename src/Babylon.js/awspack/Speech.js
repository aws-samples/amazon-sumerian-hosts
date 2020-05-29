// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreSpeech from 'core/awspack/Speech';

export default class Speech extends CoreSpeech {
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

  /**
   * Gets the audio volume for the speech.
   */
  get volume() {
    return this._audio.getVolume();
  }

  /**
   * Sets the audio volume for the speech.
   */
  set volume(volume) {
    this._audio.setVolume(volume);
  }

  play(currentTime, onFinish, onError, onInterrupt) {
    this._audio.stop();

    return super.play(currentTime, onFinish, onError, onInterrupt);
  }

  stop() {
    this._audio.stop();

    super.stop();
  }
}
