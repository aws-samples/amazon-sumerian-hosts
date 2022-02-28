// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */

import describeHostEnvironment from '../../EnvironmentHarness';
import FreeBlendState from '../../../../src/core/animpack/state/FreeBlendState';

describeHostEnvironment('FreeBlendState', () => {
  let freeBlend;
  let state1;
  let state2;
  let state3;

  beforeEach(() => {
    state1 = {
      name: 'state1',
      weight: 1,
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
    };
    state1.updateInternalWeight.and.callFake(factor => {
      state1._internalWeight = state1.weight * factor;
    });
    state2 = {
      name: 'state2',
      weight: 0,
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
    };
    state2.updateInternalWeight.and.callFake(factor => {
      state2._internalWeight = state1.weight * factor;
    });
    state3 = {
      name: 'state2',
      weight: 0.5,
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
    };
    state3.updateInternalWeight.and.callFake(factor => {
      state3._internalWeight = state1.weight * factor;
    });

    freeBlend = new FreeBlendState();
    freeBlend.addState(state1);
    freeBlend.addState(state2);
  });

  describe('updateInternalWeight', () => {
    it('should normalize blend state internal weights when the sum of blend state weights is greater than one', () => {
      const freeBlend = new FreeBlendState({weight: 1});
      freeBlend.addState(state1);
      freeBlend.addState(state2);
      freeBlend.addState(state3);
      state1.weight = 1.0;
      state2.weight = 1.0;
      state3.weight = 0.0;

      freeBlend.updateInternalWeight(1);

      freeBlend._states.forEach(state => {
        expect(state._internalWeight).toEqual(1 / 2);
      });

      state3.weight = 1.0;

      freeBlend.updateInternalWeight(1);

      freeBlend._states.forEach(state => {
        expect(state._internalWeight).toEqual(1 / 3);
      });
    });

    it('should not normalize blend state internal weights when the sum of blend state weights is not greater than one', () => {
      const freeBlend = new FreeBlendState({weight: 1});
      freeBlend.addState(state1);
      freeBlend.addState(state2);
      freeBlend.addState(state3);
      state1.weight = 0.25;
      state2.weight = 0.25;
      state3.weight = 0.25;

      freeBlend.updateInternalWeight(1);

      freeBlend._states.forEach(state => {
        expect(state._internalWeight).toEqual(1 / 4);
      });
    });

    it('should update blend state internal weights based on container weight', () => {
      const freeBlend = new FreeBlendState({weight: 1});
      freeBlend.addState(state1);
      freeBlend.addState(state2);
      state1.weight = 1.0;
      state2.weight = 1.0;

      freeBlend.updateInternalWeight(1);
      freeBlend._states.forEach(state => {
        expect(state._internalWeight).toEqual(0.5);
      });

      freeBlend.weight = 0.5;

      freeBlend.updateInternalWeight(1);
      freeBlend._states.forEach(state => {
        expect(state._internalWeight).toEqual(0.25);
      });
    });
  });
});
