// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractHostFeature from 'core/AbstractHostFeature';
import AnimationUtils from 'core/animpack/AnimationUtils';
import Deferred from 'core/Deferred';
import Speech from './AbstractSpeech';

// Available options for Polly
const engines = ['standard', 'neural'];
const audioFormats = ['mp3', 'ogg_vorbis', 'pcm'];
const speechmarkTypes = ['sentence', 'ssml', 'viseme', 'word'];
const sampleRates = {
  mp3: {
    rates: ['8000', '16000', '22050', '24000'],
    defaults: {
      standard: '2050',
      neural: '2400',
    },
  },
  pcm: {
    rates: ['8000', '16000'],
    defaults: {
      standard: '1600',
      neural: '1600',
    },
  },
};
sampleRates.ogg_vorbis = sampleRates.mp3;
let awsVersion;

/**
 * Base class for turning text input into playable audio. There should be one instance
 * per speaker, each instance can play only one piece of text at a time.
 */
export default class AbstractTextToSpeechFeature extends AbstractHostFeature {
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
   * @param {number} [options.speechmarkOffset=0] - Amount of time in seconds to
   * offset speechmark event emission from the audio.
   * @param {number} [options.minEndMarkDuration=.05] - The minimum amount of time
   * in seconds that the last speechmark of each type in a speech can have its
   * duration property set to.
   */
  constructor(
    host,
    options = {
      voice: undefined,
      engine: undefined,
      language: undefined,
      audioFormat: 'mp3',
      sampleRate: undefined,
      speechmarkOffset: 0,
      minEndMarkDuration: 0.05,
      volume: 1,
    }
  ) {
    super(host);

    this._speechCache = {};
    this._currentSpeech = null;
    this._isValidated = false;
    this.speechmarkOffset = Number.isNaN(Number(options.speechmarkOffset))
      ? 0
      : Number(options.speechmarkOffset);
    this.minEndMarkDuration = Number.isNaN(Number(options.minEndMarkDuration))
      ? 0
      : Number(options.minEndMarkDuration);
    this.volume = Number.isNaN(Number(options.volume)) ? 1 : Number(options.volume);
    this._promises = {
      volume: Deferred.resolve()
    }
    this._volumePaused = false;

    // Set default options for each speech
    this._voice = options.voice || this.constructor.POLLY_DEFAULTS.VoiceId;
    this._language =
      options.language || this.constructor.POLLY_DEFAULTS.LanguageName;
    this._engine = engines.includes(options.engine)
      ? options.engine
      : this.constructor.POLLY_DEFAULTS.Engine;
    this._audioFormat = audioFormats.includes(options.audioFormat)
      ? options.audioFormat
      : this.constructor.POLLY_DEFAULTS.OutputFormat;
    this._sampleRate = sampleRates[this._audioFormat].rates.includes(
      options.sampleRate
    )
      ? options.sampleRate
      : this.constructor.POLLY_DEFAULTS.SampleRate;
  }

  /**
   * Store Polly, Presigner and AWS SDK Version for use across all instances.
   *
   * @param {AWS.Polly} polly - Polly instance to use to generate speechmarks.
   * @param {AWS.Polly.Presigner} presigner - Presigner instance to use to generate
   * audio URLs.
   * @param {string} version - Version of the AWS SDK to use to validate voice options.
   */
  static initializeService(polly, presigner, version) {
    // Make sure all were defined
    if (
      polly === undefined
      || presigner === undefined
      || version === undefined
    ) {
      throw new Error(
        'Cannot initialize TextToSpeech feature. All arguments must be defined.'
      );
    }

    // Set user-agent headers
    const sumerianUserAgent = 'SumerianHosts';
    if (
      polly.config
      && polly.config.customUserAgent == null
    ) {
      Object.assign(polly.config, { customUserAgent: sumerianUserAgent });
    }
    if (
      presigner.service
      && presigner.service.config
      && presigner.service.config.customUserAgent == null
    ) {
      Object.assign(presigner.service.config, { customUserAgent: sumerianUserAgent });
    }

    this._isReady = false;

    // Store parameters
    this.SERVICES.polly = polly;
    this.SERVICES.presigner = presigner;
    awsVersion = version;

    // Clear the current polly objects
    const availableVoices = this.POLLY_VOICES;
    availableVoices.length = 0;

    const availableLanguages = this.POLLY_LANGUAGES;
    Object.keys(availableLanguages).forEach(name => {
      delete availableLanguages[name];
    });

    const availableLanguageCodes = this.POLLY_LANGUAGE_CODES;
    Object.keys(availableLanguageCodes).forEach(name => {
      delete availableLanguageCodes[name];
    });

    // Re-populate according to version
    const minNeuralSdk = this.POLLY_MIN_NEURAL_VERSION;

    return this.SERVICES.polly
      .describeVoices()
      .promise()
      .then(response => {
        const allCodes = {};

        response.Voices.forEach(voice => {
          if (
            voice.SupportedEngines.includes('standard') ||
            version >= minNeuralSdk
          ) {
            availableVoices.push(voice);
          }

          availableVoices.forEach(voice => {
            availableLanguages[voice.LanguageName] = voice.LanguageCode;
            allCodes[voice.LanguageCode] = voice.LanguageName;
          });
        });

        Object.entries(availableLanguages).forEach(([name, code]) => {
          availableLanguageCodes[code] = name;
        });

        // Notify that we're ready to generate speeches
        this._isReady = true;
        this.emit(this.EVENTS.ready);
      });
  }

