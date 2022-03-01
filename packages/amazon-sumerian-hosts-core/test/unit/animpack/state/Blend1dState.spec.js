// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
import {Blend1dState, Deferred} from '@amazon-sumerian-hosts/core';
import describeHostEnviornment from '../../EnvironmentHarness';

describeHostEnviornment('Blend1dState', () => {
  let state1;
  let state2;
  let state3;

  beforeEach(() => {
    state1 = {
      name: 'state1',
      weight: 1,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      internalWeight: jasmine.createSpy('internalWeight'),
      discard: jasmine.createSpy('discard'),
    };
    state1.updateInternalWeight.and.callFake(factor => {
      state1._internalWeight = state1.weight * factor;
    });
    state1.setWeight.and.callFake(weight => {
      state1.weight = weight;
    });
    state2 = {
      name: 'state2',
      weight: 0,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      internalWeight: jasmine.createSpy('internalWeight'),
      discard: jasmine.createSpy('discard'),
    };
    state2.updateInternalWeight.and.callFake(factor => {
      state2._internalWeight = state2.weight * factor;
    });
    state2.setWeight.and.callFake(weight => {
      state2.weight = weight;
    });
    state3 = {
      name: 'state2',
      weight: 0.5,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      internalWeight: jasmine.createSpy('internalWeight'),
      discard: jasmine.createSpy('discard'),
    };
    state3.updateInternalWeight.and.callFake(factor => {
      state3._internalWeight = state3.weight * factor;
    });
    state3.setWeight.and.callFake(weight => {
      state3.weight = weight;
    });
  });

  describe('constructor', () => {
    it('should throw an error when the number of blendStates is non-zero and the count of blendStates does not match the count of blendThresholds', () => {
      expect(() => {
        const blend = new Blend1dState({}, [state1], []);
      }).toThrowError();
    });

    it('should throw an error when there are duplicate values in blendThresholds', () => {
      expect(() => {
        const blend = new Blend1dState({}, [state1, state2], [0, 0]);
      }).toThrowError();
    });

    it('should initialize blend states with the corresponding blend weights when they are passed in', () => {
      const thresholds = [0.24, 0.52];
      const blend = new Blend1dState({}, [state1, state2], thresholds);

      blend._thresholds.forEach((threshold, index) => {
        expect(threshold.value).toEqual(thresholds[index]);
      });
    });
  });

  describe('_sortThresholds', () => {
    it('should sort the _thresholds list by value from low to high', () => {
      const blend = new Blend1dState({});
      blend._thresholds.push({value: 1}, {value: 0});

      let values = blend._thresholds.map(threshold => threshold.value);

      expect(values).toEqual([1, 0]);

      blend._sortThresholds();

      values = blend._thresholds.map(threshold => threshold.value);

      expect(values).toEqual([0, 1]);
    });
  });

  describe('setBlendWeight', () => {
    let blend;

    beforeEach(() => {
      blend = new Blend1dState({}, [state1], [0]);
    });

    it('should return a deferred promise', () => {
      const interpolator = blend.setBlendWeight(null, 1);

      expect(interpolator).toBeInstanceOf(Deferred);
    });

    it('should update the blend value when the promise is executed', () => {
      const interpolator = blend.setBlendWeight(null, 1, 1);

      expect(blend.blendValue).toEqual(0);

      interpolator.execute(250);

      expect(blend.blendValue).toEqual(0.25);
    });

    it('should resolve once the blend value reaches the target value', async () => {
      const interpolator = blend.setBlendWeight(null, 1, 1);

      interpolator.execute(1000);

      await expectAsync(interpolator).toBeResolved();
    });
  });

  describe('addState', () => {
    it('should throw an error if a state is added with an already existing threshold', () => {
      const blend = new Blend1dState({}, [state1], [0]);

      expect(() => {
        blend.addState(state2, 0);
      }).toThrowError();
    });

    it('should add a corresponding entry to the _threshold list', () => {
      const blend = new Blend1dState({});

      blend.addState(state1, 1);

      expect(blend._thresholds[0]).toEqual({
        value: 1,
        name: 'state1',
        phaseMatch: false,
      });
    });
  });

  describe('removeState', () => {
    it('should remove the corresponding entry from the _threshold list', () => {
      const blend = new Blend1dState({}, [state1], [0]);

      expect(blend._thresholds.length).toEqual(1);

      blend.removeState('state1');

      expect(blend._thresholds.length).toEqual(0);
    });
  });

  describe('renameState', () => {
    it('should rename the corresponding entry from the _threshold list', () => {
      const blend = new Blend1dState({}, [state1], [0]);

      expect(blend._thresholds[0].name).toEqual('state1');

      blend.renameState('state1', 'state2');

      expect(blend._thresholds[0].name).toEqual('state2');
    });
  });

  describe('getBlendThreshold', () => {
    it('should throw an error when the state is not in the container', () => {
      const blend = new Blend1dState({});

      expect(() => {
        blend.getBlendThreshold('NotState');
      }).toThrowError();
    });

    it('should get the weight for the state', () => {
      const blend = new Blend1dState({}, [state1], [0.52]);

      expect(blend.getBlendThreshold('state1')).toEqual(0.52);
    });
  });

  describe('setBlendThreshold', () => {
    it('should throw an error when the state is not in the container', () => {
      const blend = new Blend1dState({});

      expect(() => {
        blend.setBlendThreshold('NotState');
      }).toThrowError();
    });

    it('should get the weight for the state', () => {
      const blend = new Blend1dState({}, [state1], [0.52]);
      blend.setBlendThreshold('state1', 0.24);

      expect(blend.getBlendThreshold('state1')).toEqual(0.24);
    });

    it('should maintain the _thresholds list sorted order', () => {
      const blend = new Blend1dState({}, [state1, state2], [0.24, 0.52]);

      let values = blend._thresholds.map(threshold => threshold.value);

      expect(values).toEqual([0.24, 0.52]);

      blend.setBlendThreshold('state2', 0.1);

      values = blend._thresholds.map(threshold => threshold.value);

      expect(values).toEqual([0.1, 0.24]);
    });
  });

  describe('_updateBlendWeights', () => {
    it('should update the weight of the sub-state 1 if there is a single sub-state', () => {
      const blend = new Blend1dState({}, [state1], [0]);

      blend._updateBlendWeights();

      expect(state1.weight).toEqual(1);
    });

    it('should update the weight of the sub-state with the lowest threshold to 1 if the blend parameter is below the lowest threshold', () => {
      const blend = new Blend1dState({}, [state1, state2], [0, 1]);

      blend._blendValue = -1;
      blend._updateBlendWeights();

      expect(state1.weight).toEqual(1);
      expect(state2.weight).toEqual(0);
    });

    it('should update the weight of the sub-state with the highest threshold to 1 if the blend parameter is above the highest threshold', () => {
      const blend = new Blend1dState({}, [state1, state2], [0, 1]);

      blend._blendValue = 2;
      blend._updateBlendWeights();

      expect(state1.weight).toEqual(0);
      expect(state2.weight).toEqual(1);
    });

    it('should update two sub-states weights with linear interpolated values that sum to 1 if the blend parameter is between two thresholds', () => {
      const blend = new Blend1dState({}, [state1, state2], [0, 1]);

      blend._blendValue = 0.5;
      blend._updateBlendWeights();

      expect(state1.weight).toEqual(0.5);
      expect(state2.weight).toEqual(0.5);

      blend._blendValue = 0.25;
      blend._updateBlendWeights();

      expect(state1.weight).toEqual(0.75);
      expect(state2.weight).toEqual(0.25);

      blend._blendValue = 1;
      blend._updateBlendWeights();

      expect(state1.weight).toEqual(0);
      expect(state2.weight).toEqual(1);
    });

    it('should set _phaseLeadState to null when blendValue is between two sub-states that are not both set to phase-match', () => {
      const blend = new Blend1dState(
        {},
        [state1, state2],
        [-1, 1],
        [true, false]
      );
      blend._phaseLeadState = state1;

      blend._updateBlendWeights();

      expect(blend._phaseLeadState).toEqual(null);
    });

    it('should set _phaseLeadState to the sub-state with the higher weight when blendValue is between two thresholds', () => {
      const blend = new Blend1dState(
        {},
        [state1, state2],
        [-1, 1],
        [true, true]
      );
      blend._phaseLeadState = null;
      blend._weight = 0.75;

      blend._updateBlendWeights();

      expect(blend._phaseLeadState).toEqual(state2);
    });
  });

  describe('updateInternalWeight', () => {
    it('should match the normalizedTime of all sub-states with non-zero weight when _leadPhaseState is not null', () => {
      const blend = new Blend1dState(
        {},
        [state1, state2],
        [-1, 1],
        [true, true]
      );
      blend._phaseLeadState = state1;

      state1.normalizedTime = 0;
      state2.normalizedTime = 1;

      blend.updateInternalWeight(1);

      expect(state1.normalizedTime).toEqual(state2.normalizedTime);
    });

    it('should update sub-state internal weights such that they equal the internal weight of the container', () => {
      const blend = new Blend1dState({}, [state1, state2], [-1, 1]);
      blend._updateBlendWeights();

      blend.updateInternalWeight(1);

      let sumSubInternalWeights = 0;
      blend._states.forEach(state => {
        sumSubInternalWeights += state._internalWeight;
      });

      expect(sumSubInternalWeights).toEqual(blend._internalWeight);

      blend.setWeight(0.5);
      blend.updateInternalWeight(0.5);

      sumSubInternalWeights = 0;
      blend._states.forEach(state => {
        sumSubInternalWeights += state._internalWeight;
      });

      expect(sumSubInternalWeights).toEqual(blend._internalWeight);
    });
  });
});
