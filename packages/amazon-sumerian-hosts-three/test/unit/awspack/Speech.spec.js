// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-suite-dupes */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import {Messenger} from '@amazon-sumerian-hosts/core';
import { aws } from '@amazon-sumerian-hosts/three';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('Speech', (_options, env) => {
  let speech;
  let speaker;
  Object.assign(Messenger.EVENTS, {
    play: 'TextToSpeech.onPlayEvent',
    pause: 'TextToSpeech.onPauseEvent',
    resume: 'TextToSpeech.onResumeEvent',
    interrupt: 'TextToSpeech.onInterruptEvent',
    stop: 'TextToSpeech.onStopEvent',
    sentence: 'TextToSpeech.onSentenceEvent',
    word: 'TextToSpeech.onWordEvent',
    viseme: 'TextToSpeech.onVisemeEvent',
    ssml: 'TextToSpeech.onSsmlEvent',
  });

  beforeEach(() => {
    speaker = new Messenger();
    const mockAudio = {
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      stop: jasmine.createSpy('stop'),
      onEndedObservable: {add: jasmine.createSpy('add')},
      currentTime: 0,
      paused: true,
    };
    mockAudio.play.and.callFake(() => {
      mockAudio.paused = false;
      return Promise.resolve();
    });
    mockAudio.pause.and.callFake(() => {
      mockAudio.paused = true;
    });

    const audioConfig = {audio: mockAudio};
    if (env === 'three') {
      audioConfig.threeAudio = new THREE.Audio(new THREE.AudioListener());
      mockAudio.play = spyOn(audioConfig.threeAudio, 'play');
      mockAudio.pause = spyOn(audioConfig.threeAudio, 'pause');
    }

    speech = new aws.Speech(speaker, '', [], audioConfig);
  });

  function describeCommonSpeech() {
    describe('pause', () => {
      it('should execute pause on _audio', async () => {
        speech.pause();
        await Promise.resolve();

        expect(speech._audio.pause).toHaveBeenCalled();
      });
    });
    describe('resume', () => {
      it('should execute play on _audio', () => {
        speech.resume();

        expect(speech._audio.play).toHaveBeenCalled();
      });

      it("should not set _audio's currentTime back to 0", () => {
        speech._audio.currentTime = 10;

        speech.resume();

        expect(speech._audio.currentTime).toEqual(10);
      });
    });
    describe('cancel', () => {
      it('should execute pause on _audio', async () => {
        speech.cancel();
        await Promise.resolve();

        expect(speech._audio.pause).toHaveBeenCalled();
      });
    });
  }

  function describeCoreSpeech() {
    describe('audio', () => {
      it('should not be able to be set', () => {
        expect(() => {
          speech.audio = 'notAudio';
        }).toThrowError(TypeError);
      });
    });

    describe('play', () => {
      it("should set _audio's current time to 0", () => {
        speech._audio.currentTime = 10;

        expect(speech._audio.currentTime).not.toEqual(0);

        speech.play();

        expect(speech._audio.currentTime).toEqual(0);
      });

      it('should execute play on _audio', () => {
        speech.play();

        expect(speech._audio.paused).toBeFalse();
        expect(speech._audio.play).toHaveBeenCalled();
      });
    });

    describe('stop', () => {
      it('should execute pause on _audio', async () => {
        speech.stop();
        await Promise.resolve();

        expect(speech._audio.pause).toHaveBeenCalled();
      });

      it("should set _audio's current time to 0", () => {
        speech._audio.currentTime = 10;

        expect(speech._audio.currentTime).not.toEqual(0);

        speech.stop();

        expect(speech._audio.currentTime).toEqual(0);
      });
    });
  }

  function describeThreeSpeech() {
    describe('audio', () => {
      it('should be an instance of THREE.Audio', () => {
        expect(speech.audio).toBeInstanceOf(THREE.Audio);
      });
    });

    describe('play', () => {
      it('should disconnect and re-connect _threeAudio', () => {
        const onDisonnect = spyOn(speech._threeAudio, 'disconnect');
        const onConnect = spyOn(speech._threeAudio, 'connect');
        speech.play();

        expect(onDisonnect).toHaveBeenCalledBefore(onConnect);
      });
    });
  }

  function describeBabylonSpeech() {
    describe('play', () => {
      it('should execute stop on _audio before executing play', () => {
        speech.play();

        expect(speech._audio.stop).toHaveBeenCalledBefore(speech._audio.play);
      });
    });

    describe('stop', () => {
      it('should execute stop on _audio', () => {
        speech.stop();

        expect(speech._audio.stop).toHaveBeenCalled();
      });
    });
  }

  describeCommonSpeech();

  switch (env) {
    case 'babylon':
      describeBabylonSpeech();
      break;

    case 'three':
      describeThreeSpeech();
      break;

    case 'core':
    default:
      describeCoreSpeech();
  }
});