  /**
   * Indicates whether or not the class is capable of generating speech audio. Polly,
   * Presigner and AWS SDK version number must have been defined using intializeService.
   */
  static get isReady() {
    return this._isReady;
  }

  /**
   * Gets the text of the currently playing speech.
   */
  get currentSpeech() {
    if (this._currentSpeech) {
      return this._currentSpeech.text;
    } else {
      return null;
    }
  }

  /**
   * Gets and sets the number of seconds to offset speechmark emission.
   */
  get speechmarkOffset() {
    return this._speechmarkOffset;
  }

  set speechmarkOffset(offset) {
    this._speechmarkOffset = offset;

    if (this._currentSpeech) {
      this._currentSpeech.speechmarkOffset = offset;
    }
  }

  /**
   * Gets and sets the The minimum amount of time in seconds that the last
   * speechmark of each type in a speech can have its duration property set to.
   */
  get minEndMarkDuration() {
    return this._minEndMarkDuration / 1000;
  }

  set minEndMarkDuration(duration) {
    this._minEndMarkDuration = duration * 1000;
  }

  /**
   * @private
   *
   * Checks if a given engine type is compatible with the AWS SDK version. If it
   * is, return the original value. Otherwise return a default.
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateEngine(engine) {
    // Default to the standard engine if neural is not available for this version
    if (
      engine === undefined ||
      this.constructor.AWS_VERSION < this.constructor.POLLY_MIN_NEURAL_VERSION
    ) {
      engine = this.constructor.POLLY_DEFAULTS.Engine;
    }

    return engine;
  }

  /**
   * @private
   *
   * Checks if a given audio format type is compatible with Polly. If it is, return
   * the original value. Otherwise return a default.
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateFormat(format) {
    if (format === undefined || !audioFormats.includes(format)) {
      format = this.constructor.POLLY_DEFAULTS.OutputFormat;
    }

    return format;
  }

  /**
   * @private
   *
   * Checks if a given audio sampling rate is compatible with the current audio
   * format. If it is, return the original value. Otherwise return a default.
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateRate(rate) {
    // Use default if specified sample rate is not valid for the audio format
    if (
      rate === undefined ||
      !sampleRates[this._audioFormat].rates.includes(rate)
    ) {
      rate = sampleRates[this._audioFormat].defaults[this._engine];
    }

    return rate;
  }

  /**
   * @private
   *
   * Checks if a given Polly voice id is compatible with the current Polly engine.
   * If it is, return the original value. Otherwise return a default.
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateVoice(voiceId) {
    const voice = this.constructor.POLLY_VOICES.find(v => v.Id === voiceId);

    // Use the default voice if the voice isn't supported by the engine
    if (voice === undefined || !voice.SupportedEngines.includes(this._engine)) {
      voiceId = this.constructor.POLLY_DEFAULTS.VoiceId;
    }

    return voiceId;
  }

  /**
   * @private
   *
   * Checks if a given Polly language is compatible with the current Polly voice.
   * If it is, return the original value. Otherwise return a default.
   *
   * @param {string} engine - The type of Polly voice engine to validate.
   *
   * @returns {string}
   */
  _validateLanguage(language) {
    const voice = this.constructor.POLLY_VOICES.find(v => v.Id === this._voice);
    const languageCode = this.constructor.POLLY_LANGUAGES[language];

    // Find the languages available for the current voice
    const availableCodes = [voice.LanguageCode];
    if (voice.AdditionalLanguageCodes) {
      availableCodes.push(...voice.AdditionalLanguageCodes);
    }

    // If the current voice doesn't support the language, use its default
    if (!availableCodes.includes(languageCode)) {
      language = this.constructor.POLLY_LANGUAGE_CODES[voice.LanguageCode];
    }

    return language;
  }

