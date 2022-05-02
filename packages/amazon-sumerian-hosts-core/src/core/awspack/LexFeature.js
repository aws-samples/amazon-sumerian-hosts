// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Messenger from '../Messenger';
import Utils from '../Utils';
import LexUtils from './LexUtils';

/**
 * The AWS LexRuntime service object.
 * @external LexRuntime
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html
 */

/**
 * Feature class for interacting with Lex bot which the response from lex bot can be used for speech or other purpose.
 *
 * @extends core/Messenger
 * @alias core/LexFeature
 *
 * @property {Object} LEX_DEFAULTS - Default values to use with calls to {@link external:LexRuntime}.
 * @property {string} [LEX_DEFAULTS.SampleRate='16000']
 * @property {Object} EVENTS - Built-in messages that the feature emits.
 * @property {string} [EVENTS.lexResponseReady=lexResponseReady] - Message that is emitted after
 * receiving lex response for the input sent
 * @property {string} [EVENTS.micReady=micReady] - Message that is emitted after
 * microphone is ready to use
 * @property {string} [EVENTS.recordBegin=recordBegin] - Message that is emitted after
 * microphone starts recording
 * @property {string} [EVENTS.recordEnd=recordEnd] - Message that is emitted after
 * microphone ends recording
 */
class LexFeature extends Messenger {
  /**
   * @constructor
   *
   * @param {external:LexRuntime} lexRuntime - The LexRuntime service that is used
   * to interact with lex bot. Will be undefined until [initializeService]{@link LexFeature.initializeService}
   * has been successfully executed
   * @param {Object=} options - Options that will be used to interact with lex bot.
   * @param {string=} options.botName - The name of the lex bot.
   * @param {string=} options.botAlias - The alias of the lex bot.
   * @param {string=} options.userId - The userId used to keep track of the session with lex bot.
   */
  constructor(
    lexRuntime,
    options = {
      botName: undefined,
      botAlias: undefined,
      userId: undefined,
    }
  ) {
    super();

    if (!lexRuntime) {
      throw Error('Cannot initialize Lex feature. LexRuntime must be defined');
    }
    if (lexRuntime.config) {
      lexRuntime.config.customUserAgent = Utils.addCoreUserAgentComponent(
        lexRuntime.config.customUserAgent
      );
      lexRuntime.config.customUserAgent = Utils.addStringOnlyOnce(
        lexRuntime.config.customUserAgent,
        this.getEngineUserAgentString()
      );
    }
    this._lexRuntime = lexRuntime;

    this._botName = options.botName;
    this._botAlias = options.botAlias;
    this._userId = options.userId ? options.userId : Utils.createId();

    //Microphone related fields
    this._micReady = false;
    this._recording = false;
    this._recLength = 0;
    this._recBuffer = [];
    this._setupAudioContext();
  }

  /**
   * Setup audio context which will be used for setting up microphone related audio node
   */
  _setupAudioContext() {
    this._audioContext = new AudioContext();
  }

  /**
   * Sends audio input to Amazon Lex.
   *
   * @param {TypedArray} inputAudio - TypedArray view of the input audio buffer
   * @param {Number} sourceSampleRate - Sample rate of the input audio
   * @param {Object=} config - Optional config for overriding lex bot info
   * @param {string=} config.botName - The name of the lex bot.
   * @param {string=} config.botAlias - The alias of the lex bot.
   * @param {string=} config.userId - The userId used to keep track of the session with lex bot.
   *
   * @returns {Promise} A Promise-like object that resolves to a Lex response object.
   * For details on the structure of that response object see: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html#postContent-property
   */
  _processWithAudio(inputAudio, sourceSampleRate, config = {}) {
    const audio = this._prepareAudio(inputAudio, sourceSampleRate);
    return this._process('audio/x-l16; rate=16000', audio, config);
  }

  /**
   * Sends text user input to Amazon Lex.
   *
   * @param {String} inputText - Text to send to lex bot
   * @param {Object=} config - Optional config for overriding lex bot info
   * @param {string=} config.botName - The name of the lex bot.
   * @param {string=} config.botAlias - The alias of the lex bot.
   * @param {string=} config.userId - The userId used to keep track of the session with lex bot.
   *
   * @returns {Promise} A Promise-like object that resolves to a Lex response object.
   * For details on the structure of that response object see: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html#postContent-property
   */
  processWithText(inputText, config = {}) {
    return this._process('text/plain; charset=utf-8', inputText, config);
  }

