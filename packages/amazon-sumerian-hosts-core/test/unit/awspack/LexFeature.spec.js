// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Messenger from 'core/Messenger';
import LexFeature from 'core/awspack/LexFeature';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('LexFeature', (options, env) => {
  let mockHost;
  let mockLexRuntime;

  beforeEach(() => {
    mockHost = new Messenger();
    spyOn(mockHost, "emit");

    mockLexRuntime = jasmine.createSpyObj('LexRuntime', ['postContent']);
    mockLexRuntime.postContent.and.callFake(function(param, callback) {
      callback(undefined, {message: "TestResponse"});
    });

    LexFeature.initializeService(
      mockLexRuntime
    );
  });

  describe('constructor.initializeService', () => {
    it('should throw an error if lexRuntime is not defined', () => {
      expect(
        LexFeature.initializeService.bind(
          undefined
        )
      ).toThrowError();
    });

    it('should set constructor.SERVICES.lexRuntime', () => {
      LexFeature.initializeService(
        mockLexRuntime
      );

      expect(LexFeature.SERVICES.lexRuntime).toEqual(mockLexRuntime);
    });

    it('should set the LexRuntime service customUserAgent to the sumerian designated value if the user has not set it', () => {
      mockLexRuntime.config = {
        customUserAgent: null
      };
      const sumerianUserAgent = 'request-source/SumerianHosts';

      expect(mockLexRuntime.config.customUserAgent).not.toEqual(sumerianUserAgent);

      LexFeature.initializeService(
        mockLexRuntime
      );

      expect(mockLexRuntime.config.customUserAgent).toEqual(sumerianUserAgent);
    });
  });

  describe('_validateConfig', () => {
    it('should use config override', () => {
      const lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      const expected = {botName: 'TestBot', botAlias: 'TestAlias', userId: 'UserId'};
      const actual = lexFeature._validateConfig(expected);

      expect(actual.botName).toEqual(expected.botName);
      expect(actual.botAlias).toEqual(expected.botAlias);
      expect(actual.userId).toEqual(expected.userId);
    });

    it('should throw error if any of the required field is undefined', () => {
      const lexFeature = new LexFeature(mockHost);
      expect(lexFeature._validateConfig.bind(lexFeature, {})).toThrowError();
    });
  });

  describe('_process', async () => {
    it('should execute LexRuntime.postContent', async () => {
      const lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      await lexFeature._process("TestType", "TestInput", {});

      expect(mockLexRuntime.postContent).toHaveBeenCalled();
    });

    it('should return a promise that resolves to a response object containing message', async () => {
      const lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      const result = await lexFeature._process("TestType", "TestInput", {});

      expect(result).toBeInstanceOf(Object);
      expect(result.message).toBeDefined();

      const actual = typeof result.message;
      const expected = 'string';

      expect(expected).toEqual(actual);
    });

    it('should emit lex response ready message through messenger if messenger is set', async () => {
      const lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      const result = await lexFeature._process("TestType", "TestInput", {});

      expect(mockHost.emit).toHaveBeenCalledWith(LexFeature.EVENTS.lexResponse, {message: "TestResponse"});
    });
  });

  describe('enableMicInput', async () => {
    beforeEach(() => {
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve());

      spyOn(AudioContext.prototype, 'createMediaStreamSource').and.returnValue({connect: () => {}});
      spyOn(AudioContext.prototype, 'createScriptProcessor').and.returnValue({connect: () => {}});
    });

    it('should execute getUserMedia with appropriate arguments', async () => {
      const lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      await lexFeature.enableMicInput();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({audio: true, video: false});
    });

    it('should emit microphone ready message through messenger if messenger is set', async () => {
      const lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      await lexFeature.enableMicInput();

      expect(mockHost.emit).toHaveBeenCalledWith(LexFeature.EVENTS.micReady);
    });
  });

  describe('beginVoiceRecording', () => {
    beforeEach(() => {
      spyOn(AudioContext.prototype, 'resume');
    });

    it('should resume audiocontext if its suspended', () => {
      const lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      lexFeature.beginVoiceRecording();

      expect(AudioContext.prototype.resume).toHaveBeenCalled();
    });

    it('should emit begin recording message through messenger if messenger is set', async () => {
      const lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      lexFeature.beginVoiceRecording();

      expect(mockHost.emit).toHaveBeenCalledWith(LexFeature.EVENTS.recordBegin);
    });
  });

  describe('endVoiceRecording', () => {
    let lexFeature;
    beforeEach(() => {
      lexFeature = new LexFeature(mockHost, {botName: 'Bot', botAlias: 'Alias'});
      spyOn(lexFeature, 'processWithAudio');
    });

    it('should emit end recording message through messenger if messenger is set', async () => {
      lexFeature.endVoiceRecording();

      expect(mockHost.emit).toHaveBeenCalledWith(LexFeature.EVENTS.recordEnd);
    });

    it('should call processWithAudio function', () => {
      lexFeature.endVoiceRecording();

      expect(lexFeature.processWithAudio).toHaveBeenCalled();
    });
  });
});
