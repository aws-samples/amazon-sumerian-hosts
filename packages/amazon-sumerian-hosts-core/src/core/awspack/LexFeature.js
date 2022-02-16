// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractHostFeature from 'core/AbstractHostFeature';
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
 * @extends AbstractHostFeature
 *
 * @property {(number|undefined)} AWS_VERSION - Gets the version of AWS SDK being
 * used. Will be undefined until [initializeService]{@link LexFeature.initializeService}
 * has been successfully executed.
 * @property {Object} LEX_DEFAULTS - Default values to use with calls to {@link external:LexRuntime}.
 * @property {string} [LEX_DEFAULTS.SampleRate='16000']
 * @property {Object} EVENTS - Built-in messages that the feature emits. When the
 * feature is added to a {@link core/HostObject}, event names will be prefixed by the
 * name of the feature class + '.'.
 * @property {string} [EVENTS.response=onLexResponseEvent] - Message that is emitted after
 * receiving lex response for the input sent
 * @property {Object} SERVICES - AWS services that are necessary for the feature
 * to function.
 * @property {external:LexRuntime} SERVICES.lexRuntime - The LexRuntime service that is used
 * to interact with lex bot. Will be undefined until [initializeService]{@link LexFeature.initializeService}
 * has been successfully executed
 */
class LexFeature extends AbstractHostFeature {
  /**
   * @constructor
   *
   * @param {core/HostObject} host - Host object managing the feature.
   * @param {Object} options - Options that will be used to interact with lex bot.
   * @param {string} options.botName - The name of the lex bot.
   * @param {string} options.botAlias - The alias of the lex bot.
   * @param {string} options.userId - The userId used to keep track of the session with lex bot. 
  */
  constructor(
    host,
    options = {
      botName: undefined,
      botAlias: undefined,
      userId: undefined,
    }
  ) {
    super(host);

    this._botName = options.botName;
    this._botAlias = options.botAlias;
    this._userId = options.userId ? options.userId : Utils.createId();
  }

  /**
   * Store LexRuntime and AWS SDK Version for use across all instances.
   *
   * @param {external:LexRuntime} lexRuntime - lexRuntime instance to use to interact with lex bot.
   * @param {string} version - Version of the AWS SDK to use.
   */
  static initializeService(lexRuntime, version) {
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

  /**
   * Sends audio user input to Amazon Lex.
   *
   * @param {Float32Array} inputAudio - TypedArray view of audio buffer
   * @param {float} sourceSampleRate - Sample rate of input audio 
   * @param {Object} config - Optional config for overriding lex bot info
   * 
   * @returns {Deferred}
   */
  processWithAudio(inputAudio, sourceSampleRate, config = {}) {
    const audio = this._processAudio(inputAudio, sourceSampleRate);
    return this._process('audio/x-l16; rate=16000', audio, config);
  }

  /**
   * Sends text user input to Amazon Lex.
   *
   * @param {String} inputText - Text to send to lex bot
   * @param {Object} config - Optional config for overriding lex bot info
   * 
   * @returns {Deferred}
   */
  processWithText(inputText, config = {}) {
    return this._process('text/plain; charset=utf-8', inputText, config);
  }

  _process(contentType, inputStream, config) {
    const settings = this._validateConfig(config);
    const lexSettings = {
      accept: 'text/plain; charset=utf-8',
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

      this.emit(this.constructor.EVENTS.response, data.message);

      return data.message;
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

  _processAudio(audioBuffer, sourceSampleRate) {
    const downsampledAudio = LexUtils.downsampleAudio(audioBuffer, sourceSampleRate, this.constructor.LEX_DEFAULTS.SampleRate);
    const encodedAudio = LexUtils.encodeWAV(downsampledAudio, this.constructor.LEX_DEFAULTS.SampleRate);
    LexUtils.floatTo16BitPCM(encodedAudio, 44, downsampledAudio);

    return new Blob([encodedAudio], {type: 'application/octet-stream'});
  }

  /**
   * Adds a namespace to the host with the name of the feature to contain properties
   * and methods from the feature that users of the host need access to.
   *
   * @see LexFeature
   */
  installApi() {
    /**
     * @inner
     * @namespace LexFeature
     */
    const api = super.installApi();

    Object.assign(api, {
      /**
       * @memberof LexFeature
       * @instance
       * @method
       * @see LexFeature#processWithAudio
       */
      processWithAudio: this.processWithAudio.bind(this),

      /**
       * @memberof LexFeature
       * @instance
       * @method
       * @see LexFeature#processWithText
       */
      processWithText: this.processWithText.bind(this),
    });

    return api;
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
      response: 'onLexResponseEvent',
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