  _process(contentType, inputStream, config) {
    const settings = this._validateConfig(config);
    const lexSettings = {
      botName: settings.botName,
      botAlias: settings.botAlias,
      contentType,
      inputStream,
      userId: settings.userId,
    };
    return new Promise((resolve, reject) => {
      this._lexRuntime.postContent(lexSettings, (error, data) => {
        if (error) {
          return reject(error);
        }
        return resolve(data);
      });
    }).then(data => {
      this.emit(this.constructor.EVENTS.lexResponseReady, data);

      return data;
    });
  }

  _validateConfig(config) {
    const settings = {};

    settings.botName = config.botName ? config.botName : this._botName;
    settings.botAlias = config.botAlias ? config.botAlias : this._botAlias;
    settings.userId = config.userId ? config.userId : this._userId;

    if (!settings.botName || !settings.botAlias || !settings.userId) {
      throw new Error(
        'Cannot process lex request. All arguments must be defined.'
      );
    }

    return settings;
  }

  _prepareAudio(audioBuffer, sourceSampleRate) {
    const downsampledAudio = LexUtils.downsampleAudio(
      audioBuffer,
      sourceSampleRate,
      this.constructor.LEX_DEFAULTS.SampleRate
    );
    const encodedAudio = LexUtils.encodeWAV(
      downsampledAudio,
      this.constructor.LEX_DEFAULTS.SampleRate
    );

    return new Blob([encodedAudio], {type: 'application/octet-stream'});
  }

  /**
   * Async function to setup microphone recorder which will get user permission for accessing microphone
   * This method must be called before attempting to record voice input with the
   * beginVoiceRecording() method. Expect an error to be thrown if the user has
   * chosen to block microphone access.
   *
   * @throws {DOMException} See the documentation for
   * [MediaDevices.getUserMedia()](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
   * The most likely error to expect will be the "NotAllowed" error indicating
   * the user has denied access to the microphone.
   */
  async enableMicInput() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });
    const source = this._audioContext.createMediaStreamSource(stream);
    //TODO: createScriptProcessor is deprecated which should be replaced
    const node = this._audioContext.createScriptProcessor(4096, 1, 1);

    node.onaudioprocess = e => {
      if (!this._recording) return;

      const buffer = e.inputBuffer.getChannelData(0);
      this._recBuffer.push(new Float32Array(buffer));
      this._recLength += buffer.length;
    };

    source.connect(node);
    node.connect(this._audioContext.destination);

    this.emit(this.constructor.EVENTS.micReady);
    this._micReady = true;
  }

  /**
   * Begin microphone recording. This function will also try to resume audioContext so that
   * it's suggested to call this function after a user interaction
   */
  beginVoiceRecording() {
    if (!this._micReady) {
      return;
    }

    if (
      this._audioContext.state === 'suspended' ||
      this._audioContext.state === 'interrupted'
    ) {
      this._audioContext.resume();
    }
    this._recLength = 0;
    this._recBuffer = [];
    this._recording = true;

    this.emit(this.constructor.EVENTS.recordBegin);
  }

  /**
   * Stop microphone recording and send recorded audio data to lex.
   *
   * @returns {Promise} A Promise-like object that resolves to a Lex response object.
   * For details on the structure of that response object see: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html#postContent-property
   */
  endVoiceRecording() {
    if (!this._recording) {
      return Promise.resolve();
    }

    this._recording = false;

    const result = new Float32Array(this._recLength);
    let offset = 0;
    for (let i = 0; i < this._recBuffer.length; i++) {
      result.set(this._recBuffer[i], offset);
      offset += this._recBuffer[i].length;
    }

    this.emit(this.constructor.EVENTS.recordEnd);

    return this._processWithAudio(result, this._audioContext.sampleRate);
  }

  /**
   *
   * @returns The useragent string for the engine you are using, e.g. 'babylonjs/5.1.0'
   */
  getEngineUserAgentString() {
    return 'UnknownEngine';
  }
}

Object.defineProperties(LexFeature, {
  LEX_DEFAULTS: {
    value: {
      SampleRate: '16000',
    },
    writable: false,
  },
  EVENTS: {
    value: {
      ...Object.getPrototypeOf(LexFeature).EVENTS,
      lexResponseReady: 'lexResponseReady',
      micReady: 'micReady',
      recordBegin: 'recordBegin',
      recordEnd: 'recordEnd',
    },
  },
});

export default LexFeature;
