// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-underscore-dangle */
import {GestureFeature, DefaultGestureWords, HostObject, Deferred, Utils} from '@amazon-sumerian-hosts/core';
import describeEnvironment from './EnvironmentHarness';

describeEnvironment('GestureFeature', () => {
  let gestureFeature;
  let mockAnimationFeature;
  let host;

  beforeEach(() => {
    host = new HostObject();
    host.addFeature(GestureFeature);
    gestureFeature = host._features.GestureFeature;
    mockAnimationFeature = {
      layers: ['Gesture'],
      getAnimations: jasmine.createSpy('getAnimations'),
      setLayerWeight: jasmine.createSpy('setLayerWeight'),
      getAnimationType: jasmine.createSpy('getAnimationType'),
      getPaused: jasmine.createSpy('getPaused'),
      playAnimation: jasmine.createSpy('playAnimation'),
      playNextAnimation: jasmine.createSpy('playNextAnimation'),
      resumeAnimation: jasmine.createSpy('resumeAnimation'),
      pauseAnimation: jasmine.createSpy('pauseAnimation'),
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
        stopAnimation: 'AnimationFeature.onStopEvent',
        playNextAnimation: 'AnimationFeature.onNextEvent',
      },
    };
    mockAnimationFeature.getAnimations.and.callFake(() => {
      return ['gestureA', 'gestureB', 'gestureC'];
    });
    mockAnimationFeature.getAnimationType.and.callFake(() => 'queue');
    mockAnimationFeature.playAnimation.and.callFake(() => new Deferred());
    mockAnimationFeature.resumeAnimation.and.callFake(() => new Deferred());
    host.AnimationFeature = mockAnimationFeature;
    host._features.AnimationFeature = mockAnimationFeature;
  });

  describe('_getHoldTime', () => {
    it("should return the feature's holdTime value if holdTime is not defined on the layer or animation objects", () => {
      gestureFeature.holdTime = 5;

      expect(gestureFeature._getHoldTime({}, {})).toEqual(5);
    });

    it("should return the layer's holdTime value if holdTime is defined on the layer object but not the animation object", () => {
      gestureFeature.holdTime = 5;

      expect(gestureFeature._getHoldTime({holdTime: 3}, {})).toEqual(3);
    });

    it("should return the animation's holdTime value if holdTime is defined on the animation object but not the layer object", () => {
      gestureFeature.holdTime = 5;

      expect(gestureFeature._getHoldTime({}, {holdTime: 4})).toEqual(4);
    });

    it("should return the animation's holdTime value if holdTime is defined on both the animation object and the layer object", () => {
      gestureFeature.holdTime = 5;

      expect(gestureFeature._getHoldTime({holdTime: 3}, {holdTime: 4})).toEqual(
        4
      );
    });
  });

  describe('_getMinimumInterval', () => {
    it("should return the feature's minimumInterval value if holdTime is not defined on the layer or animation objects", () => {
      gestureFeature.minimumInterval = 5;

      expect(gestureFeature._getMinimumInterval({}, {})).toEqual(5);
    });

    it("should return the layer's minimumInterval value if minimumInterval is defined on the layer object but not the animation object", () => {
      gestureFeature.minimumInterval = 5;

      expect(
        gestureFeature._getMinimumInterval({minimumInterval: 3}, {})
      ).toEqual(3);
    });

    it("should return the animation's minimumInterval value if minimumInterval is defined on the animation object but not the layer object", () => {
      gestureFeature.minimumInterval = 5;

      expect(
        gestureFeature._getMinimumInterval({}, {minimumInterval: 4})
      ).toEqual(4);
    });

    it("should return the animation's minimumInterval value if minimumInterval is defined on both the animation object and the layer object", () => {
      gestureFeature.minimumInterval = 5;

      expect(
        gestureFeature._getMinimumInterval(
          {minimumInterval: 3},
          {minimumInterval: 4}
        )
      ).toEqual(4);
    });
  });

  describe('_onNext', () => {
    it('should cancel the stored holdTimer if the following conditions are met: the animation is registered and active, matches the current gesture for the layer, cannot advance and is not the end of the queue', () => {
      const holdTimer = new Deferred();
      gestureFeature._managedLayers = {
        Gesture: {
          holdTimer,
          currentGesture: null,
          animations: {big: {words: DefaultGestureWords.big}},
        },
      };
      const onCancel = spyOn(holdTimer, 'cancel');

      gestureFeature._onNext({
        layerName: 'NotGesture',
        animationName: 'notBig',
        canAdvance: false,
        isQueueEnd: false,
      });

      expect(onCancel).not.toHaveBeenCalled();

      gestureFeature._onNext({
        layerName: 'Gesture',
        animationName: 'notBig',
        canAdvance: false,
        isQueueEnd: false,
      });

      expect(onCancel).not.toHaveBeenCalled();

      gestureFeature._onNext({
        layerName: 'Gesture',
        animationName: 'big',
        canAdvance: true,
        isQueueEnd: false,
      });

      expect(onCancel).not.toHaveBeenCalled();

      gestureFeature._onNext({
        layerName: 'Gesture',
        animationName: 'big',
        canAdvance: false,
        isQueueEnd: true,
      });

      expect(onCancel).not.toHaveBeenCalled();

      gestureFeature._onNext({
        layerName: 'Gesture',
        animationName: 'big',
        canAdvance: false,
        isQueueEnd: false,
      });

      expect(onCancel).not.toHaveBeenCalled();

      gestureFeature._managedLayers.Gesture.currentGesture = 'big';
      gestureFeature._onNext({
        layerName: 'Gesture',
        animationName: 'big',
        canAdvance: false,
        isQueueEnd: false,
      });

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should execute playNextAnimation after canceling the holdTimer if the holdTime is not greater than 0', () => {
      const holdTimer = new Deferred();
      gestureFeature._managedLayers = {
        Gesture: {
          holdTimer,
          currentGesture: 'big',
          holdTime: 0,
          animations: {big: {words: DefaultGestureWords.big}},
        },
      };
      const onCancel = spyOn(holdTimer, 'cancel');
      gestureFeature._onNext({
        layerName: 'Gesture',
        animationName: 'big',
        canAdvance: false,
        isQueueEnd: false,
      });

      expect(onCancel).toHaveBeenCalledBefore(
        mockAnimationFeature.playNextAnimation
      );

      expect(mockAnimationFeature.playNextAnimation).toHaveBeenCalledWith(
        'Gesture',
        'big'
      );
    });

    it('should execute Utils.wait after canceling the holdTimer if the holdTime is greater than 0', () => {
      const holdTimer = new Deferred();
      gestureFeature._managedLayers = {
        Gesture: {
          holdTimer,
          currentGesture: 'big',
          holdTime: 1,
          animations: {big: {words: DefaultGestureWords.big}},
        },
      };
      const onCancel = spyOn(holdTimer, 'cancel');
      const onWait = spyOn(Utils, 'wait');
      gestureFeature._onNext({
        layerName: 'Gesture',
        animationName: 'big',
        canAdvance: false,
        isQueueEnd: false,
      });

      expect(onCancel).toHaveBeenCalledBefore(onWait);
    });
  });

  describe('_onStop', () => {
    it("should set the layer's currentGesture and playTimer to null and cancel its holdTimer if the animation is registered and matches the currentGesture", () => {
      const holdTimer = new Deferred();
      gestureFeature._managedLayers = {
        Gesture: {
          holdTimer,
          currentGesture: 'notBig',
          playTimer: 5,
          animations: {big: {words: DefaultGestureWords.big}},
        },
      };
      const layer = gestureFeature._managedLayers.Gesture;
      const onCancel = spyOn(holdTimer, 'cancel');
      gestureFeature._onStop({layerName: 'NotGesture', animationName: 'big'});

      expect(layer.currentGesture).toEqual('notBig');
      expect(layer.playTimer).toEqual(5);
      expect(onCancel).not.toHaveBeenCalled();

      gestureFeature._onStop({layerName: 'Gesture', animationName: 'notBig'});

      expect(layer.currentGesture).toEqual('notBig');
      expect(layer.playTimer).toEqual(5);
      expect(onCancel).not.toHaveBeenCalled();

      layer.currentGesture = 'big';
      gestureFeature._onStop({layerName: 'Gesture', animationName: 'big'});

      expect(layer.currentGesture).toEqual(null);
      expect(layer.playTimer).toEqual(null);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("should execute setLayerWeights after canceling the holdTimer if the layer's autoDisable property is true", () => {
      const holdTimer = new Deferred();
      gestureFeature._managedLayers = {
        Gesture: {
          holdTimer,
          currentGesture: 'big',
          playTimer: 5,
          autoDisable: false,
          animations: {big: {words: DefaultGestureWords.big}},
        },
      };
      const onCancel = spyOn(holdTimer, 'cancel');
      const onSetLayerWeights = spyOn(gestureFeature, 'setLayerWeights');
      gestureFeature._onStop({layerName: 'Gesture', animationName: 'big'});

      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onSetLayerWeights).not.toHaveBeenCalled();

      gestureFeature._managedLayers = {
        Gesture: {
          holdTimer,
          currentGesture: 'big',
          playTimer: 5,
          autoDisable: true,
          animations: {big: {words: DefaultGestureWords.big}},
        },
      };
      gestureFeature._onStop({layerName: 'Gesture', animationName: 'big'});

      expect(onCancel).toHaveBeenCalledBefore(onSetLayerWeights);
      expect(onSetLayerWeights).toHaveBeenCalledTimes(1);
    });
  });

  describe('registerLayer', () => {
    it('should automatically register every animation on the layer if the layer currently exists', () => {
      const onRegisterAnimation = spyOn(gestureFeature, 'registerAnimation');
      gestureFeature.registerLayer('Gesture');

      expect(onRegisterAnimation).toHaveBeenCalledWith(
        'Gesture',
        'gestureA',
        undefined
      );

      expect(onRegisterAnimation).toHaveBeenCalledWith(
        'Gesture',
        'gestureB',
        undefined
      );

      expect(onRegisterAnimation).toHaveBeenCalledWith(
        'Gesture',
        'gestureC',
        undefined
      );

      expect(onRegisterAnimation).toHaveBeenCalledTimes(3);
    });

    it("should register an animation with an options object if the animation is defined in the layer's options object", () => {
      const onRegisterAnimation = spyOn(gestureFeature, 'registerAnimation');
      onRegisterAnimation.and.callFake(
        (layerName, animationName, options = {}) => {
          gestureFeature._managedLayers[layerName].animations[
            animationName
          ] = options;
        }
      );
      gestureFeature.registerLayer('Gesture', {
        animations: {gestureB: {holdTime: 5}},
      });

      expect(onRegisterAnimation).toHaveBeenCalledWith(
        'Gesture',
        'gestureA',
        undefined
      );

      expect(onRegisterAnimation).toHaveBeenCalledWith('Gesture', 'gestureB', {
        holdTime: 5,
      });

      expect(onRegisterAnimation).toHaveBeenCalledWith(
        'Gesture',
        'gestureC',
        undefined
      );

      expect(onRegisterAnimation).toHaveBeenCalledTimes(3);
    });
  });

  describe('registerAnimation', () => {
    it('should add a words array to the options object if none was defined', () => {
      const onRegisterAnimation = spyOn(
        Object.getPrototypeOf(GestureFeature).prototype,
        'registerAnimation'
      );
      gestureFeature.registerAnimation('Gesture', 'testGesture1');

      expect(onRegisterAnimation).toHaveBeenCalledWith(
        'Gesture',
        'testGesture1',
        {words: []}
      );

      gestureFeature.registerAnimation('Gesture', 'testGesture2', {
        notWords: 'notAnArray',
      });

      expect(onRegisterAnimation).toHaveBeenCalledWith(
        'Gesture',
        'testGesture2',
        {notWords: 'notAnArray', words: []}
      );
    });

    it('should use a words array from the DefaultGestureWords object if no words are defined and the gesture name can be found in the DefaultGestureWords object', () => {
      const onRegisterAnimation = spyOn(
        Object.getPrototypeOf(GestureFeature).prototype,
        'registerAnimation'
      );
      gestureFeature.registerAnimation('Gesture', 'testGesture1');

      expect(onRegisterAnimation).toHaveBeenCalledWith(
        'Gesture',
        'testGesture1',
        {words: []}
      );

      gestureFeature.registerAnimation('Gesture', 'big');

      expect(onRegisterAnimation).toHaveBeenCalledWith('Gesture', 'big', {
        words: DefaultGestureWords.big,
      });
    });
  });

  describe('createGestureMap', () => {
    it('should return an object that maps a stringified object containing feature, method and args properties for each registered gesture to its words array', () => {
      expect(gestureFeature.createGestureMap()).toEqual({});

      gestureFeature._managedLayers = {
        Gesture: {animations: {big: {words: DefaultGestureWords.big}}},
      };
      const key = `{"feature":"GestureFeature","method":"playGesture","args":["Gesture","big",{}]}`;

      expect(gestureFeature.createGestureMap()).toEqual({
        [key]: DefaultGestureWords.big,
      });
    });
  });

  describe('createGenericGestureArray', () => {
    it('should return an array of stringified objects containing feature, method and args properties for each registered gesture with an empty words array', () => {
      expect(gestureFeature.createGenericGestureArray()).toEqual([]);

      gestureFeature._managedLayers = {
        Gesture: {animations: {big: {words: DefaultGestureWords.big}}},
      };

      expect(gestureFeature.createGenericGestureArray()).toEqual([]);

      gestureFeature._managedLayers.Gesture.animations.small = {words: []};

      const key = `{"feature":"GestureFeature","method":"playGesture","args":["Gesture","small",{}]}`;

      expect(gestureFeature.createGenericGestureArray()).toEqual([key]);
    });
  });

  describe('playGesture', () => {
    let onWarn;

    beforeEach(() => {
      onWarn = spyOn(console, 'warn');
      mockAnimationFeature.getAnimations.and.callFake(() => {
        return ['big'];
      });
      gestureFeature._managedLayers = {
        Gesture: {
          isActive: true,
          playTimer: null,
          holdTimer: new Deferred(),
          animations: {big: {words: DefaultGestureWords.big, isActive: false}},
        },
      };
    });

    it("should execute registerAnimation if the layer hasn't already been registered", () => {
      const result = gestureFeature.playGesture('NotGesture', 'someAnimation');

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Deferred);
      expect(result.canceled).toBeTrue();
      return expectAsync(result).toBeResolved();
    });

    it("should execute registerAnimation if the animation hasn't already been registered", () => {
      const result = gestureFeature.playGesture('Gesture', 'someAnimation');

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Deferred);
      expect(result.canceled).toBeTrue();
      return expectAsync(result).toBeResolved();
    });

    it('should log a warning and return a canceled Deferred promise if the animation is not active', async () => {
      let result = gestureFeature.playGesture('Gesture', 'big');

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Deferred);
      expect(result.canceled).toBeTrue();
      await expectAsync(result).toBeResolved();

      gestureFeature._managedLayers.Gesture.animations.big.isActive = true;
      result = gestureFeature.playGesture('Gesture', 'big');

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Deferred);
      expect(result.pending).toBeTrue();
    });

    it('should log a warning and return a canceled Deferred promise if the animation is the current gesture and the force parameter is false', async () => {
      gestureFeature._managedLayers.Gesture.currentGesture = 'big';
      gestureFeature._managedLayers.Gesture.animations.big.isActive = true;
      let result = gestureFeature.playGesture('Gesture', 'big', {force: true});

      expect(onWarn).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Deferred);
      expect(result.pending).toBeTrue();

      result = gestureFeature.playGesture('Gesture', 'big', {force: false});

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Deferred);
      expect(result.canceled).toBeTrue();
      await expectAsync(result).toBeResolved();
    });

    it("should log a warning and return a canceled Deferred promise if the playTimer isn't null and is less than the minimum interval", async () => {
      gestureFeature._managedLayers.Gesture.animations.big.isActive = true;
      gestureFeature._managedLayers.Gesture.playTimer = 1;
      let result = gestureFeature.playGesture('Gesture', 'big', {
        minimumInterval: 0.5,
      });

      expect(onWarn).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Deferred);
      expect(result.pending).toBeTrue();

      result = gestureFeature.playGesture('Gesture', 'big', {
        minimumInterval: 3,
      });

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Deferred);
      expect(result.canceled).toBeTrue();
      await expectAsync(result).toBeResolved();
    });

    it("should set the layer's currentGesture to the new animation, the playTimer to 0 if no warnings have been logged", () => {
      gestureFeature._managedLayers.Gesture.animations.big.isActive = true;
      gestureFeature._managedLayers.Gesture.currentGesture = null;
      gestureFeature._managedLayers.Gesture.playTimer = null;
      gestureFeature.playGesture('Gesture', 'big');

      expect(onWarn).not.toHaveBeenCalled();
      expect(gestureFeature._managedLayers.Gesture.playTimer).toEqual(0);
      expect(gestureFeature._managedLayers.Gesture.currentGesture).toEqual(
        'big'
      );

      gestureFeature._managedLayers.Gesture.animations.big.isActive = false;
      gestureFeature._managedLayers.Gesture.currentGesture = null;
      gestureFeature._managedLayers.Gesture.playTimer = null;
      gestureFeature.playGesture('Gesture', 'big');

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(gestureFeature._managedLayers.Gesture.playTimer).toEqual(null);
      expect(gestureFeature._managedLayers.Gesture.currentGesture).toEqual(
        null
      );
    });

    it('should execute setLayerWeights if the layer is set to autoDisable and no warnings have been logged', () => {
      const onSetLayerWeights = spyOn(gestureFeature, 'setLayerWeights');
      gestureFeature._managedLayers.Gesture.animations.big.isActive = false;
      gestureFeature._managedLayers.Gesture.currentGesture = null;
      gestureFeature.playGesture('Gesture', 'big', {minimumInterval: 0});

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(onSetLayerWeights).not.toHaveBeenCalled();

      gestureFeature._managedLayers.Gesture.animations.big.isActive = true;
      gestureFeature._managedLayers.Gesture.currentGesture = null;
      gestureFeature._managedLayers.Gesture.autoDisable = false;
      gestureFeature.playGesture('Gesture', 'big', {minimumInterval: 0});

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(onSetLayerWeights).not.toHaveBeenCalled();

      gestureFeature._managedLayers.Gesture.currentGesture = null;
      gestureFeature._managedLayers.Gesture.autoDisable = true;
      gestureFeature.playGesture('Gesture', 'big', {minimumInterval: 0});

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(onSetLayerWeights).toHaveBeenCalledTimes(1);
    });

    it('should execute AnimationFeature.playAnimation and return a pending promise if no warnings have been logged', async () => {
      gestureFeature._managedLayers.Gesture.animations.big.isActive = true;
      gestureFeature._managedLayers.Gesture.currentGesture = null;
      let result = gestureFeature.playGesture('Gesture', 'big', {
        minimumInterval: 0,
      });

      expect(mockAnimationFeature.playAnimation).toHaveBeenCalledTimes(1);
      expect(onWarn).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(Deferred);
      expect(result.pending).toBeTrue();

      gestureFeature._managedLayers.Gesture.animations.big.isActive = false;
      result = gestureFeature.playGesture('Gesture', 'big', {
        minimumInterval: 0,
      });

      expect(mockAnimationFeature.playAnimation).toHaveBeenCalledTimes(1);
      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Deferred);
      expect(result.canceled).toBeTrue();
      await expectAsync(result).toBeResolved();
    });
  });

  describe('update', () => {
    let onExecute;

    beforeEach(() => {
      const holdTimer = new Deferred();
      gestureFeature._managedLayers = {
        Gesture: {
          holdTimer,
          playTimer: null,
          animations: {big: {words: DefaultGestureWords.big}},
        },
      };
      onExecute = spyOn(holdTimer, 'execute');
    });

    it("should execute the holdTimer for active layers that aren't paused", () => {
      gestureFeature.update(100);

      expect(onExecute).not.toHaveBeenCalled();

      gestureFeature._managedLayers.Gesture.isActive = true;
      mockAnimationFeature.getPaused.and.callFake(() => true);
      gestureFeature.update(100);

      expect(onExecute).not.toHaveBeenCalled();

      mockAnimationFeature.getPaused.and.callFake(() => false);
      gestureFeature.update(100);

      expect(onExecute).toHaveBeenCalledWith(100);
    });

    it('should increment non-null layer playTimers in seconds after executing the holdTimer', () => {
      gestureFeature._managedLayers.Gesture.isActive = true;
      mockAnimationFeature.getPaused.and.callFake(() => false);

      gestureFeature.update(100);

      expect(onExecute).toHaveBeenCalledWith(100);
      expect(gestureFeature._managedLayers.Gesture.playTimer).toEqual(null);

      gestureFeature._managedLayers.Gesture.playTimer = 2;
      gestureFeature.update(100);

      expect(onExecute).toHaveBeenCalledWith(100);
      expect(gestureFeature._managedLayers.Gesture.playTimer).toEqual(2.1);
    });
  });
});
