// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-undef */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import {AnimationFeature, Deferred, LayerBlendModes} from '@amazon-sumerian-hosts/core';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('AnimationFeature', (options = {}) => {
  let animationFeature;
  let mockHost;
  let mockLayer1;
  let mockLayer2;
  let mockLayer3;

  beforeEach(() => {
    mockHost = {
      owner: options.owner,
      id: options.owner.id,
      _features: {},
      _callbacks: {},
      listenTo: () => {},
      stopListening: () => {},
      stopListeningToAll: () => {},
      emit: () => {},
    };
    mockLayer1 = jasmine.createSpyObj(
      'layer1',
      [
        'setWeight',
        'updateInternalWeight',
        'pause',
        'resume',
        'pauseWeight',
        'resumeWeight',
        'addState',
        'removeState',
        'renameState',
        'playAnimation',
        'pauseAnimation',
        'resumeAnimation',
        'stopAnimation',
        'update',
        'discard',
      ],
      {
        name: 'layer1',
        weight: 1,
        blendMode: LayerBlendModes.Override,
      }
    );
    mockLayer1.getStateNames = jasmine.createSpy('getStateNames');
    mockLayer1.pause.and.callFake(() => true);
    mockLayer1.resume.and.callFake(() => true);
    mockLayer2 = jasmine.createSpyObj(
      'layer2',
      [
        'setWeight',
        'updateInternalWeight',
        'pause',
        'resume',
        'pauseWeight',
        'resumeWeight',
        'getStateNames',
        'addState',
        'removeState',
        'renameState',
        'playAnimation',
        'pauseAnimation',
        'resumeAnimation',
        'stopAnimation',
        'update',
        'discard',
      ],
      {
        name: 'layer2',
        weight: 0.5,
        blendMode: LayerBlendModes.Additive,
      }
    );
    mockLayer2.getStateNames = jasmine.createSpy('getStateNames');
    mockLayer2.pause.and.callFake(() => true);
    mockLayer2.resume.and.callFake(() => true);
    mockLayer3 = jasmine.createSpyObj(
      'layer3',
      [
        'setWeight',
        'updateInternalWeight',
        'pause',
        'resume',
        'pauseWeight',
        'resumeWeight',
        'getStateNames',
        'addState',
        'removeState',
        'renameState',
        'playAnimation',
        'pauseAnimation',
        'resumeAnimation',
        'stopAnimation',
        'update',
        'discard',
      ],
      {
        name: 'layer3',
        weight: 0.5,
        blendMode: LayerBlendModes.Override,
      }
    );
    mockLayer3.getStateNames = jasmine.createSpy('getStateNames');
    mockLayer3.pause.and.callFake(() => true);
    mockLayer3.resume.and.callFake(() => true);

    animationFeature = new AnimationFeature(mockHost);
    animationFeature._layers.push(mockLayer1);
    animationFeature._layerMap.layer1 = mockLayer1;
    animationFeature._layers.push(mockLayer2);
    animationFeature._layerMap.layer2 = mockLayer2;
    animationFeature._layers.push(mockLayer3);
    animationFeature._layerMap.layer3 = mockLayer3;
    mockHost._features.AnimationFeature = animationFeature;
  });

  describe('_validateIndex', () => {
    it('should return undefined when checking for an existing index and there are no layers stored', () => {
      animationFeature._layers = [];
      animationFeature._layerMap = {};

      expect(animationFeature._validateIndex(0, true)).not.toBeDefined();

      expect(animationFeature._validateIndex(-1, true)).not.toBeDefined();

      expect(animationFeature._validateIndex(1, true)).not.toBeDefined();
    });

    it('should return the input index when checking for an existing index and the input index is positive and between 0 and the number of existing layers - 1', () => {
      expect(animationFeature._validateIndex(0, true)).toEqual(0);

      expect(animationFeature._validateIndex(1, true)).toEqual(1);

      expect(animationFeature._validateIndex(3, true)).not.toBeDefined();
    });

    it('should return the length of the layers array + the input index when checking for an existing index, the input index is negative and the absolute value of the input index is less than or equal to the number of existing layers', () => {
      expect(animationFeature._validateIndex(-1, true)).toEqual(2);

      expect(animationFeature._validateIndex(-2, true)).toEqual(1);

      expect(animationFeature._validateIndex(-3, true)).toEqual(0);

      expect(animationFeature._validateIndex(-4, true)).not.toBeDefined();
    });

    it('should return the input index when checking for a new index and the input index is between 0 and the number of existing layers', () => {
      expect(animationFeature._validateIndex(0, false)).toEqual(0);

      expect(animationFeature._validateIndex(1, false)).toEqual(1);

      expect(animationFeature._validateIndex(2, false)).toEqual(2);

      expect(animationFeature._validateIndex(4, false)).not.toBeDefined();
    });

    it('should return the length of the layers array + the input index + 1 when checking for a new index, the input index is negative and the absolute value of the input index is less than or equal to the number of existing layers + 1', () => {
      expect(animationFeature._validateIndex(-1, false)).toEqual(3);

      expect(animationFeature._validateIndex(-2, false)).toEqual(2);

      expect(animationFeature._validateIndex(-3, false)).toEqual(1);

      expect(animationFeature._validateIndex(-4, false)).toEqual(0);

      expect(animationFeature._validateIndex(-5, false)).not.toBeDefined();
    });
  });

  describe('_updateInternalWeights', () => {
    it('should execute updateInternalWeight on each layer in reverse order', () => {
      animationFeature._updateInternalWeights();

      expect(mockLayer3.updateInternalWeight).toHaveBeenCalledBefore(
        mockLayer2.updateInternalWeight
      );

      expect(mockLayer2.updateInternalWeight).toHaveBeenCalledBefore(
        mockLayer1.updateInternalWeight
      );
    });

    it('should execute updateInternalWeight on each layer with a factor of 1 if none of the layers use Override blend mode', () => {
      mockLayer1.blendMode = LayerBlendModes.Additive;
      mockLayer2.blendMode = LayerBlendModes.Additive;
      mockLayer3.blendMode = LayerBlendModes.Additive;
      animationFeature._updateInternalWeights();

      expect(mockLayer1.updateInternalWeight).toHaveBeenCalledWith(1);
      expect(mockLayer2.updateInternalWeight).toHaveBeenCalledWith(1);
      expect(mockLayer3.updateInternalWeight).toHaveBeenCalledWith(1);
    });

    it("should progressively multiply the factor that gets passed to the next layer's updateInternalWeight by the 1 - the current layer's active state internal weight when the current layer uses Override blend mode", () => {
      mockLayer3.currentState = {internalWeight: 1};
      animationFeature._updateInternalWeights();

      expect(mockLayer3.updateInternalWeight).toHaveBeenCalledWith(1);

      expect(mockLayer2.updateInternalWeight).toHaveBeenCalledWith(
        1 - mockLayer3.currentState.internalWeight
      );

      expect(mockLayer1.updateInternalWeight).toHaveBeenCalledWith(
        1 - mockLayer3.currentState.internalWeight
      );
    });
  });

  describe('_validateNewAnimation', () => {
    it('should throw an error if layerName does not exist', () => {
      expect(
        animationFeature._validateNewAnimation.bind(
          animationFeature,
          'layer4',
          'newAnim'
        )
      ).toThrowError();
    });

    it('should log a warning if animationName is not unique for the layer', () => {
      const onWarn = spyOn(console, 'warn');
      mockLayer1.getStateNames.and.callFake(() => {
        return ['newAnim'];
      });
      animationFeature._validateNewAnimation('layer1', 'newAnim');

      expect(mockLayer1.getStateNames).toHaveBeenCalledTimes(1);
      expect(onWarn).toHaveBeenCalledTimes(1);
    });
  });

  describe('paused', () => {
    it('should return the value of _paused', () => {
      animationFeature._paused = true;

      expect(animationFeature.paused).toBeTrue();

      animationFeature._paused = false;

      expect(animationFeature.paused).toBeFalse();
    });

    it('should not be able to be set', () => {
      expect(() => {
        animationFeature.paused = true;
      }).toThrowError(TypeError);
    });
  });

  describe('layers', () => {
    it('should return an array of strings the same length as _layers', () => {
      expect(animationFeature.layers).toBeInstanceOf(Array);

      expect(
        animationFeature.layers.every(value => typeof value === 'string')
      ).toBeTrue();

      expect(animationFeature.layers.length).toEqual(
        animationFeature._layers.length
      );
    });

    it('should not be able to be set', () => {
      expect(() => {
        animationFeature.layers = [];
      }).toThrowError(TypeError);
    });
  });

  describe('addLayer', () => {
    it("should log a warning if an index is passed in that doesn't pass _validateIndex with existing set to false", () => {
      const onWarn = spyOn(console, 'warn');
      animationFeature.addLayer('newLayer1', 'Override', 0);

      expect(onWarn).not.toHaveBeenCalled();

      animationFeature.addLayer('newLayer2', 'Override', 10);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should log a warning if a layer already exists with the whose name matches the input name', () => {
      const onWarn = spyOn(console, 'warn');
      animationFeature.addLayer('uniqueName', 'Override', 0);

      expect(onWarn).not.toHaveBeenCalled();

      animationFeature.addLayer('layer1', 'Override', 0);

      expect(onWarn).toHaveBeenCalled();
    });

    it('should add a new layer to _layerMap', () => {
      const expected = Object.keys(animationFeature._layerMap).length + 1;
      animationFeature.addLayer('uniqueName', 'Override', 0);
      const actual = Object.keys(animationFeature._layerMap).length;

      expect(expected).toEqual(actual);
    });

    it('should add a new layer to _layers', () => {
      const expected = animationFeature._layers.length + 1;
      animationFeature.addLayer('uniqueName', 'Override', 0);
      const actual = animationFeature._layers.length;

      expect(expected).toEqual(actual);
    });

    it('should return an object with name and index properties defined', () => {
      let expected = {name: 'uniqueName', index: 0};
      let actual = animationFeature.addLayer('uniqueName', 'Override', 0);

      expect(expected).toEqual(actual);

      expected = {name: 'layer4', index: animationFeature._layers.length};
      actual = animationFeature.addLayer('layer1', 'Override', 10);

      expect(expected).toEqual(actual);
    });

    it("should successfully add a layer if the user doesn't pass any arguments", () => {
      const expected = animationFeature._layers.length + 1;

      expect(
        animationFeature.addLayer.bind(animationFeature)
      ).not.toThrowError();

      const actual = animationFeature._layers.length;

      expect(expected).toEqual(actual);
    });
  });

  describe('removeLayer', () => {
    it('should log a warning if no layer exists with the given name', () => {
      const onWarn = spyOn(console, 'warn');
      animationFeature.removeLayer('someLayer');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should return false if no layer exists with the given name', () => {
      expect(animationFeature.removeLayer('someLayer')).toBeFalse();
    });

    it('should execute discard on the layer to be removed', () => {
      animationFeature.removeLayer('layer1');

      expect(mockLayer1.discard).toHaveBeenCalledTimes(1);
    });

    it('should remove the layer with the given name from the _layers array', () => {
      expect(animationFeature._layers).toContain(mockLayer1);

      animationFeature.removeLayer('layer1');

      expect(animationFeature._layers).not.toContain(mockLayer1);
    });

    it('should remove the layer with the given name from the _layerMap object', () => {
      expect(animationFeature._layerMap.layer1).toBeDefined();
      expect(Object.values(animationFeature._layerMap)).toContain(mockLayer1);

      animationFeature.removeLayer('layer1');

      expect(animationFeature._layerMap.layer1).not.toBeDefined();
      expect(Object.values(animationFeature._layerMap)).not.toContain(
        mockLayer1
      );
    });

    it('should return true if a layer with the given name exists on the feature', () => {
      expect(animationFeature.removeLayer('layer1')).toBeTrue();
    });
  });

  describe('moveLayer', () => {
    it('should throw an error if no layer exists with the given name', () => {
      expect(
        animationFeature.moveLayer.bind(animationFeature, 'someLayer')
      ).toThrowError();
    });

    it('should throw an error if the input index is not a valid existing index', () => {
      expect(
        animationFeature.moveLayer.bind(animationFeature, 'layer1', -10)
      ).toThrowError();
    });

    it('should not re-order the _layers array if the input index matches the current index of the layer', () => {
      const expected = [...animationFeature._layers];
      animationFeature.moveLayer('layer1', 0);
      const actual = animationFeature._layers;

      expect(expected).toEqual(actual);
    });

    it('should re-order the _layers array if the input index does not match the current index of the layer', () => {
      const expected = animationFeature._layers.map(l => l.name);
      animationFeature.moveLayer('layer1', 0);
      let actual = animationFeature._layers.map(l => l.name);

      expect(expected).toEqual(actual);

      animationFeature.moveLayer('layer2', 0);
      actual = animationFeature._layers.map(l => l.name);

      expect(expected).not.toEqual(actual);
    });

    it('should not change the length of the _layers array', () => {
      const expected = animationFeature._layers.length;
      animationFeature.moveLayer('layer1', 2);
      const actual = animationFeature._layers.length;

      expect(expected).toEqual(actual);
    });

    it('should only change the position of the layers whose indices lie between the current and new index of the layer being moved', () => {
      expect(animationFeature._layers.indexOf(mockLayer1)).toEqual(0);
      expect(animationFeature._layers.indexOf(mockLayer2)).toEqual(1);
      expect(animationFeature._layers.indexOf(mockLayer3)).toEqual(2);

      animationFeature.moveLayer('layer1', 1);

      expect(animationFeature._layers.indexOf(mockLayer1)).not.toEqual(0);
      expect(animationFeature._layers.indexOf(mockLayer2)).not.toEqual(1);
      expect(animationFeature._layers.indexOf(mockLayer3)).toEqual(2);
    });
  });

  describe('renameLayer', () => {
    it('should throw an error if no layer exists with the given currentName', () => {
      expect(
        animationFeature.renameLayer.bind(
          animationFeature,
          'someLayer',
          'someName'
        )
      ).toThrowError();
    });

    it('should log a warning if the given newName is not unique', () => {
      const onWarn = spyOn(console, 'warn');
      animationFeature.renameLayer('layer1', 'layer2');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should remove the property that matches the currentName input from the _layerMap', () => {
      expect(animationFeature._layerMap.layer1).toBeDefined();

      animationFeature.renameLayer('layer1', 'layer0');

      expect(animationFeature._layerMap.layer1).not.toBeDefined();
    });

    it('should add a property that matches the updated name of the layer to the _layerMap', () => {
      expect(animationFeature._layerMap.layer0).not.toBeDefined();

      animationFeature.renameLayer('layer1', 'layer0');

      expect(animationFeature._layerMap.layer0).toBeDefined();
    });

    it("should change the value of the layer's name property", () => {
      mockLayer1 = {name: 'layer1'};
      animationFeature._layerMap.layer1 = mockLayer1;
      animationFeature.renameLayer('layer1', 'layer0');

      expect(mockLayer1.name).not.toEqual('layer1');
    });

    it('should return the updated name of the layer', () => {
      const actual = animationFeature.renameLayer('layer1', 'layer0');

      expect('layer0').toEqual(actual);
    });
  });

  describe('getLayerWeight', () => {
    it('should throw an error if no layer exists with the given name', () => {
      expect(
        animationFeature.getLayerWeight.bind(animationFeature, 'someLayer')
      ).toThrowError();
    });

    it("should return the value of the layer's weight property", () => {
      const expected = mockLayer1.weight;
      const actual = animationFeature.getLayerWeight('layer1');

      expect(expected).toEqual(actual);
    });
  });

  describe('setLayerWeight', () => {
    it('should return a rejected promise if no layer exists with the given name', () => {
      return expectAsync(
        animationFeature.setLayerWeight('someLayer')
      ).toBeRejected();
    });

    it('should execute setWeight on the layer', () => {
      animationFeature.setLayerWeight('layer1', 0.1);

      expect(mockLayer1.setWeight).toHaveBeenCalledWith(
        0.1,
        undefined,
        undefined
      );
    });
  });

  describe('pauseLayerWeight', () => {
    it('should throw an error if no layer exists with the given name', () => {
      expect(
        animationFeature.pauseLayerWeight.bind(animationFeature, 'someLayer')
      ).toThrowError();
    });

    it('should execute pauseWeight on the layer', () => {
      animationFeature.pauseLayerWeight('layer1');

      expect(mockLayer1.pauseWeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('resumeLayerWeight', () => {
    it('should return a rejected promise if no layer exists with the given name', () => {
      return expectAsync(
        animationFeature.resumeLayerWeight('someLayer')
      ).toBeRejected();
    });

    it('should execute resume on the layer', () => {
      animationFeature.resumeLayerWeight('layer1');

      expect(mockLayer1.resumeWeight).toHaveBeenCalledTimes(1);
    });
  });

  describe('pauseLayer', () => {
    it('should throw an error if no layer exists with the given name', () => {
      expect(
        animationFeature.pauseLayer.bind(animationFeature, 'someLayer')
      ).toThrowError();
    });

    it('should execute pause on the layer', () => {
      animationFeature.pauseLayer('layer1');

      expect(mockLayer1.pause).toHaveBeenCalledTimes(1);
    });
  });

  describe('resumeLayer', () => {
    it('should return a rejected promise if no layer exists with the given name', () => {
      return expectAsync(
        animationFeature.resumeLayer('someLayer')
      ).toBeRejected();
    });

    it('should execute resume on the layer', () => {
      animationFeature.resumeLayer('layer1');

      expect(mockLayer1.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('addAnimation', () => {
    it('should throw an error if no layer exists with the given name', () => {
      expect(
        animationFeature.addAnimation.bind(animationFeature, 'layer4', 'anim')
      ).toThrowError();
    });

    it('should throw an error if an invalid animationType is used', () => {
      expect(
        animationFeature.addAnimation.bind(
          animationFeature,
          'layer4',
          'anim',
          'notAnAnimationType'
        )
      ).toThrowError();
    });

    it('should execute addAnimation on the layer', () => {
      const onCreateState = spyOn(animationFeature, '_createSingleState');
      onCreateState.and.callFake(options => options);
      animationFeature.addAnimation('layer1', 'newAnim');

      expect(mockLayer1.addState).toHaveBeenCalledWith({
        name: 'newAnim',
        blendMode: 'Override',
        transitionTime: mockLayer1.transitionTime,
      });
    });

    it('should return a boolean', () => {
      spyOn(animationFeature, '_createSingleState');
      mockLayer1.addState.and.callFake(() => true);
      const result = animationFeature.addAnimation('layer1', 'newAnim');

      expect(typeof result).toEqual('boolean');
    });
  });

  describe('removeAnimation', () => {
    it('should throw an error if no layer exists with the given name', () => {
      expect(
        animationFeature.removeAnimation.bind(
          animationFeature,
          'layer4',
          'anim'
        )
      ).toThrowError();
    });

    it('should execute removeAnimation on the layer', () => {
      animationFeature.removeAnimation('layer1', 'newAnim');

      expect(mockLayer1.removeState).toHaveBeenCalledWith('newAnim');
    });

    it('should return a boolean', () => {
      mockLayer1.removeState.and.callFake(() => true);
      const result = animationFeature.removeAnimation('layer1', 'newAnim');

      expect(typeof result).toEqual('boolean');
    });
  });

  describe('renameAnimation', () => {
    it('should throw an error if no layer exists with the given name', () => {
      expect(
        animationFeature.renameAnimation.bind(
          animationFeature,
          'layer4',
          'oldName',
          'newName'
        )
      ).toThrowError();
    });

    it('should execute renameAnimation on the layer', () => {
      animationFeature.renameAnimation('layer1', 'oldName', 'newName');

      expect(mockLayer1.renameState).toHaveBeenCalledWith('oldName', 'newName');
    });

    it('should return a string', () => {
      mockLayer1.renameState.and.callFake((_oldName, newName) => newName);
      const result = animationFeature.renameAnimation(
        'layer1',
        'oldName',
        'newName'
      );

      expect(typeof result).toEqual('string');
    });
  });

  describe('playAnimation', () => {
    it('should return a rejected Deferred no layer exists with the given name', () => {
      return expectAsync(
        animationFeature.playAnimation('layer4', 'anim')
      ).toBeRejected();
    });

    it('should execute playAnimation on the layer', () => {
      animationFeature.playAnimation('layer1', 'anim');

      expect(mockLayer1.playAnimation).toHaveBeenCalledTimes(1);
    });

    it('should return a Deferred', () => {
      mockLayer1.playAnimation.and.callFake(() => Deferred.resolve());

      expect(animationFeature.playAnimation('layer1', 'anim')).toBeInstanceOf(
        Deferred
      );
    });
  });

  describe('pauseAnimation', () => {
    it('should return false if no layer exists with the given name', () => {
      expect(animationFeature.pauseAnimation('layer4')).toBeFalse();
    });

    it('should log a console warning if no layer exists with the given name', () => {
      const onWarn = spyOn(console, 'warn');
      animationFeature.pauseAnimation('layer4');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should execute pauseAnimation on the layer', () => {
      animationFeature.pauseAnimation('layer1');

      expect(mockLayer1.pauseAnimation).toHaveBeenCalledTimes(1);
    });

    it('should return a boolean', () => {
      mockLayer1.pauseAnimation.and.callFake(() => true);
      const result = animationFeature.pauseAnimation('layer1');

      expect(typeof result).toEqual('boolean');
    });
  });

  describe('resumeAnimation', () => {
    it('should return a rejected Promise no layer exists with the given name', () => {
      return expectAsync(
        animationFeature.resumeAnimation('layer4', 'anim')
      ).toBeRejected();
    });

    it('should execute resumeAnimation on the layer', () => {
      animationFeature.resumeAnimation('layer1', 'anim');

      expect(mockLayer1.resumeAnimation).toHaveBeenCalledTimes(1);
    });

    it('should return a Promise', () => {
      mockLayer1.resumeAnimation.and.callFake(() => Deferred.resolve());

      expect(animationFeature.resumeAnimation('layer1', 'anim')).toBeInstanceOf(
        Deferred
      );
    });
  });

  describe('stopAnimation', () => {
    it('should return false if no layer exists with the given name', () => {
      expect(animationFeature.stopAnimation('layer4')).toBeFalse();
    });

    it('should log a console warning if no layer exists with the given name', () => {
      const onWarn = spyOn(console, 'warn');
      animationFeature.pauseAnimation('layer4');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should execute stopAnimation on the layer', () => {
      animationFeature.stopAnimation('layer1');

      expect(mockLayer1.stopAnimation).toHaveBeenCalledTimes(1);
    });

    it('should return a boolean', () => {
      mockLayer1.stopAnimation.and.callFake(() => true);
      const result = animationFeature.stopAnimation('layer1');

      expect(typeof result).toEqual('boolean');
    });
  });

  describe('pause', () => {
    it('should execute pause on every layer', () => {
      animationFeature.pause();

      expect(mockLayer1.pause).toHaveBeenCalledTimes(1);
      expect(mockLayer2.pause).toHaveBeenCalledTimes(1);
      expect(mockLayer3.pause).toHaveBeenCalledTimes(1);
    });

    it('should return a boolean', () => {
      const result = animationFeature.pause();

      expect(typeof result).toEqual('boolean');
    });

    it('should return true if any of the layer pause methods return true', () => {
      mockLayer1.pause.and.callFake(() => true);
      mockLayer2.pause.and.callFake(() => false);
      mockLayer3.pause.and.callFake(() => false);

      expect(animationFeature.pause()).toBeTrue();

      mockLayer1.pause.and.callFake(() => false);

      expect(animationFeature.pause()).toBeFalse();
    });
  });

  describe('resume', () => {
    it('should execute resume on every layer', () => {
      animationFeature.resume();

      expect(mockLayer1.resume).toHaveBeenCalledTimes(1);
      expect(mockLayer2.resume).toHaveBeenCalledTimes(1);
      expect(mockLayer3.resume).toHaveBeenCalledTimes(1);
    });

    it('should return a boolean', () => {
      const result = animationFeature.resume();

      expect(typeof result).toEqual('boolean');
    });

    it('should return true if any of the layer resume methods return true', () => {
      mockLayer1.resume.and.callFake(() => true);
      mockLayer2.resume.and.callFake(() => false);
      mockLayer3.resume.and.callFake(() => false);

      expect(animationFeature.resume()).toBeTrue();

      mockLayer1.resume.and.callFake(() => false);

      expect(animationFeature.resume()).toBeFalse();
    });
  });

  describe('installApi', () => {
    it('should add "paused", "layers", "addLayer", "removeLayer", "moveLayer", "renameLayer", "getLayerWeight", "setLayerWeight", "pauseLayerWeight", "resumeLayerWeight", "pauseLayer", "resumeLayer", "getAnimations", "getCurrentAnimation", "addAnimation", "removeAnimation", "renameAnimation", "playAnimation", "pauseAnimation", "resumeAnimation", "stopAnimation", "pause" and "resume" methods to the feature\'s api object on the host', () => {
      animationFeature.installApi();

      expect(typeof mockHost.AnimationFeature.paused).toEqual('boolean');

      expect(mockHost.AnimationFeature.layers).toBeInstanceOf(Array);

      expect(mockHost.AnimationFeature.addLayer).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.addLayer).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.removeLayer).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.moveLayer).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.renameLayer).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.getLayerWeight).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.setLayerWeight).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.pauseLayerWeight).toBeInstanceOf(
        Function
      );

      expect(mockHost.AnimationFeature.resumeLayerWeight).toBeInstanceOf(
        Function
      );

      expect(mockHost.AnimationFeature.pauseLayer).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.resumeLayer).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.getAnimations).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.getCurrentAnimation).toBeInstanceOf(
        Function
      );

      expect(mockHost.AnimationFeature.addAnimation).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.removeAnimation).toBeInstanceOf(
        Function
      );

      expect(mockHost.AnimationFeature.renameAnimation).toBeInstanceOf(
        Function
      );

      expect(mockHost.AnimationFeature.playAnimation).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.pauseAnimation).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.resumeAnimation).toBeInstanceOf(
        Function
      );

      expect(mockHost.AnimationFeature.stopAnimation).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.pause).toBeInstanceOf(Function);

      expect(mockHost.AnimationFeature.resume).toBeInstanceOf(Function);
    });
  });

  describe('update', () => {
    it('should execute _updateInternalWeights', () => {
      const onupdateInternalWeights = spyOn(
        animationFeature,
        '_updateInternalWeights'
      );
      animationFeature.update(0.1);

      expect(onupdateInternalWeights).toHaveBeenCalledTimes(1);
    });

    it('should execute update on layers', () => {
      animationFeature.update(0.1);

      expect(mockLayer1.update).toHaveBeenCalledWith(0.1);
      expect(mockLayer2.update).toHaveBeenCalledWith(0.1);
      expect(mockLayer3.update).toHaveBeenCalledWith(0.1);
    });
  });

  describe('discard', () => {
    it('should execute discard on each layer', () => {
      mockHost.AnimationFeature = {};
      animationFeature.discard();

      expect(mockLayer1.discard).toHaveBeenCalledTimes(1);
      expect(mockLayer2.discard).toHaveBeenCalledTimes(1);
      expect(mockLayer3.discard).toHaveBeenCalledTimes(1);
    });

    it('should remove references to layers', () => {
      mockHost.AnimationFeature = {};

      expect(animationFeature._layers).toBeDefined();
      expect(animationFeature._layerMap).toBeDefined();

      animationFeature.discard();

      expect(animationFeature._layers).not.toBeDefined();
      expect(animationFeature._layerMap).not.toBeDefined();
    });
  });
});
