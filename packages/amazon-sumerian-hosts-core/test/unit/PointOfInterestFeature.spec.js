// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-underscore-dangle */
import {PointOfInterestFeature, HostObject, Deferred} from '@amazon-sumerian-hosts/core';
import describeEnvironment from './EnvironmentHarness';

describeEnvironment('PointOfInterestFeature', ({owner}) => {
  let poiFeature;
  let mockAnimationFeature;
  let host;

  beforeEach(() => {
    host = new HostObject();
    host.addFeature(PointOfInterestFeature, false, {lookTracker: owner});
    poiFeature = host._features.PointOfInterestFeature;
    mockAnimationFeature = {
      layers: ['Blink', 'Look'],
      getAnimations: jasmine.createSpy('getAnimations'),
      setLayerWeight: jasmine.createSpy('setLayerWeight'),
      getAnimationType: jasmine.createSpy('getAnimationType'),
      getAnimationBlendNames: jasmine.createSpy('getAnimationBlendNames'),
      playAnimation: jasmine.createSpy('playAnimation'),
      resumeAnimation: jasmine.createSpy('resumeAnimation'),
      pauseAnimation: jasmine.createSpy('pauseAnimation'),
      getAnimationBlendWeight: jasmine.createSpy('getAnimationBlendWeight'),
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
      if (name === 'Blink') {
        return ['blink'];
      } else {
        return ['look'];
      }
    });
    mockAnimationFeature.getAnimationType.and.callFake(() => 'blend2d');
    mockAnimationFeature.resumeAnimation.and.callFake(() => Deferred.resolve());
    mockAnimationFeature.getAnimationBlendWeight.and.callFake(() => 0);
    host.AnimationFeature = mockAnimationFeature;
    host._features.AnimationFeature = mockAnimationFeature;
  });

  describe('_registerLookAnimation', () => {
    beforeEach(() => {
      poiFeature._managedLayers = {
        Look: {
          isActive: true,
          animations: {
            look: {isActive: true},
          },
        },
      };
    });

    it("should not update _managedLayers if the animation isn't active", () => {
      poiFeature._managedLayers.Look.animations.look.isActive = false;
      const managedLayers = {...poiFeature._managedLayers};
      poiFeature._registerLookAnimation('Look', 'look');

      expect(poiFeature._managedLayers).toEqual(managedLayers);
    });

    it('should log a warning and deactivate the animation if it is not a blend2d state', () => {
      mockAnimationFeature.getAnimationType.and.callFake(() => 'single');
      const onWarn = spyOn(console, 'warn');

      expect(
        poiFeature._managedLayers.Look.animations.look.isActive
      ).toBeTrue();

      poiFeature._registerLookAnimation('Look', 'look');

      expect(onWarn).toHaveBeenCalledTimes(1);
      expect(
        poiFeature._managedLayers.Look.animations.look.isActive
      ).toBeFalse();
    });
  });

  describe('_onLayerAdded', () => {
    let onRegisterLookAnimation;

    beforeEach(() => {
      onRegisterLookAnimation = spyOn(poiFeature, '_registerLookAnimation');
    });

    it('should execute _registerLookAnimation if the layer name is defined in _lookLayers', () => {
      poiFeature._onLayerAdded({name: 'Look'});

      expect(onRegisterLookAnimation).not.toHaveBeenCalled();

      poiFeature._lookLayers = {Look: 'look'};
      poiFeature._onLayerAdded({name: 'Look'});

      expect(onRegisterLookAnimation).toHaveBeenCalledWith('Look', 'look');
    });
  });

  describe('_onAnimationAdded', () => {
    let onRegisterLookAnimation;

    beforeEach(() => {
      onRegisterLookAnimation = spyOn(poiFeature, '_registerLookAnimation');
    });

    it('should execute _registerLookAnimation if the layer name is defined in _lookLayers and its value matches animationName', () => {
      poiFeature._onAnimationAdded({
        layerName: 'Look',
        animationName: 'look',
      });

      expect(onRegisterLookAnimation).not.toHaveBeenCalled();

      poiFeature._lookLayers = {Look: 'look'};
      poiFeature._onAnimationAdded({
        layerName: 'Look',
        animationName: 'look',
      });

      expect(onRegisterLookAnimation).toHaveBeenCalledWith('Look', 'look');
    });
  });

  describe('_addTrackingConfig', () => {
    it('should return an object stored in _trackingConfigs whose reference and forwardAxis properties match the input object, if one exists', () => {
      const reference = {};
      poiFeature._trackingConfigs = [{reference, forwardAxis: 'PositiveZ'}];
      const inputConfig = {reference, forwardAxis: 'PositiveZ'};
      const result = poiFeature._addTrackingConfig(inputConfig);

      expect(result).not.toBe(inputConfig);
      expect(result).toBe(poiFeature._trackingConfigs[0]);
      expect(poiFeature._trackingConfigs.length).toEqual(1);
    });

    it('should should add angles and prevAngles object properties to the input object if no stored _trackingConfigs match its reference and forwardAxis properties', () => {
      const inputConfig = {reference: {}, forwardAxis: 'PositiveZ'};
      poiFeature._addTrackingConfig(inputConfig);

      expect(inputConfig.angles).toBeDefined();
      expect(inputConfig.prevAngles).toBeDefined();
    });

    it('should add the input object to the _trackingConfigs array if no stored _trackingConfigs match its reference and forwardAxis properties', () => {
      const reference = {};
      poiFeature._trackingConfigs = [{reference, forwardAxis: 'PositiveZ'}];
      poiFeature._addTrackingConfig({reference, forwardAxis: 'PositiveZ'});

      expect(poiFeature._trackingConfigs.length).toEqual(1);

      poiFeature._addTrackingConfig({reference, forwardAxis: 'PositiveY'});

      expect(poiFeature._trackingConfigs.length).toEqual(2);
    });
  });

  describe('_getTargetDistance', () => {
    beforeEach(() => {
      const onGetWorldPosition = spyOn(
        PointOfInterestFeature,
        '_getWorldPosition'
      );
      onGetWorldPosition.and.callFake(obj => obj.position);
      poiFeature._target = {};
      poiFeature._lookTracker = {};
    });

    it('should return the distance between the target and tracker objects', () => {
      poiFeature._target.position = [0, 0, 0];
      poiFeature._lookTracker.position = [0, 10, 0];

      expect(poiFeature._getTargetDistance()).toEqual(10);

      poiFeature._target.position = [0, 0, -8];
      poiFeature._lookTracker.position = [0, 0, 7];

      expect(poiFeature._getTargetDistance()).toEqual(15);

      poiFeature._target.position = [0, 0, 0];
      poiFeature._lookTracker.position = [0, 0, 0];

      expect(poiFeature._getTargetDistance()).toEqual(0);
    });
  });

  describe('_resetLookAngles', () => {
    it('should set the h and v properties of every angle object stored in _trackingConfigs to 0', () => {
      poiFeature._trackingConfigs = [
        {angles: {h: 1, v: 2}},
        {angles: {h: -2, v: 1}},
        {angles: {h: 0, v: -1}},
      ];
      poiFeature._resetLookAngles();
      const allZero = poiFeature._trackingConfigs.every(
        ({angles}) => angles.h === 0 && angles.v === 0
      );

      expect(allZero).toBeTrue();
    });
  });

  describe('_setLookAngles', () => {
    beforeEach(() => {
      poiFeature._target = {};
      const onGetWorldPosition = spyOn(
        PointOfInterestFeature,
        '_getWorldPosition'
      );
      onGetWorldPosition.and.callFake(obj => obj._pos);
    });

    it('should set _isTargetMoving to true if the result of _getWorldPosition on the _target matches the values stored in _prevTargetPos', () => {
      poiFeature._isTargetMoving = true;
      poiFeature._lookTracker._pos = [0, 0, 0];
      poiFeature._target._pos = [1, 2, 3];
      poiFeature._prevTargetPos = [1, 2, 3];
      poiFeature._setLookAngles();

      expect(poiFeature._isTargetMoving).toBeFalse();

      poiFeature._target._pos = [1, 2, 4];
      poiFeature._setLookAngles();

      expect(poiFeature._isTargetMoving).toBeTrue();
    });

    it('should update the angles object in each _trackingConfig object with the difference between the spherical angles from _lookTracker to _target and the spherical angles of the _trackingConfig forwardAxis applied to the reference rotation', () => {
      poiFeature._lookTracker._pos = [0, 0, 0];
      poiFeature._target._pos = [1, 0, 0];
      const config = {
        reference: {_mat: [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1]},
        forwardAxis: [0, 0, 1],
        angles: {h: 0, v: 0},
      };
      poiFeature._trackingConfigs = [config];
      const onGetWorldMatrix = spyOn(PointOfInterestFeature, '_getWorldMatrix');
      onGetWorldMatrix.and.callFake(obj => obj._mat);
      poiFeature._setLookAngles();

      expect(config.angles).toEqual({h: 180, v: 0});

      config.reference._mat = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1];
      poiFeature._setLookAngles();

      expect(config.angles).toEqual({h: 0, v: 0});
    });
  });

  describe('_sphericalToBlendValue', () => {
    it('should return an object whose h property is the phi input value converted to degrees', () => {
      let result = PointOfInterestFeature._sphericalToBlendValue(
        0,
        Math.PI / 2
      );

      expect(result.h).toEqual(90);

      result = PointOfInterestFeature._sphericalToBlendValue(0, -Math.PI / 2);

      expect(result.h).toEqual(-90);

      result = PointOfInterestFeature._sphericalToBlendValue(0, Math.PI);

      expect(result.h).toEqual(180);

      result = PointOfInterestFeature._sphericalToBlendValue(0, -Math.PI);

      expect(result.h).toEqual(-180);
    });

    it('should return an object whose v property is theta input value converted to degrees and offset by -90', () => {
      let result = PointOfInterestFeature._sphericalToBlendValue(
        Math.PI / 2,
        0
      );

      expect(result.v).toEqual(0);

      result = PointOfInterestFeature._sphericalToBlendValue(Math.PI, 0);

      expect(result.v).toEqual(90);
    });
  });

  describe('_getFaceTargetAngles', () => {
    let onGetTargetDistance;

    beforeEach(() => {
      onGetTargetDistance = spyOn(poiFeature, '_getTargetDistance');
      onGetTargetDistance.and.callFake(() => 2);
    });

    it('should return an object whose h and v properties equal 0 if the targetType input is 0', () => {
      expect(poiFeature._getFaceTargetAngles(0)).toEqual({h: 0, v: 0});
    });

    it('should return an object whose h property is negative and v property is 0 if the targetType input is 1', () => {
      const result = poiFeature._getFaceTargetAngles(1);

      expect(result.h).toBeLessThan(0);
      expect(result.v).toEqual(0);
    });

    it('should return an object whose h property is positive and v property is 0 if the targetType input is 2', () => {
      const result = poiFeature._getFaceTargetAngles(2);

      expect(result.h).toBeGreaterThan(0);
      expect(result.v).toEqual(0);
    });

    it('should return an object whose h property is 0 and v property is positive if the targetType input is 3', () => {
      const result = poiFeature._getFaceTargetAngles(3);

      expect(result.h).toEqual(0);
      expect(result.v).toBeGreaterThan(0);
    });

    it('should return smaller values when _getTargetDistance returns larger values', () => {
      const closeLeft = poiFeature._getFaceTargetAngles(1);
      const closeRight = poiFeature._getFaceTargetAngles(2);
      const closeMouth = poiFeature._getFaceTargetAngles(3);

      onGetTargetDistance.and.callFake(() => 4);

      const midLeft = poiFeature._getFaceTargetAngles(1);
      const midRight = poiFeature._getFaceTargetAngles(2);
      const midMouth = poiFeature._getFaceTargetAngles(3);

      onGetTargetDistance.and.callFake(() => 10);

      const farLeft = poiFeature._getFaceTargetAngles(1);
      const farRight = poiFeature._getFaceTargetAngles(2);
      const farMouth = poiFeature._getFaceTargetAngles(3);

      expect(Math.abs(closeLeft.h)).toBeGreaterThan(Math.abs(midLeft.h));
      expect(Math.abs(midLeft.h)).toBeGreaterThan(Math.abs(farLeft.h));

      expect(Math.abs(closeRight.h)).toBeGreaterThan(Math.abs(midRight.h));
      expect(Math.abs(midRight.h)).toBeGreaterThan(Math.abs(farRight.h));

      expect(Math.abs(closeMouth.v)).toBeGreaterThan(Math.abs(midMouth.v));
      expect(Math.abs(midMouth.v)).toBeGreaterThan(Math.abs(farMouth.v));
    });

    it('should clamp the h value between -35, 35 and the v value between -25, 30', () => {
      onGetTargetDistance.and.callFake(() => 0);
      const left = poiFeature._getFaceTargetAngles(1);
      const right = poiFeature._getFaceTargetAngles(2);
      const mouth = poiFeature._getFaceTargetAngles(3);

      expect(left.h).toEqual(-35);
      expect(right.h).toEqual(35);
      expect(mouth.v).toEqual(30);
    });
  });

  describe('_updateLayerSpeed', () => {
    beforeEach(() => {
      poiFeature._managedLayers.eyes = {
        maxHSpeed: 0,
        maxVSpeed: 0,
        hDuration: 0,
        vDuration: 0,
      };
    });

    it('should store new speed and duration values on the layer each time new horizontal and vertical angles are provided', () => {
      let layer = {...poiFeature._managedLayers.eyes};
      poiFeature._updateLayerSpeed('eyes', Math.PI / 4, Math.PI / 4);

      expect(layer).not.toEqual(poiFeature._managedLayers.eyes);

      layer = {...poiFeature._managedLayers.eyes};
      poiFeature._updateLayerSpeed('eyes', Math.PI / 4, Math.PI / 4);

      expect(layer).toEqual(poiFeature._managedLayers.eyes);

      layer = {...poiFeature._managedLayers.eyes};
      poiFeature._updateLayerSpeed('eyes', 0, Math.PI / 8);

      expect(layer).not.toEqual(poiFeature._managedLayers.eyes);
    });
  });

  describe('_setMicroSaccade', () => {
    beforeEach(() => {
      poiFeature._managedLayers.eyes = {
        isActive: true,
        microSaccadeTimer: new Deferred(),
        microSaccade: {h: 0, v: 0},
      };
    });

    it('should update the stored microSaccade values', () => {
      const currentSaccade = {...poiFeature._managedLayers.eyes.microSaccade};
      poiFeature._setMicroSaccade('eyes');

      expect(currentSaccade).not.toEqual(
        poiFeature._managedLayers.eyes.microSaccade
      );

      expect(typeof poiFeature._managedLayers.eyes.microSaccade.h).toEqual(
        'number'
      );

      expect(typeof poiFeature._managedLayers.eyes.microSaccade.v).toEqual(
        'number'
      );
    });

    it('should execute _updateLayerSpeed using the new microSaccade values', () => {
      const onUpdateLayerSpeed = spyOn(poiFeature, '_updateLayerSpeed');
      poiFeature._setMicroSaccade('eyes');
      const {h, v} = poiFeature._managedLayers.eyes.microSaccade;

      expect(onUpdateLayerSpeed).toHaveBeenCalledWith('eyes', h, v);
    });

    it('should execute _initializeMicroTimer', () => {
      const onInitializeMicroTimer = spyOn(poiFeature, '_initializeMicroTimer');
      poiFeature._setMicroSaccade('eyes');

      expect(onInitializeMicroTimer).toHaveBeenCalledTimes(1);
    });
  });

  describe('_setMacroSaccade', () => {
    beforeEach(() => {
      poiFeature._managedLayers.eyes = {
        isActive: true,
        macroSaccadeTimer: new Deferred(),
        macroSaccade: {h: 0, v: 0},
      };
    });

    it('should update the stored macroSaccade values', () => {
      let currentSaccade = {...poiFeature._managedLayers.eyes.macroSaccade};
      poiFeature._setMacroSaccade('eyes');

      expect(currentSaccade).not.toEqual(
        poiFeature._managedLayers.eyes.macroSaccade
      );

      expect(typeof poiFeature._managedLayers.eyes.macroSaccade.h).toEqual(
        'number'
      );

      expect(typeof poiFeature._managedLayers.eyes.macroSaccade.v).toEqual(
        'number'
      );

      currentSaccade = {...poiFeature._managedLayers.eyes.macroSaccade};
      poiFeature._target = {};
      const onGetPosition = spyOn(PointOfInterestFeature, '_getWorldPosition');
      onGetPosition.and.callFake(obj => {
        if (obj === poiFeature._target) {
          return [0, 0, 1];
        } else {
          return [0, 0, 0];
        }
      });
      poiFeature._setMacroSaccade('eyes');

      expect(currentSaccade).not.toEqual(
        poiFeature._managedLayers.eyes.macroSaccade
      );

      expect(typeof poiFeature._managedLayers.eyes.macroSaccade.h).toEqual(
        'number'
      );

      expect(typeof poiFeature._managedLayers.eyes.macroSaccade.v).toEqual(
        'number'
      );
    });

    it('should choose a new saccadeTarget on the layer if _target is defined', () => {
      const currentType = poiFeature._managedLayers.eyes.saccadeTarget;
      poiFeature._setMacroSaccade('eyes');

      expect(currentType).toEqual(poiFeature._managedLayers.eyes.saccadeTarget);

      poiFeature._target = {};
      const onGetPosition = spyOn(PointOfInterestFeature, '_getWorldPosition');
      onGetPosition.and.callFake(obj => {
        if (obj === poiFeature._target) {
          return [0, 0, 1];
        } else {
          return [0, 0, 0];
        }
      });
      poiFeature._setMacroSaccade('eyes');

      expect(currentType).not.toEqual(
        poiFeature._managedLayers.eyes.saccadeTarget
      );
    });

    it('should execute _getFaceTargetAngles with the new saccadeTarget if _target is defined', () => {
      const onGetFaceTargetAngles = spyOn(poiFeature, '_getFaceTargetAngles');
      onGetFaceTargetAngles.and.callFake(() => {
        return {h: 3.5, v: -1.8};
      });
      poiFeature._setMacroSaccade('eyes');

      expect(onGetFaceTargetAngles).not.toHaveBeenCalled();

      poiFeature._target = {};
      const onGetPosition = spyOn(PointOfInterestFeature, '_getWorldPosition');
      onGetPosition.and.callFake(obj => {
        if (obj === poiFeature._target) {
          return [0, 0, 1];
        } else {
          return [0, 0, 0];
        }
      });
      poiFeature._setMacroSaccade('eyes');

      expect(onGetFaceTargetAngles).toHaveBeenCalledWith(
        poiFeature._managedLayers.eyes.saccadeTarget
      );
    });

    it('should execute _updateLayerSpeed using the new macroSaccade values', () => {
      const onUpdateLayerSpeed = spyOn(poiFeature, '_updateLayerSpeed');
      poiFeature._setMacroSaccade('eyes');
      const {h, v} = poiFeature._managedLayers.eyes.macroSaccade;

      expect(onUpdateLayerSpeed).toHaveBeenCalledWith('eyes', h, v);
    });

    it('should execute _initializeMicroTimer using the postMacro range', () => {
      const onInitializeMicroTimer = spyOn(poiFeature, '_initializeMicroTimer');
      poiFeature._setMacroSaccade('eyes');

      expect(onInitializeMicroTimer).toHaveBeenCalledWith('eyes', 0.6, 1.3125);
    });

    it('should execute _initializeMacroTimer', () => {
      const onInitializeMacroTimer = spyOn(poiFeature, '_initializeMacroTimer');
      poiFeature._setMacroSaccade('eyes');

      expect(onInitializeMacroTimer).toHaveBeenCalledTimes(1);
    });
  });

  describe('_initializeMicroTimer', () => {
    beforeEach(() => {
      poiFeature._managedLayers.eyes = {
        isActive: true,
        microSaccadeTimer: new Deferred(),
      };
    });

    it('should store a new Deferred object on the layer as the microSaccadeTimer property', () => {
      poiFeature._initializeMicroTimer('eyes');

      expect(poiFeature._managedLayers.eyes.microSaccadeTimer).toBeInstanceOf(
        Deferred
      );

      const currentTimer = poiFeature._managedLayers.eyes.microSaccadeTimer;
      poiFeature._initializeMicroTimer('eyes');

      expect(poiFeature._managedLayers.eyes.microSaccadeTimer).not.toEqual(
        currentTimer
      );
    });

    it('should cancel the current microSaccadeTimer for the layer if one already exists', async () => {
      const timer = poiFeature._managedLayers.eyes.microSaccadeTimer;
      poiFeature._initializeMicroTimer('eyes');

      await expectAsync(timer).toBeResolved();

      expect(timer.canceled).toBeTrue();
    });

    it('should execute _setMicroSaccade when the timer expires', async () => {
      const onsetMicroSaccade = spyOn(poiFeature, '_setMicroSaccade');
      poiFeature._initializeMicroTimer('eyes');
      const timer = poiFeature._managedLayers.eyes.microSaccadeTimer;
      timer.resolve();

      expect(onsetMicroSaccade).toHaveBeenCalledWith('eyes');
    });
  });

  describe('_initializeMacroTimer', () => {
    beforeEach(() => {
      poiFeature._managedLayers.eyes = {
        isActive: true,
        macroSaccadeTimer: new Deferred(),
      };
    });

    it('should store a new Deferred object on the layer as the macroSaccadeTimer property', () => {
      poiFeature._initializeMacroTimer('eyes');

      expect(poiFeature._managedLayers.eyes.macroSaccadeTimer).toBeInstanceOf(
        Deferred
      );

      const currentTimer = poiFeature._managedLayers.eyes.macroSaccadeTimer;
      poiFeature._initializeMacroTimer('eyes');

      expect(poiFeature._managedLayers.eyes.macroSaccadeTimer).not.toEqual(
        currentTimer
      );
    });

    it('should cancel the current macroSaccadeTimer for the layer if one already exists', async () => {
      const timer = poiFeature._managedLayers.eyes.macroSaccadeTimer;
      poiFeature._initializeMacroTimer('eyes');

      await expectAsync(timer).toBeResolved();

      expect(timer.canceled).toBeTrue();
    });

    it('should execute _setMacroSaccade when the timer expires', async () => {
      poiFeature._managedLayers.eyes = {isActive: true};
      const onsetMacroSaccade = spyOn(poiFeature, '_setMacroSaccade');
      poiFeature._initializeMacroTimer('eyes');
      const timer = poiFeature._managedLayers.eyes.macroSaccadeTimer;
      timer.resolve();

      expect(onsetMacroSaccade).toHaveBeenCalledWith('eyes');
    });
  });

  describe('registerLookLayer', () => {
    it('should execute registerLayer before _registerLookAnimation', () => {
      const onRegisterLayer = spyOn(poiFeature, 'registerLayer');
      const onRegisterLookAnimation = spyOn(
        poiFeature,
        '_registerLookAnimation'
      );
      poiFeature.registerLookLayer('Look', {animations: 'look'});

      expect(onRegisterLayer).toHaveBeenCalledBefore(onRegisterLookAnimation);
    });

    it('should add a key to _lookLayers', () => {
      const lookLayers = {...poiFeature._lookLayers};

      expect(poiFeature._lookLayers.Look).not.toBeDefined();

      poiFeature.registerLookLayer('Look', {animations: 'look'});

      expect(lookLayers).not.toEqual(poiFeature._lookLayers);
      expect(poiFeature._lookLayers.Look).toBeDefined();
    });
  });

  describe('registerBlinkLayer', () => {
    it('should execute registerLayer', () => {
      const onRegisterLayer = spyOn(poiFeature, 'registerLayer');
      onRegisterLayer.and.callFake((layerName, options) => {
        poiFeature._managedLayers[layerName] = options;
      });
      poiFeature.registerBlinkLayer('Blink', {animations: 'blink'});

      expect(onRegisterLayer).toHaveBeenCalledTimes(1);
    });

    it('should add a key to _blinkLayers', () => {
      const blinkLayers = {...poiFeature._blinkLayers};

      expect(poiFeature._blinkLayers.Blink).not.toBeDefined();

      poiFeature.registerBlinkLayer('Blink', {animations: 'blink'});

      expect(blinkLayers).not.toEqual(poiFeature._blinkLayers);
      expect(poiFeature._blinkLayers.Blink).toBeDefined();
    });
  });

  describe('update', () => {
    beforeAll(() => {
      const onGetWorldPosition = spyOn(
        PointOfInterestFeature,
        '_getWorldPosition'
      );
      onGetWorldPosition.and.callFake(obj => obj._pos);
      const onGetWorldMatrix = spyOn(PointOfInterestFeature, '_getWorldMatrix');
      onGetWorldMatrix.and.callFake(obj => obj._mat);
    });

    beforeEach(() => {
      poiFeature._lookTracker._pos = [0, 0, 0];
      poiFeature._prevTargetPos = [0, 0, 0];
      poiFeature._lookLayers = {
        LookEyes: 'look',
        LookHead: 'look',
        LookSpine: 'look',
      };
      poiFeature._blinkLayers = {
        Blink: 'blink',
        BlinkInactive: 'blink',
      };
      poiFeature._blinkLayers = {
        Blink: 'blink',
      };
      poiFeature._trackingConfigs = [
        {
          reference: {_mat: [0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1]},
          forwardAxis: [0, 0, 1],
          angles: {h: 0, v: 0},
          prevAngles: {h: 0, v: 0},
        },
      ];
      poiFeature._managedLayers = {
        Blink: {
          isActive: true,
          animations: {blink: {isActive: true}},
        },
        BlinkInactive: {
          isActive: true,
          animations: {blink: {isActive: false}},
        },
        LookEyes: {
          isActive: true,
          hasSaccade: true,
          microSaccadeTimer: new Deferred(),
          microSaccade: {h: 0, v: 0},
          macroSaccadeTimer: new Deferred(),
          macroSaccade: {h: 0, v: 0},
          trackingConfig: poiFeature._trackingConfigs[0],
          maxSpeed: 1,
          maxHSpeed: undefined,
          maxVSpeed: undefined,
          hDuration: undefined,
          vDuration: undefined,
          hVelocity: [0, 0],
          vVelocity: [0, 0],
          animations: {
            look: {isActive: true},
          },
        },
        LookHead: {
          isActive: true,
          hasSaccade: false,
          microSaccadeTimer: new Deferred(),
          microSaccade: {h: 0, v: 0},
          macroSaccadeTimer: new Deferred(),
          macroSaccade: {h: 0, v: 0},
          trackingConfig: poiFeature._trackingConfigs[0],
          maxSpeed: 1,
          maxHSpeed: undefined,
          maxVSpeed: undefined,
          hDuration: undefined,
          vDuration: undefined,
          hVelocity: [0, 0],
          vVelocity: [0, 0],
          animations: {
            look: {isActive: false},
          },
        },
        LookSpine: {
          isActive: false,
          microSaccadeTimer: new Deferred(),
          microSaccade: {h: 0, v: 0},
          macroSaccadeTimer: new Deferred(),
          macroSaccade: {h: 0, v: 0},
          trackingConfig: poiFeature._trackingConfigs[0],
          maxSpeed: 1,
          maxHSpeed: undefined,
          maxVSpeed: undefined,
          hDuration: undefined,
          vDuration: undefined,
          hVelocity: [0, 0],
          vVelocity: [0, 0],
          animations: {
            look: {isActive: false},
          },
        },
      };
    });

    it('should execute _resetLookAngles if there is no target and _setLookAngles if there is', () => {
      poiFeature._target = null;

      const onSetLookAngles = spyOn(poiFeature, '_setLookAngles');
      const onResetLookAngles = spyOn(poiFeature, '_resetLookAngles');
      poiFeature.update(100);

      expect(onResetLookAngles).toHaveBeenCalledTimes(1);
      expect(onSetLookAngles).not.toHaveBeenCalled();

      poiFeature._target = {_pos: [0, 0, 1]};
      poiFeature.update(100);

      expect(onResetLookAngles).toHaveBeenCalledTimes(1);
      expect(onSetLookAngles).toHaveBeenCalledTimes(1);
    });

    it('should execute the saccade timers of every stored look layer that is active and whose hasSaccade property is true', () => {
      const onEyeMicroSaccade = spyOn(
        poiFeature._managedLayers.LookEyes.microSaccadeTimer,
        'execute'
      );
      const onEyeMacroSaccade = spyOn(
        poiFeature._managedLayers.LookEyes.macroSaccadeTimer,
        'execute'
      );
      const onHeadMicroSaccade = spyOn(
        poiFeature._managedLayers.LookHead.microSaccadeTimer,
        'execute'
      );
      const onHeadMacroSaccade = spyOn(
        poiFeature._managedLayers.LookHead.macroSaccadeTimer,
        'execute'
      );
      const onSpineMicroSaccade = spyOn(
        poiFeature._managedLayers.LookSpine.microSaccadeTimer,
        'execute'
      );
      const onSpineMacroSaccade = spyOn(
        poiFeature._managedLayers.LookSpine.macroSaccadeTimer,
        'execute'
      );
      poiFeature.update(100);

      expect(onEyeMicroSaccade).toHaveBeenCalledTimes(1);
      expect(onEyeMacroSaccade).toHaveBeenCalledTimes(1);
      expect(onHeadMicroSaccade).not.toHaveBeenCalled();
      expect(onHeadMacroSaccade).not.toHaveBeenCalled();
      expect(onSpineMicroSaccade).not.toHaveBeenCalled();
      expect(onSpineMacroSaccade).not.toHaveBeenCalled();
    });

    it('should execute setAnimationBlendWeight for X and Y blend values on every stored look layer whose animation is active', () => {
      poiFeature.update(100);

      expect(mockAnimationFeature.setAnimationBlendWeight).toHaveBeenCalledWith(
        'LookEyes',
        'look',
        'X',
        0
      );

      expect(mockAnimationFeature.setAnimationBlendWeight).toHaveBeenCalledWith(
        'LookEyes',
        'look',
        'Y',
        0
      );

      expect(
        mockAnimationFeature.setAnimationBlendWeight
      ).not.toHaveBeenCalledWith('LookHead', 'look', 'X', 0);

      expect(
        mockAnimationFeature.setAnimationBlendWeight
      ).not.toHaveBeenCalledWith('LookHead', 'look', 'Y', 0);

      expect(
        mockAnimationFeature.setAnimationBlendWeight
      ).not.toHaveBeenCalledWith('LookSpine', 'look', 'X', 0);

      expect(
        mockAnimationFeature.setAnimationBlendWeight
      ).not.toHaveBeenCalledWith('LookSpine', 'look', 'Y', 0);
    });

    it('should execute the playMethod of each stored blink layer if _isTargetMoving is true and the stored angles of any look layer changed more than the BlinkThreshold', () => {
      const onSetLookAngles = spyOn(poiFeature, '_setLookAngles');
      onSetLookAngles.and.callFake(() => {
        Object.values(poiFeature._managedLayers).forEach(layer => {
          layer.prevAngles = {h: 0, v: 0};
          layer.angles = {h: 0, v: 0};
        });
      });
      poiFeature._target = {_pos: [0, 0, 1]};
      poiFeature.update(100);

      expect(mockAnimationFeature.playAnimation).not.toHaveBeenCalled();

      onSetLookAngles.and.callFake(() => {
        poiFeature._isTargetMoving = true;
        Object.keys(poiFeature._lookLayers).forEach(name => {
          const layer = poiFeature._managedLayers[name];
          layer.trackingConfig.prevAngles = {h: 0, v: 0};
          layer.trackingConfig.angles = {h: 90, v: 90};
        });
      });
      poiFeature.update(100);

      expect(mockAnimationFeature.playAnimation).toHaveBeenCalledWith(
        'Blink',
        'blink'
      );

      expect(mockAnimationFeature.playAnimation).not.toHaveBeenCalledWith(
        'BlinkInactive',
        'blink'
      );
    });
  });
});