  /**
   * @private
   *
   * Validate the current Polly options to make sure they are compatible with each
   * other.
   */
  _validate() {
    // Validate speech parameters
    this._engine = this._validateEngine(this._engine);
    this._audioFormat = this._validateFormat(this._audioFormat);
    this._sampleRate = this._validateRate(this._sampleRate);
    this._voice = this._validateVoice(this._voice);
    this._language = this._validateLanguage(this._language);
    this._isValidated = true;
  }

  /**
   * @private
   *
   * Return an object containing parameters compatible with Polly.synthesizeSpeech.
   *
   * @returns {Object}
   */
  _getConfig() {
    // Make sure parameters have been validated
    if (this.constructor.isReady && !this._isValidated) {
      this._validate();
    }

    // Create a config object compatible with Polly
    return {
      Engine: this._engine,
      OutputFormat: this._audioFormat,
      SampleRate: this._sampleRate,
      VoiceId: this._voice,
      LanguageCode: this.constructor.POLLY_LANGUAGES[this._language],
    };
  }

  /**
   * @private
   *
   * Update Polly parameters with options from a given config. All stored speeches
   * will be updated to use the new parameters, unless the speech text is contained
   * in the 'skipSpeeches' parameter.
   *
   * @param {Object} config - Polly parameter options to overwrite.
   * @param {Array.<string>} skipSpeeches - Text of any speeches that should not
   * have parameters updated.
   *
   * @returns {Object}
   */
  _updateConfig(config, skipSpeeches = []) {
    const currentConfig = this._getConfig();
    if (!config) {
      return currentConfig;
    }

    this._isValidated = false;
    const currentConfigStr = JSON.stringify(currentConfig);

    // Update options
    if (config.Engine) {
      this._engine = config.Engine;
    }

    if (config.audioFormat) {
      this._audioFormat = config.audioFormat;
    }

    if (config.SampleRate) {
      this._sampleRate = config.SampleRate;
    }

    if (config.VoiceId) {
      this._voice = config.VoiceId;
    }

    if (config.Language) {
      this._language = config.Language;
    }

    // Validate the config
    const validConfig = this._getConfig();

    // Exit if nothing has changed
    const configStr = JSON.stringify(validConfig);
    if (currentConfigStr === configStr) {
      this._isValidated = true;
      return validConfig;
    }

    // Update all cached configs
    Object.entries(this._speechCache).forEach(([text, speech]) => {
      // Check if this is a skipped speech
      if (skipSpeeches.includes(text)) {
        return;
      }

      const speechConfigStr = JSON.stringify(speech.config);

      // Update the speech with new parameters
      if (speechConfigStr !== configStr) {
        this._updateSpeech(text, config);
      }
    });

    return validConfig;
  }

  /**
   * @private
   *
   * Update an existing speech, or add a new speech with new Polly parameters with
   * options from a given config.
   *
   * @param {string} text - The text of the speech to update.
   * @param {Object} config - Polly parameter options to update.
   * @param {boolean} [force=false] - Whether to force the speech to be updated
   * if no parameters have changes.
   *
   * @returns {Speech}
   */
  _updateSpeech(text, config, force = false) {
    const speech = this._speechCache[text] || {};
    // Exit if nothing has changed and force is false
    if (
      !force &&
      config !== undefined &&
      speech.config &&
      JSON.stringify(config) === JSON.stringify(speech.config)
    ) {
      return speech;
    }

    // Create separate parameters for audio and speechmark generation
    const audioParams = {
      ...config,
      Text: text,
      TextType: 'ssml',
    };
    const speechmarkParams = {
      ...audioParams,
      OutputFormat: 'json',
      SpeechMarkTypes: speechmarkTypes,
    };

    // Generate audio and speechmarks
    speech.config = config;
    speech.promise = Promise.all([
      this._synthesizeSpeechmarks(speechmarkParams),
      this._synthesizeAudio(audioParams),
    ]).then(results => {
      return this._createSpeech(text, ...results);
    });
    this._speechCache[text] = speech;

    return speech;
  }

