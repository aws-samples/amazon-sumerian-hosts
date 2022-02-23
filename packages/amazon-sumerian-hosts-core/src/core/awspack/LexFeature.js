// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Deferred from 'core/Deferred';
import Utils from 'core/Utils';
import LexUtils from 'core/awspack/LexUtils';

/**
 * The AWS LexRuntime service object.
 * @external LexRuntime
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html
 */

/**
 * Feature class for interacting with Lex bot which the response from lex bot can be used for speech or other purpose.
 *
 * @property {Object} LEX_DEFAULTS - Default values to use with calls to {@link external:LexRuntime}.
 * @property {string} [LEX_DEFAULTS.SampleRate='16000']
 * @property {Object} EVENTS - Built-in messages that the feature emits.
 * @property {string} [EVENTS.lexResponse=onLexResponseEvent] - Message that is emitted after
 * receiving lex response for the input sent
 * @property {string} [EVENTS.micReady=onMicrophoneReadyEvent] - Message that is emitted after
 * microphone is ready to use
 * @property {string} [EVENTS.micReady=onMicrophoneBeginRecordingEvent] - Message that is emitted after
 * microphone starts recording
 * @property {string} [EVENTS.micReady=onMicrophoneEndRecordingEvent] - Message that is emitted after
 * microphone ends recording
 * @property {Object} SERVICES - AWS services that are necessary for the feature
 * to function.
 * @property {external:LexRuntime} SERVICES.lexRuntime - The LexRuntime service that is used
 * to interact with lex bot. Will be undefined until [initializeService]{@link LexFeature.initializeService}
 * has been successfully executed
 */
class LexFeature{
  /**
   * @constructor
   *
   * @param {Messenger=} messenger - Optional Messenger object which the event will be emitted through
   * @param {Object=} options - Options that will be used to interact with lex bot.
   * @param {string=} options.botName - The name of the lex bot.
   * @param {string=} options.botAlias - The alias of the lex bot.
   * @param {string=} options.userId - The userId used to keep track of the session with lex bot. 
  */
  constructor(
    messenger = undefined,
    options = {
      botName: undefined,
      botAlias: undefined,
      userId: undefined,
    }
  ) {
    this._messenger = messenger;

    this._botName = options.botName;
    this._botAlias = options.botAlias;
    this._userId = options.userId ? options.userId : Utils.createId();

    //Microphone related fields
    this._recording = false;
    this._recLength = 0;
    this._recBuffer = [];
    this._setAudioContext();
  }

  /**
   * Store LexRuntime and AWS SDK Version for use across all instances.
   *
   * @param {external:LexRuntime} lexRuntime - lexRuntime instance to use to interact with lex bot.
   */
  static initializeService(lexRuntime) {
    // Make sure all were defined
    if (lexRuntime === undefined)
    {
      throw new Error(
        'Cannot initialize Lex feature. LexRuntime must be defined'
      );
    }

    // Add sumerian hosts user-agent
    if (lexRuntime.config) {
      lexRuntime.config.customUserAgent = Utils.withCustomUserAgent(
        lexRuntime.config.customUserAgent
      );
    }

    // Store parameters
    this.SERVICES.lexRuntime = lexRuntime;
  }

  _setAudioContext() {
    AudioContext = window.AudioContext || window.webkitAudioContext;
    this._audioContext = new AudioContext();
  }

