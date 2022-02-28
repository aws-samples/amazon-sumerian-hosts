// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import Messenger from 'core/Messenger';
import AbstractTextToSpeechFeature from 'core/awspack/AbstractTextToSpeechFeature';
import AbstractSpeech from 'core/awspack/AbstractSpeech';
import Deferred from 'core/Deferred';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('AbstractTextToSpeechFeature', () => {
  let mockHost;
  let mockPolly;
  let mockPresigner;
  const mockNeuralVersion = '2.503.0';
  const mockStandardVersion = '2.502.0';
  const mockMarkString =
    '{"time":0,"type":"sentence","start":0,"end":1,"value":"t"}';
  const mockSpeechMarkResult = {
    AudioStream: {
      data: [],
    },
  };
  for (let i = 0, l = mockMarkString.length; i < l; i += 1) {
    mockSpeechMarkResult.AudioStream.data.push(mockMarkString[i].charCodeAt(0));
  }

  beforeEach(() => {
    mockHost = new Messenger();

    // mock AWS.Polly
    mockPolly = jasmine.createSpyObj('Polly', [
      'synthesizeSpeech',
      'describeVoices',
    ]);
    mockPolly.synthesizeSpeech.and.returnValue({
      promise: jasmine
        .createSpy()
        .and.resolveTo(mockSpeechMarkResult),
    });
    mockPolly.describeVoices.and.returnValue({
      promise: jasmine.createSpy().and.resolveTo(
        {
          Voices: [
            {
              Gender: 'Female',
              Id: 'Emma',
              LanguageCode: 'en-US',
              LanguageName: 'US English',
              Name: 'Emma',
              SupportedEngines: ['standard'],
            },
            {
              Gender: 'Male',
              Id: 'Brian',
              LanguageCode: 'en-GB',
              LanguageName: 'British English',
              Name: 'Brian',
              SupportedEngines: ['standard', 'neural'],
            },
            {
              Gender: 'Female',
              Id: 'Amy',
              LanguageCode: 'en-GB',
              LanguageName: 'British English',
              Name: 'Amy',
              SupportedEngines: ['standard'],
            },
          ],
        }
      ),
    });

    // mock AWS.Polly.Presigner
    mockPresigner = jasmine.createSpyObj('Presigner', [
      'getSynthesizeSpeechUrl',
    ]);
    mockPresigner.getSynthesizeSpeechUrl.and.callFake((_params, fn) =>
      fn(undefined, '')
    );
  });

  describe('constructor.initializeService', () => {
    it('should throw an error if any of the arguments is not defined', () => {
      expect(
        AbstractTextToSpeechFeature.initializeService.bind(
          AbstractTextToSpeechFeature,
          undefined,
          mockPresigner,
          mockNeuralVersion
        )
      ).toThrowError();

      expect(
        AbstractTextToSpeechFeature.initializeService.bind(
          AbstractTextToSpeechFeature,
          mockPolly,
          undefined,
          mockNeuralVersion
        )
      ).toThrowError();

      expect(
        AbstractTextToSpeechFeature.initializeService.bind(
          AbstractTextToSpeechFeature,
          mockPolly,
          mockPresigner,
          undefined
        )
      ).toThrowError();
    });

    it('should cause constructor.isReady to return true', async () => {
      expect(AbstractTextToSpeechFeature.isReady).toBeFalse();

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(AbstractTextToSpeechFeature.isReady).toBeTrue();
    });

    it('should emit constructor.EVENTS.ready event', async () => {
      const onEmit = spyOn(AbstractTextToSpeechFeature, 'emit');

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(onEmit).toHaveBeenCalledWith('onReadyEvent');
    });

    it('should set constructor.SERVICES.polly', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(AbstractTextToSpeechFeature.SERVICES.polly).toEqual(mockPolly);
    });

    it('should set constructor.SERVICES.presigner', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(AbstractTextToSpeechFeature.SERVICES.presigner).toEqual(
        mockPresigner
      );
    });

    it('should set constructor.AWS_VERSION', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(AbstractTextToSpeechFeature.AWS_VERSION).toEqual(
        mockNeuralVersion
      );
    });

    it('should populate constructor.POLLY_VOICES', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(AbstractTextToSpeechFeature.POLLY_VOICES.length).toEqual(3);
    });

    it('should populate constructor.POLLY_LANGUAGES', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const actual = Object.keys(AbstractTextToSpeechFeature.POLLY_LANGUAGES)
        .length;
      const expected = 2;

      expect(expected).toEqual(actual);
    });

    it('should populate constructor.POLLY_LANGUAGE_CODES', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const actual = Object.keys(
        AbstractTextToSpeechFeature.POLLY_LANGUAGE_CODES
      ).length;
      const expected = 2;

      expect(expected).toEqual(actual);
    });

    it('should set the Polly service customUserAgent to the sumerian designated value if the user has not set it', async () => {
      mockPolly.config = {
        customUserAgent: null,
      };
      const sumerianUserAgent = 'request-source/SumerianHosts';

      expect(mockPolly.config.customUserAgent).not.toEqual(sumerianUserAgent);

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(mockPolly.config.customUserAgent).toEqual(sumerianUserAgent);
    });

    it('should append to the Polly service customUserAgent the sumerian designated value if the user has set it', async () => {
      const customerUserAgent = 'CustomerUserAgent';
      mockPolly.config = {
        customUserAgent: customerUserAgent,
      };
      const sumerianUserAgent = 'request-source/SumerianHosts';

      expect(mockPolly.config.customUserAgent).toEqual(customerUserAgent);

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(mockPolly.config.customUserAgent).toEqual(
        customerUserAgent.concat(' ', sumerianUserAgent)
      );
    });

    it('should not append to the Polly service customeUserAgent the sumeriand designated value more than once', async () => {
      mockPolly.config = {
        customUserAgent: null,
      };
      const sumerianUserAgent = 'request-source/SumerianHosts';

      expect(mockPolly.config.customUserAgent).not.toEqual(sumerianUserAgent);

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(mockPolly.config.customUserAgent).toEqual(sumerianUserAgent);

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(mockPolly.config.customUserAgent).toEqual(sumerianUserAgent);
    });

    it('should set the Polly Presigner service customUserAgent to the sumerian designated value if the user has not set it', async () => {
      mockPresigner.service = {};
      mockPresigner.service.config = {
        customUserAgent: null,
      };
      const sumerianUserAgent = 'request-source/SumerianHosts';

      expect(mockPresigner.service.config.customUserAgent).not.toEqual(
        sumerianUserAgent
      );

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(mockPresigner.service.config.customUserAgent).toEqual(
        sumerianUserAgent
      );
    });

    it('should append to the Polly Presigner service customUserAgent the sumerian designated value if the user has set it', async () => {
      const customerUserAgent = 'CustomerUserAgent';
      mockPresigner.service = {};
      mockPresigner.service.config = {
        customUserAgent: customerUserAgent,
      };
      const sumerianUserAgent = 'request-source/SumerianHosts';

      expect(mockPresigner.service.config.customUserAgent).toEqual(
        customerUserAgent
      );

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(mockPresigner.service.config.customUserAgent).toEqual(
        customerUserAgent.concat(' ', sumerianUserAgent)
      );
    });

    it('should not append to the Polly Presigner service customeUserAgent the sumeriand designated value more than once', async () => {
      mockPresigner.service = {};
      mockPresigner.service.config = {
        customUserAgent: null,
      };
      const sumerianUserAgent = 'request-source/SumerianHosts';

      expect(mockPresigner.service.config.customUserAgent).not.toEqual(
        sumerianUserAgent
      );

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(mockPresigner.service.config.customUserAgent).toEqual(
        sumerianUserAgent
      );

      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );

      expect(mockPresigner.service.config.customUserAgent).toEqual(
        sumerianUserAgent
      );
    });
  });

  describe('constructor.isReady', () => {
    it('should return a boolean value indicating whether AWS services have been initialized', () => {
      const actual = typeof AbstractTextToSpeechFeature.isReady;
      const expected = 'boolean';

      expect(expected).toEqual(actual);
    });

    it('should not be able to accept a value', () => {
      expect(() => {
        AbstractTextToSpeechFeature.isReady = true;
      }).toThrowError();
    });
  });

  describe('_validateEngine', () => {
    it('should return the original argument if it is at least 2.503.0', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const expected = 'neural';
      const actual = tts._validateEngine('neural');

      expect(expected).toEqual(actual);
    });

    it('should return "standard" if the argument is less than 2.503.0', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const expected = 'standard';
      const actual = tts._validateEngine('neural');

      expect(expected).toEqual(actual);
    });
  });

  describe('_validateFormat', () => {
    it('should return the original argument if it is "mp3", "ogg_vorbis" or "pcm"', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const expected = 'mp3';
      const actual = tts._validateFormat('mp3');

      expect(expected).toEqual(actual);
    });

    it('should return "mp3" if the argument is not "mp3", "ogg_vorbis" or "pcm"', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const expected = 'mp3';
      const actual = tts._validateFormat('wav');

      expect(expected).toEqual(actual);
    });
  });

  describe('_validateRate', () => {
    it('should return the original argument if it is "8000", "16000", "22050" or "24000" when format is not "pcm"', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);

      expect(tts._validateRate('8000')).toEqual('8000');
      expect(tts._validateRate('16000')).toEqual('16000');
      expect(tts._validateRate('22050')).toEqual('22050');
      expect(tts._validateRate('24000')).toEqual('24000');
    });

    it('should return "2050" if the argument is not "8000", "16000", "22050" or "24000" when format is not "pcm" and engine is standard', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const expected = '2050';
      const actual = tts._validateRate('4800');

      expect(expected).toEqual(actual);
    });

    it('should return "2400" if the argument is not "8000", "16000", "22050" or "24000" when format is not "pcm" and engine is neural', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost, {engine: 'neural'});
      const expected = '2400';
      const actual = tts._validateRate('4800');

      expect(expected).toEqual(actual);
    });

    it('should return the original argument if it is "8000" or "16000" when format is "pcm"', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost, {
        audioFormat: 'pcm',
      });

      expect(tts._validateRate('8000')).toEqual('8000');
      expect(tts._validateRate('16000')).toEqual('16000');
    });

    it('should return "1600" if the argument is not "8000" or "16000" when format is "pcm"', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost, {
        audioFormat: 'pcm',
      });
      const expected = '1600';
      const actual = tts._validateRate('4800');

      expect(expected).toEqual(actual);
    });
  });

  describe('_validateVoice', () => {
    it('should return the original argument if it is a valid polly voice and compatible with the engine type', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost, {
        engine: 'neural',
      });
      const expected = 'Brian';
      const actual = tts._validateVoice('Brian');

      expect(expected).toEqual(actual);
    });

    it('should return "Amy" if the argument is not a valid polly voice', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const expected = 'Amy';
      const actual = tts._validateVoice('notAPollyVoice');

      expect(expected).toEqual(actual);
    });

    it('should return "Amy" if the argument is a valid polly voice but does not support the engine type', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost, {engine: 'neural'});
      const expected = 'Amy';
      const actual = tts._validateVoice('Emma');

      expect(expected).toEqual(actual);
    });
  });

  describe('_validateLanguage', () => {
    it('should return the original argument if it is a valid language for the current voice', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost, {voice: 'Emma'});
      const expected = 'US English';
      const actual = tts._validateLanguage('US English');

      expect(expected).toEqual(actual);
    });

    it('should return "British English" if the argument is not a valid language for the current voice', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost, {voice: 'Brian'});
      const expected = 'British English';
      const actual = tts._validateLanguage('US English');

      expect(expected).toEqual(actual);
    });
  });

  describe('_validate', () => {
    it('should validate engine, audio format, sample rate, voice and language in order', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const onValidateEngine = spyOn(tts, '_validateEngine');
      const onValidateFormat = spyOn(tts, '_validateFormat');
      const onValidateRate = spyOn(tts, '_validateRate');
      const onValidateVoice = spyOn(tts, '_validateVoice');
      const onValidateLanguage = spyOn(tts, '_validateLanguage');
      tts._validate();

      expect(onValidateEngine).toHaveBeenCalledBefore(onValidateFormat);
      expect(onValidateFormat).toHaveBeenCalledBefore(onValidateRate);
      expect(onValidateRate).toHaveBeenCalledBefore(onValidateVoice);
      expect(onValidateVoice).toHaveBeenCalledBefore(onValidateLanguage);
    });

    it('should set _isValidated to true', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);

      expect(tts._isValidated).toBeFalse();

      tts._validate();

      expect(tts._isValidated).toBeTrue();
    });
  });

  describe('_getConfig', () => {
    it("should execute _validate if the service is initialized and the instance hasn't been validated yet", async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const onValidate = spyOn(tts, '_validate');
      tts._getConfig();

      expect(onValidate).toHaveBeenCalledTimes(1);
    });

    it('should return an object with defined "Engine", "OutputFormat", "SampleRate", "VoiceId" and LanguageCode properties', () => {
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const config = tts._getConfig();

      expect(config.Engine).toBeDefined();
      expect(config.OutputFormat).toBeDefined();
      expect(config.SampleRate).toBeDefined();
      expect(config.VoiceId).toBeDefined();
      expect(config.LanguageCode).toBeDefined();
    });
  });

  describe('_updateConfig', () => {
    it('should return the result of _getConfig if no object is passed to the config argument', () => {
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const expected = JSON.stringify(tts._getConfig());
      const actual = JSON.stringify(tts._updateConfig());

      expect(expected).toEqual(actual);
    });
  });

  describe('_createSpeech', () => {
    it('should return an object that extends AbstractSpeech', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const speech = tts._createSpeech('', [], {});

      expect(speech).toBeInstanceOf(AbstractSpeech);
    });
  });

  describe('_synthesizeAudio', () => {
    it('should execute Polly.Presigner.getSynthesizeSpeechUrl', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      tts._synthesizeAudio();

      expect(mockPresigner.getSynthesizeSpeechUrl).toHaveBeenCalled();
    });

    it('should return a promise that resolves to a string', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const promise = tts._synthesizeAudio();

      expect(promise).toBeInstanceOf(Promise);

      const result = await promise;

      expect(result).toBeInstanceOf(Object);
      expect(result.url).toBeDefined();

      const actual = typeof result.url;
      const expected = 'string';

      expect(expected).toEqual(actual);
    });
  });

  describe('_synthesizeSpeechmarks', () => {
    it('should execute Polly.synthesizeSpeech', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      tts._synthesizeSpeechmarks();

      expect(mockPolly.synthesizeSpeech).toHaveBeenCalled();
    });

    it('should return a promise that resolves to an array of objects', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const promise = tts._synthesizeSpeechmarks();

      expect(promise).toBeInstanceOf(Promise);

      const result = await promise;

      expect(result).toBeInstanceOf(Array);

      expect(result.every(element => typeof element === 'object')).toBeTrue();
    });
  });

  describe('_updateSpeech', () => {
    it('should replace a speech in _speechCache if one already exists for the property matching the text but the config has changed', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const oldSpeech = await tts._updateSpeech('some text', {Voice: 'Amy'});
      const oldConfig = oldSpeech.config;
      const newSpeech = await tts._updateSpeech('some text', {Voice: 'Brian'});
      const newConfig = newSpeech.config;

      expect(tts._speechCache['some text']).toEqual(newSpeech);
      expect(newConfig).not.toEqual(oldConfig);
    });

    it('should add a new speech to _speechCache if there is no property matching the input text', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);

      expect(tts._speechCache['some text']).not.toBeDefined();

      await tts._updateSpeech('some text');

      expect(tts._speechCache['some text']).toBeDefined();
    });
  });

  describe('_getSpeech', () => {
    it('should return a Promise', () => {
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const result = tts._getSpeech('some text');

      expect(result).toBeInstanceOf(Promise);
    });

    it("should be rejected if the Polly services haven't been initialized", () => {
      AbstractTextToSpeechFeature._isReady = false;
      const tts = new AbstractTextToSpeechFeature(mockHost);

      return expectAsync(tts._getSpeech('some text')).toBeRejected();
    });

    it('should be rejected if no text is defined', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);

      return expectAsync(tts._getSpeech()).toBeRejected();
    });

    it('should resolve to an instance of AbstractSpeech', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockStandardVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const result = await tts._getSpeech('some text');

      expect(result).toBeInstanceOf(AbstractSpeech);
    });
  });

  describe('installApi', () => {
    it('should add "play", "pause", "resume" and "stop" methods to the feature\'s api object on the host', () => {
      const tts = new AbstractTextToSpeechFeature(mockHost);
      tts.installApi();

      expect(mockHost.AbstractTextToSpeechFeature.play).toBeInstanceOf(
        Function
      );

      expect(mockHost.AbstractTextToSpeechFeature.pause).toBeInstanceOf(
        Function
      );

      expect(mockHost.AbstractTextToSpeechFeature.resume).toBeInstanceOf(
        Function
      );

      expect(mockHost.AbstractTextToSpeechFeature.stop).toBeInstanceOf(
        Function
      );
    });
  });

  describe('volume', () => {
    let tts;

    beforeEach(() => {
      tts = new AbstractTextToSpeechFeature();
    });

    it('should return a number', () => {
      expect(tts.volume).toBeInstanceOf(Number);
    });

    it('should be clamped between 0 and 1', () => {
      tts.volume = -10;

      expect(tts.volume).toEqual(0);

      tts.volume = 10;

      expect(tts.volume).toEqual(1);
    });
  });

  describe('volumePending', () => {
    let tts;

    beforeEach(() => {
      tts = new AbstractTextToSpeechFeature();
      tts._promises.volume = new Deferred();
    });

    it('should return true if the volume promise has not been resolved, rejected, or cancelled', () => {
      expect(tts.volumePending).toBeTrue();
    });

    it('should return false if the volume promise has been resolved', () => {
      expect(tts.volumePending).toBeTrue();

      tts._promises.volume.resolve();

      expect(tts.volumePending).toBeFalse();
    });

    it('should return false if the volume promise has been rejected', () => {
      expect(tts.volumePending).toBeTrue();

      tts._promises.volume.reject();

      tts._promises.volume.catch();

      expect(tts.volumePending).toBeFalse();
    });

    it('should return false if the volume promise has been cancelled', () => {
      expect(tts.volumePending).toBeTrue();

      tts._promises.volume.cancel();

      expect(tts.volumePending).toBeFalse();
    });
  });

  describe('setVolume', () => {
    let tts;

    beforeEach(() => {
      tts = new AbstractTextToSpeechFeature();
    });

    it('should return a deferred promise', () => {
      const interpolator = tts.setVolume(1);

      expect(interpolator).toBeInstanceOf(Deferred);
    });

    it('should update the volume value when the promise is executed', () => {
      tts._volume = 0;
      const interpolator = tts.setVolume(1, 1);

      expect(tts.volume).toEqual(0);

      interpolator.execute(250);

      expect(tts.volume).toEqual(0.25);
    });

    it('should resolve once the volume reaches the target value', async () => {
      const interpolator = tts.setVolume(1, 1);

      interpolator.execute(1000);

      await expectAsync(interpolator).toBeResolved();
    });
  });

  describe('pauseVolume', () => {
    let tts;

    beforeEach(() => {
      tts = new AbstractTextToSpeechFeature();
    });

    it('should prevent update from executing the volume promise', () => {
      const onExecute = spyOn(tts._promises.volume, 'execute');
      tts.update(200);

      expect(onExecute).toHaveBeenCalledWith(200);
      expect(onExecute).toHaveBeenCalledTimes(1);

      tts.pauseVolume();
      tts.update(200);

      expect(onExecute).toHaveBeenCalledTimes(1);
    });

    it('should return a boolean', () => {
      const result = tts.pauseVolume();

      expect(result).toBeInstanceOf(Boolean);
    });
  });

  describe('resumeVolume', () => {
    let tts;

    beforeEach(() => {
      tts = new AbstractTextToSpeechFeature();
    });

    it('should allow update to execute the volume promise', () => {
      const onExecute = spyOn(tts._promises.volume, 'execute');
      tts._volumePaused = true;
      tts.update(200);

      expect(onExecute).not.toHaveBeenCalled();

      tts.resumeVolume();
      tts.update(200);

      expect(onExecute).toHaveBeenCalledWith(200);
    });

    it('should return a boolean', () => {
      const result = tts.resumeVolume();

      expect(result).toBeInstanceOf(Boolean);
    });
  });

  describe('update', () => {
    it('should not throw errors if there is no current speech to update', () => {
      const tts = new AbstractTextToSpeechFeature();

      expect(tts.update.bind(tts, 0)).not.toThrowError();
    });

    it("should execute the current speech's update function once if there is a current speech that is playing", () => {
      const mockSpeech = jasmine.createSpyObj('mockSpeech', ['update'], {
        playing: true,
      });
      const tts = new AbstractTextToSpeechFeature(mockHost);
      tts._currentSpeech = mockSpeech;
      tts.update();

      expect(mockSpeech.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('play', async () => {
    it('should return a promise', () => {
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const result = tts.play('test');

      expect(result).toBeInstanceOf(Promise);
    });

    it('should reject the returned promise if _getSpeech was rejected because polly service has not been initialized', () => {
      AbstractTextToSpeechFeature._isReady = false;
      const tts = new AbstractTextToSpeechFeature(mockHost);

      return expectAsync(tts.play('test')).toBeRejected();
    });

    it('should reject the returned promise if _getSpeech was rejected because of bad inputs', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);

      await expectAsync(tts.play()).toBeRejected();
    });

    it('should execute play once on the new current speech', async done => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj('mockSpeech', {
        play: new Deferred(resolve => resolve()),
      });
      tts._speechCache['<speak>test</speak>'] = {
        promise: Promise.resolve(mockSpeech),
        config: tts._getConfig(),
      };
      tts.play('test');
      setTimeout(() => {
        expect(mockSpeech.play).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });

    it('should set current speech to null once the play promise is no longer pending', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj('mockSpeech', {
        play: new Deferred(resolve => resolve()),
      });
      tts._speechCache['<speak>test</speak>'] = {
        promise: Promise.resolve(mockSpeech),
        config: tts._getConfig(),
      };

      await expectAsync(tts.play('test')).toBeResolved();
    });
  });

  describe('currentSpeech', () => {
    it('should be null if no speeches have been played', () => {
      const tts = new AbstractTextToSpeechFeature(mockHost);

      expect(tts.currentSpeech).toBeNull();
    });

    it('should be the text of a speech while it is playing', async done => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      tts.play('test');
      setTimeout(() => {
        expect(tts.currentSpeech).toEqual('<speak>test</speak>');
        done();
      }, 100);
    });
  });

  describe('pause', () => {
    it('should execute pause on the current speech once if it is playing', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj('mockSpeech', ['pause'], {
        playing: true,
      });
      tts._currentSpeech = mockSpeech;
      tts.pause();

      expect(mockSpeech.pause).toHaveBeenCalledTimes(1);
    });

    it('should not throw an error if there is no speech playing', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);

      expect(tts.pause.bind(tts)).not.toThrowError();
    });
  });

  describe('resume', () => {
    it('should return a promise', () => {
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const result = tts.resume('test');

      expect(result).toBeInstanceOf(Promise);
    });

    it('should reject the returned promise if _getSpeech was rejected because polly service has not been initialized', () => {
      AbstractTextToSpeechFeature._isReady = false;
      const tts = new AbstractTextToSpeechFeature(mockHost);

      return expectAsync(tts.resume('test')).toBeRejected();
    });

    it('should reject the returned promise if _getSpeech was rejected because of bad inputs', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);

      await expectAsync(tts.resume()).toBeRejected();
    });

    it('should execute cancel once on the current speech if a current speech is defined and playing', async done => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj('mockSpeech', ['cancel'], {
        playing: true,
        audio: {},
      });
      tts._currentSpeech = mockSpeech;
      tts.resume('test');
      setTimeout(() => {
        expect(mockSpeech.cancel).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });

    it('should execute resume once on the new current speech', async done => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj('mockSpeech', {
        resume: new Deferred(resolve => resolve()),
      });
      tts._speechCache['<speak>test</speak>'] = {
        promise: Promise.resolve(mockSpeech),
        config: tts._getConfig(),
      };
      tts.resume('test');
      setTimeout(() => {
        expect(mockSpeech.resume).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });

    it('should execute resume on the current speech if no input is given', async done => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj(
        'mockSpeech',
        {resume: new Deferred(resolve => resolve())},
        {
          text: '<speak>test</speak>',
        }
      );
      tts._currentSpeech = mockSpeech;
      tts._speechCache['<speak>test</speak>'] = {
        promise: Promise.resolve(mockSpeech),
        config: tts._getConfig(),
      };
      tts.resume();
      setTimeout(() => {
        expect(mockSpeech.resume).toHaveBeenCalledTimes(1);
        done();
      }, 100);
    });

    it('should set current speech to null once the resume promise is no longer pending', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj('mockSpeech', {
        resume: new Deferred(resolve => resolve()),
      });
      tts._speechCache['<speak>test</speak>'] = {
        promise: Promise.resolve(mockSpeech),
        config: tts._getConfig(),
      };

      await expectAsync(tts.resume('test')).toBeResolved();
    });
  });

  describe('stop', () => {
    it('should execute stop on the current speech once if it is playing', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj('mockSpeech', ['stop'], {
        playing: true,
      });
      tts._currentSpeech = mockSpeech;
      tts.stop();

      expect(mockSpeech.stop).toHaveBeenCalledTimes(1);
    });

    it('should set the current speech to null', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      const mockSpeech = jasmine.createSpyObj('mockSpeech', ['stop'], {
        playing: true,
        text: 'test',
      });
      tts._currentSpeech = mockSpeech;

      expect(tts.currentSpeech).toEqual('test');

      tts.stop();

      expect(tts.currentSpeech).toEqual(null);
    });

    it('should not throw an error if there is no speech playing', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);

      expect(tts.stop.bind(tts)).not.toThrowError();
    });
  });

  describe('discard', () => {
    it('should execute stop on the current speech if it is defined and playing', async () => {
      await AbstractTextToSpeechFeature.initializeService(
        mockPolly,
        mockPresigner,
        mockNeuralVersion
      );
      const tts = new AbstractTextToSpeechFeature(mockHost);
      tts.installApi();
      const mockSpeech = jasmine.createSpyObj('mockSpeech', ['stop'], {
        playing: true,
      });
      tts._currentSpeech = mockSpeech;
      tts.discard();

      expect(mockSpeech.stop).toHaveBeenCalledTimes(1);
    });

    it('should delete the _speechCache property', () => {
      const tts = new AbstractTextToSpeechFeature(mockHost);
      tts.installApi();

      expect(tts._speechCache).toBeDefined();

      tts.discard();

      expect(tts._speechCache).not.toBeDefined();
    });
  });
});