  /**
   * @private
   *
   * Create a new Speech object for the speaker.
   *
   * @param {TextToSpeech} speaker - The TextToSpeech instance that will own the speech.
   * @param {string} text - Text of the speech.
   * @param {Object} speechmarks - Speechmarks for the speech.
   * @param {Object} audioConfig - Audio for the speech.
   *
   * @returns {Speech}
   */
  _createSpeech(text, speechmarks, audioConfig) {
    return new Speech(this, text, speechmarks, audioConfig);
  }

  /**
   * @private
   *
   * Generate a version of given text that is enclosed by Polly ssml speak tags.
   *
   * @param {string} text - The text to update.
   *
   * @returns {string}
   */
  _validateText(text) {
    if (!text) {
      text = '<speak></speak>';
    } else {
      text = text
        .replace(/(^\s*<\s*speak\s*)>\s*|(^\s*)/, '<speak>')
        .replace(/(\s*<\s*\/\s*speak\s*>\s*$|\s*$)/, '</speak>');
    }

    return text;
  }

  /**
   * @private
   *
   * Create presigned URL of speech audio for the given speech text.
   *
   * @param {Object} params - Parameters object compatible with Polly.synthesizeSpeech.
   *
   * @returns {Deferred} Resolves with an object containing the audio URL.
   */
  _synthesizeAudio(params) {
    return new Deferred((resolve, reject) => {
      this.constructor.SERVICES.presigner.getSynthesizeSpeechUrl(
        params,
        function(error, url) {
          if (!error) {
            resolve({url});
          } else {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * @private
   *
   * Retrieves and parses speechmarks for the given speech text.
   *
   * @param {Object} params - Parameters object compatible with Polly.synthesizeSpeech.
   *
   * @returns {Deferred} Resolves with an array of speechmark objects
   */
  _synthesizeSpeechmarks(params) {
    return this.constructor.SERVICES.polly
      .synthesizeSpeech(params)
      .promise()
      .then(result => {
        // Convert charcodes to string
        const jsonString = JSON.stringify(result.AudioStream);
        const json = JSON.parse(jsonString);
        const dataStr = json.data.map(c => String.fromCharCode(c)).join('');

        const markTypes = {
          sentence: [],
          word: [],
          viseme: [],
          ssml: [],
        };
        const endMarkTypes = {
          sentence: null,
          word: null,
          viseme: null,
          ssml: null,
        };

        // Split by enclosing {} to create speechmark objects
        const speechMarks = [...dataStr.matchAll(/\{.*?\}(?=\n|$)/gm)].map(
          match => {
            const mark = JSON.parse(match[0]);

            // Set the duration of the last speechmark stored matching this one's type
            const numMarks = markTypes[mark.type].length;
            if (numMarks > 0) {
              const lastMark = markTypes[mark.type][numMarks - 1];
              lastMark.duration = mark.time - lastMark.time;
            }

            markTypes[mark.type].push(mark);
            endMarkTypes[mark.type] = mark;
            return mark;
          }
        );

        // Find the time of the latest speechmark
        const endTimes = [];
        if (endMarkTypes.sentence) {
          endTimes.push(endMarkTypes.sentence.time);
        }
        if (endMarkTypes.word) {
          endTimes.push(endMarkTypes.word.time);
        }
        if (endMarkTypes.viseme) {
          endTimes.push(endMarkTypes.viseme.time);
        }
        if (endMarkTypes.ssml) {
          endTimes.push(endMarkTypes.ssml.time);
        }
        const endTime = Math.max(...endTimes);

        // Calculate duration for the ending speechMarks of each type
        if (endMarkTypes.sentence) {
          endMarkTypes.sentence.duration = Math.max(
            this._minEndMarkDuration,
            endTime - endMarkTypes.sentence.time
          );
        }
        if (endMarkTypes.word) {
          endMarkTypes.word.duration = Math.max(
            this._minEndMarkDuration,
            endTime - endMarkTypes.word.time
          );
        }
        if (endMarkTypes.viseme) {
          endMarkTypes.viseme.duration = Math.max(
            this._minEndMarkDuration,
            endTime - endMarkTypes.viseme.time
          );
        }
        if (endMarkTypes.ssml) {
          endMarkTypes.ssml.duration = Math.max(
            this._minEndMarkDuration,
            endTime - endMarkTypes.ssml.time
          );
        }

        return speechMarks;
      });
  }

  /**
   * @private
   *
   * Returns a Speech object that has the given text.
   *
   * @param {string} text - The text content of the Speech.
   * @param {Object=} config - Options to update the Speech with.
   *
   * @returns {Deferred} Resolves with Speech or null;
   */
  _getSpeech(text, config) {
    // Make sure AWS services exist
    if (!this.constructor.isReady) {
      const e = 'AWS services have not been initialized.';
      return Deferred.reject(e);
    }

    // Make sure its possible to generate speeches
    if (!text) {
      const e = 'Cannot play a speech with no text.';
      return Deferred.reject(e);
    }

    // Update the speech with options
    text = this._validateText(text);
    config = this._updateConfig(config, text);

    return this._updateSpeech(text, config).promise;
  }

  /**
   * Add a namespace to the host to contain anything from the feature that users
   * of the host need access to.
   */
  installApi() {
    const api = super.installApi();

    Object.assign(api, {
      play: this.play.bind(this),
      pause: this.pause.bind(this),
      resume: this.resume.bind(this),
      stop: this.stop.bind(this),
      getVolume: this.getVolume.bind(this),
      setVolume: this.setVolume.bind(this),
      pauseVolume: this.pauseVolume.bind(this),
      resumeVolume: this.resumeVolume.bind(this)
    });

    Object.defineProperties(api, {
      speechmarkOffset: {
        get: () => this.speechmarkOffset,
        set: offset => {
          this.speechmarkOffset = offset;
        },
      },
    });

    return api;
  }

  /**
   * Sets the volume used for all audio clips played by the speaker.
   */
  set volume(volume) {
    this._volume = AnimationUtils.clamp(volume);
  }

  /**
   * Gets the volume used for all audio clips played by the speaker.
   */
  get volume() {
    return this._volume;
  }

  /**
   * Gets whether or not the speaker's volume value is currently being tweened.
   */
  get volumePending() {
    return this._promises.volume && this._promises.volume.pending;
  }

  /**
   * Gets the volume used for all audio clips played by the speaker.
   *
   * @returns {number}
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Updates the volume used for all audio clips played by the speaker over time.
   *
   * @param {number} volume - Target volume value.
   * @param {number} [seconds=0] - Amount of time it will take to reach the target
   * volume.
   * @param {Function=} easingFn - Easing function used for interpolation.
   *
   * @returns {Deferred}
   */
  setVolume(volume, seconds = 0, easingFn) {
    if(this.volumePending) {
      this._promises.volume.cancel();
    }

    volume = AnimationUtils.clamp(volume);
    this._promises.volume = AnimationUtils.interpolateProperty(
      this,
      'volume',
      volume,
      {seconds, easingFn}
    );

    return this._promises.volume;
  }

  /**
   * Pause interpolation happening on the speaker's volume property.
   *
   * @returns {boolean}
   */
  pauseVolume() {
    this._volumePaused = true;

    return this.volumePending;
  }

  /**
   * Resume any interpolation happening on the speaker's volume property.
   *
   * @returns {boolean}
   */
  resumeVolume() {
    this._volumePaused = false;

    return this.volumePending;
  }

  /**
   * Update the currently playing speech.
   *
   * @param {number} deltaTime - Time since the last update.
   */
  update(deltaTime) {
    if(!this._volumePaused) {
      this._promises.volume.execute(deltaTime);
    }

    if (this._currentSpeech && this._currentSpeech.playing) {
      this._currentSpeech.volume = this._volume;
      this._currentSpeech.update(this._host.now);
      super.update(deltaTime);
    }
  }

  /**
   * @private
   *
   * Set the current speech to a new asset and update the speech's speechmark
   * offset value to match that of the feature.
   *
   * @param {typeof AbstractSpeech} speech - Speech to set as current.
   */
  _setCurrentSpeech(speech) {
    speech.speechmarkOffset = this._speechmarkOffset;
    this._currentSpeech = speech;
  }

  /**
   * Stop any speeches currently playing and play a new speech from the beginning.
   *
   * @param {string} text - The text of the new speech to play.
   * @param {Object=} config - Optional parameters for the speech.
   *
   * @returns {Deferred}
   */
  play(text, config) {
    return this._getSpeech(text, config)
      .then(speech => {
        // Cancel the currently playing speech
        if (this._currentSpeech && this._currentSpeech.playing) {
          this._currentSpeech.cancel();
        }

        this._setCurrentSpeech(speech);

        // Reset current speech when the speech ends
        const onFinish = () => {
          this._currentSpeech = null;
        };

        return speech.play(this._host.now, onFinish, onFinish, onFinish);
      })
      .catch(e => {
        e = `Cannot play speech ${text} on host ${this.host.id}. ${e}`;
        return Deferred.reject(e);
      });
  }

  /**
   * If a speech is currently playing, pause it at the current time.
   */
  pause() {
    if (this._currentSpeech && this._currentSpeech.playing) {
      this._currentSpeech.pause(this._host.now);
    } else {
      console.warn(
        `Cannot pause speech on host ${this.host.id}. No speech is currently playing`
      );
    }
  }

  /**
   * Stop any speeches currently playing and resume a new speech from the current
   * time.
   */
  resume(text, config) {
    // If no text is provided, try to use the current speech
    if (text === undefined && this._currentSpeech) {
      text = this._currentSpeech.text;
    }

    return this._getSpeech(text, config)
      .then(speech => {
        // Cancel the currently playing speech
        if (
          this._currentSpeech &&
          this._currentSpeech.playing &&
          this._currentSpeech.audio !== speech.audio
        ) {
          this._currentSpeech.cancel();
        }

        this._setCurrentSpeech(speech);

        // Reset current speech when the speech ends
        const onFinish = () => {
          this._currentSpeech = null;
        };

        return speech.resume(this._host.now, onFinish, onFinish, onFinish);
      })
      .catch(e => {
        e = `Cannot resume speech ${text} on host ${this.host.id}. ${e}`;
        return Deferred.reject(e);
      });
  }

  /**
   * If a speech is currently playing, stop playback and reset time.
   */
  stop() {
    if (this._currentSpeech && this._currentSpeech.playing) {
      this._currentSpeech.stop();
      this._currentSpeech = null;
    } else {
      console.warn(
        `Cannot stop speech on host ${this.host.id}. No speech is currently playing.`
      );
    }
  }

  discard() {
    if (this._currentSpeech && this._currentSpeech.playing) {
      this._currentSpeech.stop();
    }

    delete this._speechCache;

    super.discard();
  }
}

Object.defineProperties(AbstractTextToSpeechFeature, {
  AWS_VERSION: {
    get: () => awsVersion,
  },
  POLLY_MIN_NEURAL_VERSION: {
    value: '2.503',
    writable: false,
  },
  POLLY_DEFAULTS: {
    value: {
      Engine: 'standard',
      LexiconNames: [],
      OutputFormat: 'mp3',
      SampleRate: '22050',
      Text: '',
      TextType: 'ssml',
      VoiceId: 'Amy',
      LanguageCode: 'en-GB',
      LanguageName: 'British English',
    },
    writable: false,
  },
  POLLY_VOICES: {
    value: [],
    writable: false,
  },
  POLLY_LANGUAGES: {
    value: {},
    writable: false,
  },
  POLLY_LANGUAGE_CODES: {
    value: {},
    writable: false,
  },
  _isReady: {
    value: false,
    writable: true,
  },
  EVENTS: {
    value: {
      ...Object.getPrototypeOf(AbstractTextToSpeechFeature).EVENTS,
      ready: 'onReadyEvent',
      play: 'onPlayEvent',
      pause: 'onPauseEvent',
      resume: 'onResumeEvent',
      interrupt: 'onInterruptEvent',
      stop: 'onStopEvent',
      sentence: 'onSentenceEvent',
      word: 'onWordEvent',
      viseme: 'onVisemeEvent',
      ssml: 'onSsmlEvent',
    },
  },
  SERVICES: {
    value: {
      ...Object.getPrototypeOf(AbstractTextToSpeechFeature).SERVICES,
      polly: undefined,
      presigner: undefined,
    },
  },
});