  /**
   * Sends audio user input to Amazon Lex.
   *
   * @param {Float32Array} inputAudio - Input audio buffer
   * @param {float} sourceSampleRate - Sample rate of input audio 
   * @param {Object=} config - Optional config for overriding lex bot info
   * @param {string=} config.botName - The name of the lex bot.
   * @param {string=} config.botAlias - The alias of the lex bot.
   * @param {string=} config.userId - The userId used to keep track of the session with lex bot. 
   * 
   * @returns {Deferred} A Promise-like object that resolves to a Lex response object. 
   * For details on the structure of that response object see: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html#postContent-property
   */
  processWithAudio(inputAudio, sourceSampleRate, config = {}) {
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
   * @returns {Deferred} A Promise-like object that resolves to a Lex response object. 
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
      userId: settings.userId
    };
    return new Deferred((resolve, reject) => {
      this.constructor.SERVICES.lexRuntime.postContent(lexSettings, (error, data) => {
        if (error) {
          return reject(error);
        }
        return resolve(data);
      });
    }).then(data => {
      if (!data.message) {
        if (data.encodedMessage) {
          data.message = atob(data.encodedMessage);
        }
        else {
          data.message = '';
        }
      }

      if (this._messenger && this._messenger.emit) {
        this._messenger.emit(this.constructor.EVENTS.lexResponse, data);
      }

      return data;
    });
  }

  _validateConfig(config) {
    let settings = {};

    settings.botName = config.botName ? config.botName : this._botName;
    settings.botAlias = config.botAlias ? config.botAlias : this._botAlias;
    settings.userId = config.userId ? config.userId : this._userId;

    if (
      settings.botName == undefined ||
      settings.botAlias == undefined ||
      settings.userId == undefined
    )
    {
      throw new Error(
        'Cannot process lex request. All arguments must be defined.'
      );
    }

    return settings;
  }

  _prepareAudio(audioBuffer, sourceSampleRate) {
    const downsampledAudio = LexUtils.downsampleAudio(audioBuffer, sourceSampleRate, this.constructor.LEX_DEFAULTS.SampleRate);
    const encodedAudio = LexUtils.encodeWAV(downsampledAudio, this.constructor.LEX_DEFAULTS.SampleRate);

    return new Blob([encodedAudio], {type: 'application/octet-stream'});
  }

  /**
   * Setup microphone recorder which will get user permission for accessing microphone
   * 
   * @returns {Promise} A Promise-like object that resolves after getting permission from accessing microphone. 
   */
  enableMicInput() {
    return navigator.mediaDevices.getUserMedia({audio: true, video: false})
      .then(stream => {
        const source = this._audioContext.createMediaStreamSource(stream);
        const node = this._audioContext.createScriptProcessor(4096, 1, 1);

        node.onaudioprocess = (e) => {
            if (!this._recording) return;

            const buffer = e.inputBuffer.getChannelData(0);
            this._recBuffer.push(new Float32Array(buffer));
            this._recLength += buffer.length;
        };

        source.connect(node);
        node.connect(this._audioContext.destination);

        if (this._messenger && this._messenger.emit) {
          this._messenger.emit(this.constructor.EVENTS.micReady);
        }
      }).catch(function(err) {
        console.warn("Cannot setup microphone: " + err.message);
      });
  }

  /**
   * Begin microphone recording. This function will also try to resume audioContext so that
   * it's suggested to call this function after a user interaction
   */
  beginVoiceRecording() {
    if(this._audioContext.state === 'suspended') {
      this._audioContext.resume();
    }
    this._recLength = 0;
    this._recBuffer = [];
    this._recording = true;

    if (this._messenger && this._messenger.emit) {
      this._messenger.emit(this.constructor.EVENTS.recordBegin);
    }
  }

  /**
   * Stop microphone recording and send recorded audio data to lex.
   * 
   * @returns {Deferred} A Promise-like object that resolves to a Lex response object. 
   * For details on the structure of that response object see: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html#postContent-property
   */
  endVoiceRecording() {
    this._recording = false;

    const result = new Float32Array(this._recLength);
    let offset = 0;
    for (let i = 0; i < this._recBuffer.length; i++) {
        result.set(this._recBuffer[i], offset);
        offset += this._recBuffer[i].length;
    }

    if (this._messenger && this._messenger.emit) {
      this._messenger.emit(this.constructor.EVENTS.recordEnd);
    }
    return this.processWithAudio(
      result,
      this._audioContext.sampleRate
    );
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
      lexResponse: 'onLexResponseEvent',
      micReady: 'onMicrophoneReadyEvent',
      recordBegin: 'onMicrophoneBeginRecordingEvent',
      recordEnd: 'onMicrophoneEndRecordingEvent',
    },
  },
  SERVICES: {
    value: {
      ...Object.getPrototypeOf(LexFeature).SERVICES,
      lexRuntime: undefined,
    },
  },
});

export default LexFeature;