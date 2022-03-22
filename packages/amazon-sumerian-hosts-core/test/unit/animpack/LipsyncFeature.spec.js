// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-underscore-dangle */
import {Deferred, LipsyncFeature, HostObject, DefaultVisemeMap} from '@amazon-sumerian-hosts/core';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('LipsyncFeature', () => {
  let lipsyncFeature;
  let mockAnimationFeature;
  let host;

  beforeEach(() => {
    host = new HostObject();
    host.addFeature(LipsyncFeature);
    lipsyncFeature = host._features.LipsyncFeature;
    mockAnimationFeature = {
      layers: ['Talk', 'Lipsync'],
      getAnimations: jasmine.createSpy('getAnimations'),
      setLayerWeight: jasmine.createSpy('setLayerWeight'),
      getAnimationType: jasmine.createSpy('getAnimationType'),
      getAnimationBlendNames: jasmine.createSpy('getAnimationBlendNames'),
      resumeAnimation: jasmine.createSpy('resumeAnimation'),
      pauseAnimation: jasmine.createSpy('pauseAnimation'),
      setAnimationBlendWeight: jasmine.createSpy('setAnimationBlendWeight'),
      addLayer: () => {},
      removeLayer: () => {},
      renameLayer: () => {},
      addAnimation: () => {},
      removeAnimation: () => {},
      renameAnimation: () => {},
      EVENTS: {
        addLayer: 'AnimationFeature.onAddLayerEvent',
        removeLayer: 'AnimationFeature.onRemoveLayerEvent',
        renameLayer: 'AnimationFeature.onRenameLayerEvent',
        addAnimation: 'AnimationFeature.onAddAnimationEvent',
        removeAnimation: 'AnimationFeature.onRemovedAnimationEvent',
        renameAnimation: 'AnimationFeature.onRenameAnimationEvent',
      },
    };
    mockAnimationFeature.getAnimations.and.callFake(name => {
      if (name === 'Talk') {
        return ['stand_talk'];
      } else {
        return ['visemes'];
      }
    });
    mockAnimationFeature.getAnimationType.and.callFake(() => 'freeBlend');
    mockAnimationFeature.getAnimationBlendNames.and.callFake(() =>
      Object.keys(DefaultVisemeMap)
    );
    mockAnimationFeature.resumeAnimation.and.callFake(() => Deferred.resolve());
    mockAnimationFeature.setAnimationBlendWeight.and.callFake(() =>
      Deferred.resolve()
    );
    host.AnimationFeature = mockAnimationFeature;
    host._features.AnimationFeature = mockAnimationFeature;
  });

  describe('_registerVisemeAnimation', () => {
    beforeEach(() => {
      lipsyncFeature._managedLayers = {
        Lipsync: {
          isActive: true,
          animations: {
            visemes: {isActive: true, visemeMap: {...DefaultVisemeMap}},
          },
        },
      };
    });

    it("should not update _managedLayers if the animation isn't active", () => {
      lipsyncFeature._managedLayers.Lipsync.animations.visemes.isActive = false;
      const managedLayers = {...lipsyncFeature._managedLayers};
      lipsyncFeature._registerVisemeAnimation('Lipsync', 'visemes');

      expect(lipsyncFeature._managedLayers).toEqual(managedLayers);
    });

    it('should log a warning and deactivate the animation if it is not a freeBlend state', () => {
      mockAnimationFeature.getAnimationType.and.callFake(() => 'single');
      const onWarn = spyOn(console, 'warn');

      expect(
        lipsyncFeature._managedLayers.Lipsync.animations.visemes.isActive
      ).toBeTrue();

      lipsyncFeature._registerVisemeAnimation('Lipsync', 'visemes');

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(
        lipsyncFeature._managedLayers.Lipsync.animations.visemes.isActive
      ).toBeFalse();
    });

    it('should set isActive to true on the visemeMap for any viseme whose name matches a blendWeight name', () => {
      Object.values(
        lipsyncFeature._managedLayers.Lipsync.animations.visemes.visemeMap
      ).forEach(visemeOptions => {
        expect(visemeOptions.isActive).not.toBeDefined();
      });

      lipsyncFeature._registerVisemeAnimation('Lipsync', 'visemes');

      Object.values(
        lipsyncFeature._managedLayers.Lipsync.animations.visemes.visemeMap
      ).forEach(visemeOptions => {
        expect(visemeOptions.isActive).toBeTrue();
      });
    });
  });

  describe('_onFeatureAdded', () => {
    beforeEach(() => {
      host.TextToSpeechFeature = {
        speechmarkOffset: 0,
        EVENTS: {
          play: 'TextToSpeechFeature.onPlayEvent',
          pause: 'TextToSpeechFeature.onPauseEvent',
          resume: 'TextToSpeechFeature.onResumeEvent',
          stop: 'TextToSpeechFeature.onStopEvent',
          sentence: 'TextToSpeechFeature.onSentenceEvent',
          word: 'TextToSpeechFeature.onWordEvent',
          viseme: 'TextToSpeechFeature.onVisemeEvent',
          ssml: 'TextToSpeechFeature.onSsmlEvent',
        },
      };
    });

    it('should set the speechmarkOffset property of the text to speech feature to -_visemeLeadTime if the added feature is TextToSpeechFeature', () => {
      lipsyncFeature._onFeatureAdded('SomeFeature');

      expect(host.TextToSpeechFeature.speechmarkOffset).toEqual(0);

      lipsyncFeature._visemeLeadTime = 50;
      lipsyncFeature._onFeatureAdded('TextToSpeechFeature');

      expect(host.TextToSpeechFeature.speechmarkOffset).toEqual(-50);
    });
  });

  describe('_onLayerAdded', () => {
    let onRegisterVisemeAnimation;

    beforeEach(() => {
      onRegisterVisemeAnimation = spyOn(
        lipsyncFeature,
        '_registerVisemeAnimation'
      );
    });

    it('should execute _registerVisemeAnimation if the layer name is defined in _visemeLayers', () => {
      lipsyncFeature._onLayerAdded({name: 'Lipsync'});

      expect(onRegisterVisemeAnimation).not.toHaveBeenCalled();

      lipsyncFeature._visemeLayers = {Lipsync: 'visemes'};
      lipsyncFeature._onLayerAdded({name: 'Lipsync'});

      expect(onRegisterVisemeAnimation).toHaveBeenCalledWith(
        'Lipsync',
        'visemes'
      );
    });
  });

  describe('_onAnimationAdded', () => {
    let onRegisterVisemeAnimation;

    beforeEach(() => {
      onRegisterVisemeAnimation = spyOn(
        lipsyncFeature,
        '_registerVisemeAnimation'
      );
    });

    it('should execute _registerVisemeAnimation if the layer name is defined in _visemeLayers and its value matches animationName', () => {
      lipsyncFeature._onAnimationAdded({
        layerName: 'Lipsync',
        animationName: 'visemes',
      });

      expect(onRegisterVisemeAnimation).not.toHaveBeenCalled();

      lipsyncFeature._visemeLayers = {Lipsync: 'visemes'};
      lipsyncFeature._onAnimationAdded({
        layerName: 'Lipsync',
        animationName: 'visemes',
      });

      expect(onRegisterVisemeAnimation).toHaveBeenCalledWith(
        'Lipsync',
        'visemes'
      );
    });
  });

  describe('_onPlay', () => {
    let onEnable;
    beforeEach(() => {
      onEnable = spyOn(lipsyncFeature, 'enable');
      lipsyncFeature._managedLayers = {
        Lipsync: {
          isActive: true,
          animations: {
            visemes: {isActive: true, visemeMap: {...DefaultVisemeMap}},
          },
        },
        Talking: {
          isActive: false,
          animations: {
            stand_talk: {isActive: false},
          },
        },
      };
      lipsyncFeature._visemeLayers = {Lipsync: 'visemes'};
      lipsyncFeature._talkingLayers = {Talking: 'stand_talk'};
    });

    it('should execute enable', () => {
      lipsyncFeature._onPlay();

      expect(onEnable).toHaveBeenCalledTimes(1);
    });

    it('should execute resumeAnimation on any active managed animations', () => {
      lipsyncFeature._onPlay();

      expect(mockAnimationFeature.resumeAnimation).toHaveBeenCalledWith(
        'Lipsync',
        'visemes'
      );

      expect(mockAnimationFeature.resumeAnimation).not.toHaveBeenCalledWith(
        'Talk',
        'stand_talk'
      );
    });
  });

  describe('_onPause', () => {
    let onStop;

    beforeEach(() => {
      onStop = spyOn(lipsyncFeature, '_onStop');
    });

    it('should execute _onStop', () => {
      lipsyncFeature._onPause();

      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('_onResume', () => {
    let onPlay;

    beforeEach(() => {
      onPlay = spyOn(lipsyncFeature, '_onPlay');
    });

    it('should execute _onPlay', () => {
      lipsyncFeature._onResume();

      expect(onPlay).toHaveBeenCalledTimes(1);
    });
  });

  describe('_onStop', () => {
    let onDisable;
    beforeEach(() => {
      onDisable = spyOn(lipsyncFeature, 'disable');
      lipsyncFeature._managedLayers = {
        Lipsync: {
          isActive: true,
          animations: {
            visemes: {isActive: true, visemeMap: {...DefaultVisemeMap}},
          },
        },
        Talking: {
          isActive: false,
          animations: {
            stand_talk: {isActive: false},
          },
        },
      };
      lipsyncFeature._visemeLayers = {Lipsync: 'visemes'};
      lipsyncFeature._talkingLayers = {Talking: 'stand_talk'};
    });

    it('should execute disable', () => {
      lipsyncFeature._onStop();

      expect(onDisable).toHaveBeenCalledTimes(1);
    });

    it('should execute pauseAnimation on any active managed animations', () => {
      lipsyncFeature._onStop();

      expect(mockAnimationFeature.pauseAnimation).toHaveBeenCalledWith(
        'Lipsync',
        'visemes'
      );

      expect(mockAnimationFeature.pauseAnimation).not.toHaveBeenCalledWith(
        'Talk',
        'stand_talk'
      );
    });
  });

  describe('_onViseme', () => {
    let onAnimateSimpleViseme;
    let onAnimateHeldViseme;

    beforeEach(() => {
      onAnimateSimpleViseme = spyOn(lipsyncFeature, '_animateSimpleViseme');
      onAnimateHeldViseme = spyOn(lipsyncFeature, '_animateHeldViseme');
      const visemeMap = {...DefaultVisemeMap};
      Object.values(visemeMap).forEach(visemeOptions => {
        visemeOptions.isActive = true;
        visemeOptions.decayRate = {amount: 0.5, seconds: 0.5};
      });
      lipsyncFeature._managedLayers = {
        Lipsync: {
          isActive: true,
          animations: {
            visemes: {isActive: true, visemeMap},
          },
        },
      };

      lipsyncFeature._visemeLayers = {Lipsync: 'visemes'};
    });

    it('should not execute _animateSimpleViseme or _animateHeldViseme if there are no active viseme animations', () => {
      lipsyncFeature._managedLayers.Lipsync.animations.visemes.isActive = false;
      lipsyncFeature._onViseme({mark: {value: 'sil'}});

      expect(onAnimateSimpleViseme).not.toHaveBeenCalled();
      expect(onAnimateHeldViseme).not.toHaveBeenCalled();
    });

    it('should not execute _animateSimpleViseme or _animateHeldViseme if the viseme in visemeMap matching mark.value is not active', () => {
      lipsyncFeature._managedLayers.Lipsync.animations.visemes.visemeMap.sil.isActive = false;
      lipsyncFeature._onViseme({mark: {value: 'sil'}});

      expect(onAnimateSimpleViseme).not.toHaveBeenCalled();
      expect(onAnimateHeldViseme).not.toHaveBeenCalled();
    });

    it('should not execute _animateSimpleViseme or _animateHeldViseme if there is no viseme in visemeMap that matches mark.value', () => {
      lipsyncFeature._onViseme({mark: {value: 'someViseme'}});

      expect(onAnimateSimpleViseme).not.toHaveBeenCalled();
      expect(onAnimateHeldViseme).not.toHaveBeenCalled();
    });

    it("should execute _animateSimpleViseme if mark.duration is less than the viseme's blendTime", () => {
      const {
        visemeMap,
      } = lipsyncFeature._managedLayers.Lipsync.animations.visemes;
      visemeMap.sil.blendTime = 0.25;
      lipsyncFeature._onViseme({mark: {value: 'sil', duration: 10}});

      expect(onAnimateSimpleViseme).toHaveBeenCalledTimes(1);
    });

    it("should execute _animateHeldViseme if mark.duration is greater than the viseme's blendTime", () => {
      const {
        visemeMap,
      } = lipsyncFeature._managedLayers.Lipsync.animations.visemes;
      visemeMap.sil.blendTime = 0;
      lipsyncFeature._onViseme({mark: {value: 'sil', duration: 500}});

      expect(onAnimateHeldViseme).toHaveBeenCalledTimes(1);
    });
  });

  describe('_animateSimpleViseme', () => {
    it('should execute AnimationFeature.setAnimationBlendWeight once if setAnimationBlendWeight is called again externally before it finishes', () => {
      mockAnimationFeature.setAnimationBlendWeight.and.callFake(() => {
        mockAnimationFeature.weightPromise = new Deferred();
        return mockAnimationFeature.weightPromise;
      });
      lipsyncFeature._animateSimpleViseme('Lipsync', 'visemes', 'sil', 1);

      expect(
        mockAnimationFeature.setAnimationBlendWeight
      ).toHaveBeenCalledTimes(1);
      mockAnimationFeature.weightPromise.cancel();

      Promise.resolve().then(() => {
        expect(
          mockAnimationFeature.setAnimationBlendWeight
        ).toHaveBeenCalledTimes(1);
      });
    });

    it('should execute AnimationFeature.setAnimationBlendWeight twice if setAnimationBlendWeight is not called again externally before it finishes', async () => {
      lipsyncFeature._animateSimpleViseme('Lipsync', 'visemes', 'sil', 1);
      await Promise.resolve();

      expect(
        mockAnimationFeature.setAnimationBlendWeight
      ).toHaveBeenCalledTimes(2);
    });
  });

  describe('_animateHeldViseme', () => {
    it('should execute AnimationFeature.setAnimationBlendWeight once if setAnimationBlendWeight is called again externally before it finishes', () => {
      mockAnimationFeature.setAnimationBlendWeight.and.callFake(() => {
        mockAnimationFeature.weightPromise = new Deferred();
        return mockAnimationFeature.weightPromise;
      });
      lipsyncFeature._animateHeldViseme('Lipsync', 'visemes', 'sil', 1, 0.5);

      expect(
        mockAnimationFeature.setAnimationBlendWeight
      ).toHaveBeenCalledTimes(1);
      mockAnimationFeature.weightPromise.cancel();

      Promise.resolve().then(() => {
        expect(
          mockAnimationFeature.setAnimationBlendWeight
        ).toHaveBeenCalledTimes(1);
      });
    });

    it('should execute AnimationFeature.setAnimationBlendWeight three times if setAnimationBlendWeight is not called again externally before it finishes', async () => {
      mockAnimationFeature.setAnimationBlendWeight.and.callFake(() => {
        mockAnimationFeature.weightPromise = Promise.resolve();
        return mockAnimationFeature.weightPromise;
      });
      lipsyncFeature._animateHeldViseme('Lipsync', 'visemes', 'sil', 1, 0.5);
      await mockAnimationFeature.weightPromise;
      await mockAnimationFeature.weightPromise;
      await mockAnimationFeature.weightPromise;

      expect(
        mockAnimationFeature.setAnimationBlendWeight
      ).toHaveBeenCalledTimes(3);
    });
  });

  describe('registerVisemeLayer', () => {
    it('should execute registerLayer before _registerVisemeAnimation', () => {
      const onRegisterLayer = spyOn(lipsyncFeature, 'registerLayer');
      const onRegisterVisemeAnimation = spyOn(
        lipsyncFeature,
        '_registerVisemeAnimation'
      );
      lipsyncFeature.registerVisemeLayer('Lipsync', {animations: 'viseme'});

      expect(onRegisterLayer).toHaveBeenCalledBefore(onRegisterVisemeAnimation);
    });

    it('should add a key to _visemeLayers', () => {
      const visemeLayers = {...lipsyncFeature._visemeLayers};

      expect(lipsyncFeature._visemeLayers.Lipsync).not.toBeDefined();

      lipsyncFeature.registerVisemeLayer('Lipsync', {animations: 'viseme'});

      expect(visemeLayers).not.toEqual(lipsyncFeature._visemeLayers);
      expect(lipsyncFeature._visemeLayers.Lipsync).toBeDefined();
    });
  });

  describe('registerTalkingLayer', () => {
    it('should execute registerLayer', () => {
      const onRegisterLayer = spyOn(lipsyncFeature, 'registerLayer');
      lipsyncFeature.registerTalkingLayer('Talk', {animations: 'stand_talk'});

      expect(onRegisterLayer).toHaveBeenCalledTimes(1);
    });

    it('should add a key to _talkingLayers', () => {
      const talkingLayers = {...lipsyncFeature._talkingLayers};

      expect(lipsyncFeature._talkingLayers.Talk).not.toBeDefined();

      lipsyncFeature.registerTalkingLayer('Talk', {animations: 'stand_talk'});

      expect(talkingLayers).not.toEqual(lipsyncFeature._talkingLayers);
      expect(lipsyncFeature._talkingLayers.Talk).toBeDefined();
    });
  });
});
