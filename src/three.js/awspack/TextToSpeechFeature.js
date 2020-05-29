// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreTextToSpeechFeature from 'core/awspack/TextToSpeechFeature';

/**
 * Threejs PositionalAudio object
 * @external "THREE.AudioListener"
 * @see https://threejs.org/docs/#api/en/audio/AudioListener
 */

/**
 * Threejs Audio object
 * @external "THREE.Object3D"
 * @see https://threejs.org/docs/#api/en/core/Object3D
 */

/**
 * @extends core/TextToSpeechFeature
 * @alias three.js/TextToSpeechFeature
 */
class TextToSpeechFeature extends CoreTextToSpeechFeature {
  /**
   * @constructor
   *
   * @param {three/HostObject} host - Host object managing the feature.
   * @param {Object=} options - Options that will be sent to Polly for each speech.
   * @param {external:"THREE.AudioListener"} options.listener - Three audio listener to use with
   * audio.
   * @param {external:"THREE.Object3D"=} options.attachTo - Optional object to attach the speech
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
   * @private
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

export default TextToSpeechFeature;
