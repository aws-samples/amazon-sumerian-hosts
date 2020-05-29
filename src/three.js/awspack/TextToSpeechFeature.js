// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
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
   * each speech audio URL to expire.
   * @param {THREE.AudioListener} options.listener - Three audio listener to use with
   * audio.
   * @param {THREE.Object3D=} options.attachTo - Optional object to attach the speech
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
      listener: undefined,
      attachTo: undefined,
    }
  ) {
    super(host, options);
    this._listener = options.listener;
    this._attachTo = options.attachTo || host.owner;
    this._setAudioContext();
    this._observeAudioContext();
  }

  _setAudioContext() {
    if (this._listener) {
      this._audioContext = this._listener.context;
    }
  }

  /**
   * Create an Audio object and Three.js audio object of speech audio for the
   * given speech text.
   *
   * @param {Object} params - Parameters object compatible with Polly.synthesizeSpeech.
   *
   * @returns {Promise} Resolves with an object containing the audio URL and Audio
   * objects.
   */
  _synthesizeAudio(params) {
    return super._synthesizeAudio(params).then(result => {
      if (this._attachTo !== undefined) {
        // Create positional audio if there's an attach point
        result.threeAudio = new THREE.PositionalAudio(this._listener);
        this._attachTo.add(result.threeAudio);
      } else {
        // Create non-positional audio
        result.threeAudio = new THREE.Audio(this._listener);
      }

      // Set Audio object as the source
      result.threeAudio.setMediaElementSource(result.audio);

      return result;
    });
  }
}
