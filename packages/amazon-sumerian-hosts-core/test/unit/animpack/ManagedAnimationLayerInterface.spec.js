// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable max-classes-per-file */
/* eslint-disable no-undef */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import {AbstractHostFeature, HostObject} from '@amazon-sumerian-hosts/core';
import ManagedAnimationLayerInterface  from '../../../src/core/animpack/ManagedAnimationLayerInterface';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('ManagedAnimationLayerInterface', () => {
  let managedLayerFeature;
  let mockAnimationFeature;
  let host;

  beforeEach(() => {
    host = new HostObject();
    const HostFeature = AbstractHostFeature.mix(
      ManagedAnimationLayerInterface.Mixin
    );
    host.addFeature(HostFeature);
    managedLayerFeature = host._features.ManagedAnimationLayerMixin;
    mockAnimationFeature = {
      layers: ['layer1', 'layer2'],
      getAnimations: jasmine.createSpy('getAnimations'),
      setLayerWeight: jasmine.createSpy('setLayerWeight'),
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
    mockAnimationFeature.getAnimations.and.callFake(() => ['anim1', 'anim2']);
    host.AnimationFeature = mockAnimationFeature;
    host._features.AnimationFeature = mockAnimationFeature;
  });

  describe('_onFeatureAdded', () => {
    let onLayerAdded;

    beforeEach(() => {
      onLayerAdded = spyOn(managedLayerFeature, '_onLayerAdded');
    });

    it('should should execute _onLayerAdded for each layer name on the new feature if the added feature is an animation feature', () => {
      managedLayerFeature._onFeatureAdded('AnimationFeature');

      mockAnimationFeature.layers.forEach(name => {
        expect(onLayerAdded).toHaveBeenCalledWith({name});
      });
    });

    it('should not execute _onLayerAdded if the added feature is not an animation feature', () => {
      managedLayerFeature._onFeatureAdded('NotAnAnimationFeature');

      expect(onLayerAdded).not.toHaveBeenCalled();
    });

    it('should not execute _onLayerAdded if the added feature is an animation feature but has no layers', () => {
      mockAnimationFeature.layers = [];
      managedLayerFeature._onFeatureAdded('AnimationFeature');

      expect(onLayerAdded).not.toHaveBeenCalled();
    });
  });

  describe('_onFeatureRemoved', () => {
    let onLayerRemoved;

    beforeEach(() => {
      onLayerRemoved = spyOn(managedLayerFeature, '_onLayerRemoved');
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
        layer2: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
      };
    });

    it('should should execute _onLayerRemoved for each layer name on the new feature if the removed feature is an animation feature', () => {
      managedLayerFeature._onFeatureRemoved('AnimationFeature');

      mockAnimationFeature.layers.forEach(name => {
        expect(onLayerRemoved).toHaveBeenCalledWith({name});
      });
    });

    it('should not execute _onLayerRemoved if the removed feature is not an animation feature', () => {
      managedLayerFeature._onFeatureRemoved('NotAnAnimationFeature');

      expect(onLayerRemoved).not.toHaveBeenCalled();
    });

    it('should not execute _onLayerRemoved if there are no managed layers', () => {
      managedLayerFeature._managedLayers = {};
      managedLayerFeature._onFeatureRemoved('AnimationFeature');

      expect(onLayerRemoved).not.toHaveBeenCalled();
    });
  });

  describe('_onLayerAdded', () => {
    let onAnimationAdded;

    beforeEach(() => {
      onAnimationAdded = spyOn(managedLayerFeature, '_onAnimationAdded');
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: false,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
        layer2: {
          isActive: false,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
      };
    });

    it('should set isActive to true for any managed layers that match the name of the added layer', () => {
      expect(managedLayerFeature._managedLayers.layer1.isActive).toBeFalse();
      expect(managedLayerFeature._managedLayers.layer2.isActive).toBeFalse();

      managedLayerFeature._onLayerAdded({name: 'layer1'});

      expect(managedLayerFeature._managedLayers.layer1.isActive).toBeTrue();
      expect(managedLayerFeature._managedLayers.layer2.isActive).toBeFalse();
    });

    it('should execute _onAnimationAdded for any managed animations on the managed layer that matches the name of the added layer', () => {
      managedLayerFeature._onLayerAdded({name: 'layer1'});

      Object.keys(managedLayerFeature._managedLayers.layer1.animations).forEach(
        name => {
          expect(onAnimationAdded).toHaveBeenCalledWith({
            layerName: 'layer1',
            animationName: name,
          });
        }
      );

      Object.keys(managedLayerFeature._managedLayers.layer2.animations).forEach(
        name => {
          expect(onAnimationAdded).not.toHaveBeenCalledWith({
            layerName: 'layer2',
            animationName: name,
          });
        }
      );
    });

    it('should not make any changes to _managedLayers if there is no managed layer matching the name of the added layer', () => {
      const managedLayers = {...managedLayerFeature._managedLayers};
      managedLayerFeature._onLayerAdded({name: 'layer3'});

      expect(managedLayers).toEqual(managedLayerFeature._managedLayers);
    });

    it('should not execute _onAnimationAdded if there is no managed layer matching the name of the added layer', () => {
      managedLayerFeature._onLayerAdded({name: 'layer3'});

      expect(onAnimationAdded).not.toHaveBeenCalled();
    });
  });

  describe('_onLayerRemoved', () => {
    let onAnimationRemoved;

    beforeEach(() => {
      onAnimationRemoved = spyOn(managedLayerFeature, '_onAnimationRemoved');
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
        layer2: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
      };
    });

    it('should set isActive to false for any managed layers that match the name of the removed layer', () => {
      expect(managedLayerFeature._managedLayers.layer1.isActive).toBeTrue();
      expect(managedLayerFeature._managedLayers.layer2.isActive).toBeTrue();

      managedLayerFeature._onLayerRemoved({name: 'layer1'});

      expect(managedLayerFeature._managedLayers.layer1.isActive).toBeFalse();
      expect(managedLayerFeature._managedLayers.layer2.isActive).toBeTrue();
    });

    it('should execute _onAnimationRemoved for any managed animations on the managed layer that matches the name of the removed layer', () => {
      managedLayerFeature._onLayerRemoved({name: 'layer1'});

      Object.keys(managedLayerFeature._managedLayers.layer1.animations).forEach(
        name => {
          expect(onAnimationRemoved).toHaveBeenCalledWith({
            layerName: 'layer1',
            animationName: name,
          });
        }
      );

      Object.keys(managedLayerFeature._managedLayers.layer2.animations).forEach(
        name => {
          expect(onAnimationRemoved).not.toHaveBeenCalledWith({
            layerName: 'layer2',
            animationName: name,
          });
        }
      );
    });

    it('should not make any changes to _managedLayers if there is no managed layer matching the name of the removed layer', () => {
      const managedLayers = {...managedLayerFeature._managedLayers};
      managedLayerFeature._onLayerRemoved({name: 'layer3'});

      expect(managedLayers).toEqual(managedLayerFeature._managedLayers);
    });

    it('should not execute _onAnimationRemoved if there is no managed layer matching the name of the removed layer', () => {
      managedLayerFeature._onLayerRemoved({name: 'layer3'});

      expect(onAnimationRemoved).not.toHaveBeenCalled();
    });
  });

  describe('_onLayerRenamed', () => {
    beforeEach(() => {
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
        layer2: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
      };
    });

    it('should remove the key whose name matches oldName and insert its value at a new key with newName on _managedLayers', () => {
      const layer1Options = managedLayerFeature._managedLayers.layer1;

      expect(managedLayerFeature._managedLayers.layer3).not.toBeDefined();

      managedLayerFeature._onLayerRenamed({
        oldName: 'layer1',
        newName: 'layer3',
      });

      expect(managedLayerFeature._managedLayers.layer1).not.toBeDefined();
      expect(managedLayerFeature._managedLayers.layer3).toEqual(layer1Options);
    });

    it('should not make changes to _managedLayers if there is no managed layer matching oldName', () => {
      const managedLayers = {...managedLayerFeature._managedLayers};
      managedLayerFeature._onLayerRenamed({
        oldName: 'layer3',
        newName: 'layer4',
      });

      expect(managedLayers).toEqual(managedLayerFeature._managedLayers);
    });
  });

  describe('_onAnimationAdded', () => {
    beforeEach(() => {
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: true,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
        layer2: {
          isActive: true,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
      };
    });

    it('should set isActive to true for any managed animations that match the name of the added animation and layer', () => {
      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1.isActive
      ).toBeFalse();

      expect(
        managedLayerFeature._managedLayers.layer2.animations.anim1.isActive
      ).toBeFalse();

      managedLayerFeature._onAnimationAdded({
        layerName: 'layer1',
        animationName: 'anim1',
      });

      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1.isActive
      ).toBeTrue();

      expect(
        managedLayerFeature._managedLayers.layer2.animations.anim1.isActive
      ).toBeFalse();
    });

    it('should not make any changes to _managedLayers if there is no managed animation matching the name of the added animation and layer', () => {
      const managedLayers = {...managedLayerFeature._managedLayers};
      managedLayerFeature._onAnimationAdded({
        layerName: 'layer3',
        animationName: 'anim1',
      });

      expect(managedLayers).toEqual(managedLayerFeature._managedLayers);
    });
  });

  describe('_onAnimationRemoved', () => {
    beforeEach(() => {
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
        layer2: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
      };
    });

    it('should set isActive to false for any managed animations that match the name of the removed animation and layer', () => {
      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1.isActive
      ).toBeTrue();

      expect(
        managedLayerFeature._managedLayers.layer2.animations.anim1.isActive
      ).toBeTrue();

      managedLayerFeature._onAnimationRemoved({
        layerName: 'layer1',
        animationName: 'anim1',
      });

      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1.isActive
      ).toBeFalse();

      expect(
        managedLayerFeature._managedLayers.layer2.animations.anim1.isActive
      ).toBeTrue();
    });

    it('should not make any changes to _managedLayers if there is no managed animation matching the name of the removed animation and layer', () => {
      const managedLayers = {...managedLayerFeature._managedLayers};
      managedLayerFeature._onAnimationRemoved({
        layerName: 'layer3',
        animationName: 'anim1',
      });

      expect(managedLayers).toEqual(managedLayerFeature._managedLayers);
    });
  });

  describe('_onAnimationRenamed', () => {
    beforeEach(() => {
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
        layer2: {
          isActive: true,
          animations: {anim1: {isActive: true}, anim2: {isActive: true}},
        },
      };
    });

    it('should remove the key whose name matches oldName and insert its value at a new key with newName on the managed layer whose name matches layerName', () => {
      const layer1Anim1Options =
        managedLayerFeature._managedLayers.layer1.animations.anim1;

      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim3
      ).not.toBeDefined();

      managedLayerFeature._onAnimationRenamed({
        layerName: 'layer1',
        oldName: 'anim1',
        newName: 'anim3',
      });

      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1
      ).not.toBeDefined();

      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim3
      ).toEqual(layer1Anim1Options);
    });

    it('should not make changes to _managedLayers if there is no managed layer matching layerName', () => {
      const managedLayers = {...managedLayerFeature._managedLayers};
      managedLayerFeature._onAnimationRenamed({
        layerName: 'layer3',
        oldName: 'anim1',
        newName: 'anim3',
      });

      expect(managedLayers).toEqual(managedLayerFeature._managedLayers);
    });

    it('should not make changes to _managedLayers if there is no managed animation matching oldName', () => {
      const managedLayers = {...managedLayerFeature._managedLayers};
      managedLayerFeature._onAnimationRenamed({
        layerName: 'layer3',
        oldName: 'anim3',
        newName: 'anim4',
      });

      expect(managedLayers).toEqual(managedLayerFeature._managedLayers);
    });
  });

  describe('registerLayer', () => {
    let onRegisterAnimation;

    beforeEach(() => {
      onRegisterAnimation = spyOn(managedLayerFeature, 'registerAnimation');
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: false,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
        layer2: {
          isActive: false,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
      };
    });

    it('should add a new key to _managedLayers if one with the given name does not already exist', () => {
      expect(managedLayerFeature._managedLayers.layer3).not.toBeDefined();

      managedLayerFeature.registerLayer('layer3');

      expect(managedLayerFeature._managedLayers.layer3).toBeDefined();
    });

    it('should assign DEFAULT_LAYER_OPTIONS to the managed layer the layer was not previously managed', () => {
      managedLayerFeature.registerLayer('layer3');
      const layerOptions = managedLayerFeature._managedLayers.layer3;

      Object.entries(
        ManagedAnimationLayerInterface.DEFAULT_LAYER_OPTIONS
      ).forEach(([name, value]) => {
        expect(layerOptions[name]).toEqual(value);
      });
    });

    it("should update the managed layer's options with the given options object", () => {
      expect(
        managedLayerFeature._managedLayers.layer1.customProperty
      ).not.toBeDefined();

      managedLayerFeature.registerLayer('layer1', {customProperty: 'value'});

      expect(managedLayerFeature._managedLayers.layer1.customProperty).toEqual(
        'value'
      );
    });

    it("should set the layer's isActive property to true if an animation feature exists and contains an animation with the given name", () => {
      expect(managedLayerFeature._managedLayers.layer1.isActive).toBeFalse();

      managedLayerFeature.registerLayer('layer1');

      expect(managedLayerFeature._managedLayers.layer1.isActive).toBeTrue();
    });

    it('should execute registerAnimation for any animations defined in the options object', () => {
      managedLayerFeature.registerLayer('layer1', {
        animations: {anim1: {customProperty: 1}, anim2: {customProperty: 2}},
      });

      expect(onRegisterAnimation).toHaveBeenCalledWith('layer1', 'anim1', {
        customProperty: 1,
      });

      expect(onRegisterAnimation).toHaveBeenCalledWith('layer1', 'anim2', {
        customProperty: 2,
      });
    });
  });

  describe('registerAnimation', () => {
    let onRegisterLayer;

    beforeEach(() => {
      const {registerLayer} = managedLayerFeature;
      onRegisterLayer = spyOn(managedLayerFeature, 'registerLayer');
      onRegisterLayer.and.callFake(registerLayer.bind(managedLayerFeature));
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: true,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
        layer2: {
          isActive: true,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
      };
    });

    it('should execute onRegisterLayer if there is no managed layer matching the given layerName', () => {
      managedLayerFeature.registerAnimation('layer3', 'anim1');

      expect(onRegisterLayer).toHaveBeenCalledWith('layer3');
    });

    it("should add a new key to the managed layer's animations property if on with the given name does not already exist", () => {
      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim3
      ).not.toBeDefined();

      managedLayerFeature.registerAnimation('layer1', 'anim3');

      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim3
      ).toBeDefined();
    });

    it("should update the managed animation's options with the given options object", () => {
      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1
          .customProperty
      ).not.toBeDefined();

      managedLayerFeature.registerAnimation('layer1', 'anim1', {
        customProperty: 'value',
      });

      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1
          .customProperty
      ).toEqual('value');
    });

    it("should set the animation's isActive property to true if an animation feature exists and contains an animation with the given name on a layer with the given name", () => {
      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1.isActive
      ).toBeFalse();

      managedLayerFeature.registerAnimation('layer1', 'anim1');

      expect(
        managedLayerFeature._managedLayers.layer1.animations.anim1.isActive
      ).toBeTrue();
    });
  });

  describe('setLayerWeights', () => {
    beforeEach(() => {
      managedLayerFeature._managedLayers = {
        layer1: {
          isActive: true,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
        layer2: {
          isActive: false,
          animations: {anim1: {isActive: false}, anim2: {isActive: false}},
        },
      };
    });

    it('should execute AnimationFeature.setLayerWeight on all active managed layers by default', () => {
      managedLayerFeature.setLayerWeights(undefined, 1, 1, undefined);

      expect(mockAnimationFeature.setLayerWeight).toHaveBeenCalledWith(
        'layer1',
        1,
        1,
        undefined
      );

      expect(mockAnimationFeature.setLayerWeight).not.toHaveBeenCalledWith(
        'layer2',
        1,
        1,
        undefined
      );
    });

    it('should execute AnimationFeature.setLayerWeight on any active managed layers that pass the name filter', () => {
      managedLayerFeature._managedLayers.layer2.isActive = true;
      managedLayerFeature.setLayerWeights(
        name => name.endsWith('2'),
        1,
        1,
        undefined
      );

      expect(mockAnimationFeature.setLayerWeight).not.toHaveBeenCalledWith(
        'layer1',
        1,
        1,
        undefined
      );

      expect(mockAnimationFeature.setLayerWeight).toHaveBeenCalledWith(
        'layer2',
        1,
        1,
        undefined
      );
    });

    it('should not execute AnimationFeature.setLayerWeight if there are no active layers', () => {
      managedLayerFeature._managedLayers.layer1.isActive = false;
      managedLayerFeature.setLayerWeights(undefined, 1, 1, undefined);

      expect(mockAnimationFeature.setLayerWeight).not.toHaveBeenCalled();
    });
  });

  describe('enable', () => {
    it('should execute setLayerWeights with a weight value of 1', () => {
      const onSetLayerWeights = spyOn(managedLayerFeature, 'setLayerWeights');
      managedLayerFeature.enable();

      expect(onSetLayerWeights).toHaveBeenCalledWith(
        undefined,
        1,
        undefined,
        undefined
      );
    });
  });

  describe('disable', () => {
    it('should execute setLayerWeights with a weight value of 0', () => {
      const onSetLayerWeights = spyOn(managedLayerFeature, 'setLayerWeights');
      managedLayerFeature.disable();

      expect(onSetLayerWeights).toHaveBeenCalledWith(
        undefined,
        0,
        undefined,
        undefined
      );
    });
  });
});
