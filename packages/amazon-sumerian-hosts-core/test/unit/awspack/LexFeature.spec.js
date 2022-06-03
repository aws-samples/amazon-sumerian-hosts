/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {LexFeature, Version} from '@amazon-sumerian-hosts/core';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('LexFeature', () => {
  let lexFeature;
  let mockLexRuntime;

  beforeEach(() => {
    mockLexRuntime = jasmine.createSpyObj('LexRuntime', ['postContent']);
    mockLexRuntime.postContent.and.callFake(function(param, callback) {
      callback(undefined, {message: 'TestResponse'});
    });
  });

  describe('constructor', () => {
    it('should throw an error if lexRuntime is not defined', () => {
      expect(() => new LexFeature()).toThrowError();
    });

    it('should set the LexRuntime service customUserAgent to the sumerian designated value if the user has not set it', () => {
      mockLexRuntime.config = {
        customUserAgent: null,
      };
      const sumerianUserAgent = `SumerianHosts-${Version}`;

      lexFeature = new LexFeature(mockLexRuntime);

      expect(mockLexRuntime.config.customUserAgent).toContain(
        sumerianUserAgent
      );

      expect(mockLexRuntime.config.customUserAgent).toContain('UnknownEngine');
    });

    it('should append sumerian designated value to user defined LexRuntime service customUserAgent', () => {
      mockLexRuntime.config = {
        customUserAgent: 'UserDefined',
      };
      const sumerianUserAgent = `SumerianHosts-${Version}`;

      lexFeature = new LexFeature(mockLexRuntime);

      expect(mockLexRuntime.config.customUserAgent).toContain(
        `UserDefined ${sumerianUserAgent}`
      );
    });
  });

  describe('_validateConfig', () => {
    it('should use config override', () => {
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
      });
      const expected = {
        botName: 'TestBot',
        botAlias: 'TestAlias',
        userId: 'UserId',
      };
      const actual = lexFeature._validateConfig(expected);

      expect(actual.botName).toEqual(expected.botName);
      expect(actual.botAlias).toEqual(expected.botAlias);
      expect(actual.userId).toEqual(expected.userId);
    });

    it('should throw error if any of the required field is undefined', () => {
      lexFeature = new LexFeature(mockLexRuntime);

      expect(() => {
        lexFeature._validateConfig({});
      }).toThrowError();
    });
  });

  describe('_process', () => {
    it('should execute LexRuntime.postContent', async () => {
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
        userId: 'UserId',
      });
      await lexFeature._process('TestType', 'TestInput', {});

      const expectArg = {
        botName: 'Bot',
        botAlias: 'Alias',
        contentType: 'TestType',
        inputStream: 'TestInput',
        userId: 'UserId',
      };

      expect(mockLexRuntime.postContent).toHaveBeenCalledWith(
        expectArg,
        jasmine.anything()
      );
    });

    it('should return a promise that resolves to a response object containing message', async () => {
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
      });
      const result = await lexFeature._process('TestType', 'TestInput', {});

      expect(result).toBeInstanceOf(Object);
      expect(result.message).toBeDefined();

      const actual = typeof result.message;
      const expected = 'string';

      expect(expected).toEqual(actual);
    });

    it('should emit lex response ready message through messenger if messenger is set', async () => {
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
      });
      spyOn(lexFeature, 'emit');
      await lexFeature._process('TestType', 'TestInput', {});

      expect(lexFeature.emit).toHaveBeenCalledWith(
        LexFeature.EVENTS.lexResponseReady,
        {message: 'TestResponse'}
      );
    });

    it('The error re-thrown from _process should be equal to the customize one.', async () => {
      mockLexRuntime.postContent.and.callFake(function(param, callback) {
        callback(new Error('mock error'), {message: 'TestResponse'});
      });
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
      });

      await expectAsync(
        lexFeature._process('TestType', 'TestInput', {})
      ).toBeRejectedWithError(
        'Error happened during voice recording: Error: mock error. Please check whether your speech is more than 15s.'
      );
    });
  });

  describe('enableMicInput', () => {
    beforeEach(() => {
      spyOn(navigator.mediaDevices, 'getUserMedia').and.resolveTo();

      spyOn(AudioContext.prototype, 'createMediaStreamSource').and.returnValue({
        connect: () => {},
      });
      spyOn(AudioContext.prototype, 'createScriptProcessor').and.returnValue({
        connect: () => {},
      });
    });

    it('should execute getUserMedia with appropriate arguments', async () => {
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
      });
      await lexFeature.enableMicInput();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: true,
        video: false,
      });
    });

    it('should emit microphone ready message through messenger if messenger is set', async () => {
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
      });
      spyOn(lexFeature, 'emit');
      await lexFeature.enableMicInput();

      expect(lexFeature.emit).toHaveBeenCalledWith(LexFeature.EVENTS.micReady);
    });
  });

  describe('beginVoiceRecording', () => {
    beforeEach(() => {
      spyOn(AudioContext.prototype, 'resume');
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
      });
      spyOn(lexFeature, 'enableMicInput').and.callFake(() => {
        lexFeature._micReady = true;
      });
    });

    it('should resume audiocontext if its suspended', () => {
      lexFeature._audioContext.suspend();

      lexFeature.enableMicInput();

      lexFeature.beginVoiceRecording();

      expect(AudioContext.prototype.resume).toHaveBeenCalled();
    });

    it('should not emi begin recording message if the mic is not setup', () => {
      spyOn(lexFeature, 'emit');

      lexFeature.beginVoiceRecording();

      expect(lexFeature.emit).not.toHaveBeenCalled();
    });

    it('should emit begin recording message through messenger if messenger is set', async () => {
      spyOn(lexFeature, 'emit');

      lexFeature.enableMicInput();

      lexFeature.beginVoiceRecording();

      expect(lexFeature.emit).toHaveBeenCalledWith(
        LexFeature.EVENTS.recordBegin
      );
    });
  });

  describe('endVoiceRecording', () => {
    beforeEach(() => {
      lexFeature = new LexFeature(mockLexRuntime, {
        botName: 'Bot',
        botAlias: 'Alias',
      });
      spyOn(lexFeature, '_processWithAudio');
      spyOn(lexFeature, 'emit');
      spyOn(lexFeature, 'beginVoiceRecording').and.callFake(() => {
        lexFeature._recording = true;
      });
    });

    it('should emit end recording message through messenger if messenger is set', async () => {
      lexFeature.beginVoiceRecording();
      lexFeature.endVoiceRecording();

      expect(lexFeature.emit).toHaveBeenCalledWith(LexFeature.EVENTS.recordEnd);
    });

    it('should call _processWithAudio function', () => {
      lexFeature.beginVoiceRecording();
      lexFeature.endVoiceRecording();

      expect(lexFeature._processWithAudio).toHaveBeenCalled();
    });
  });
});
