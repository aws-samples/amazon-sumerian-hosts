// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */

import Deferred from 'core/Deferred';
import describeHostEnvironment from "../../EnvironmentHarness";
import FreeBlendState from "../../../../src/core/animpack/state/FreeBlendState";

describeHostEnvironment('FreeBlendState', () => {
  let freeBlend;
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
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      resume: jasmine.createSpy('resume'),
      cancel: jasmine.createSpy('cancel'),
      stop: jasmine.createSpy('stop'),
      update: jasmine.createSpy('update'),
      discard: jasmine.createSpy('discard'),
      _promises: {weight: new Deferred(), play: new Deferred()},
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
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      resume: jasmine.createSpy('resume'),
      cancel: jasmine.createSpy('cancel'),
      stop: jasmine.createSpy('stop'),
      update: jasmine.createSpy('update'),
      discard: jasmine.createSpy('discard'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
    state2.updateInternalWeight.and.callFake(factor => {
      state2._internalWeight = state1.weight * factor;
    });
    state2.setWeight.and.callFake(weight => {
      state2.weight = weight;
    });
    state3 = {
      name: 'state2',
      weight: 0.5,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      resume: jasmine.createSpy('resume'),
      cancel: jasmine.createSpy('cancel'),
      stop: jasmine.createSpy('stop'),
      update: jasmine.createSpy('update'),
      discard: jasmine.createSpy('discard'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
    state3.updateInternalWeight.and.callFake(factor => {
      state3._internalWeight = state1.weight * factor;
    });
    state3.setWeight.and.callFake(weight => {
      state3.weight = weight;
    });

    freeBlend = new FreeBlendState();
    freeBlend.addState(state1);
    freeBlend.addState(state2);
  });

  describe('getBlendWeight', () => {
    it('should throw an error when the state is not in the container', () => {
      expect(() => {
        freeBlend.getBlendWeight('NotState');
      }).toThrowError();
    });

    it('should get the weight for the state', () => {
      const weight = 0.52
      state1.weight = weight;

      expect(freeBlend.getBlendWeight('state1')).toEqual(weight);
    });
  });

  describe('setBlendWeight', () => {
    it('should throw an error when the state is not in the container', () => {
      expect(() => {
        freeBlend.setBlendWeight('NotState');
      }).toThrowError();
    });

    it('should set the state weight to the target weight', async () =>  {
      const weight = 0.52;

      expect(state1.weight).not.toEqual(weight);

      await freeBlend.setBlendWeight(state1.name, weight);

      expect(state1.weight).toEqual(weight);
    });

    it('should clamp state weights between 0 and 1', async () => {
      await freeBlend.setBlendWeight('state1', -10);

      expect(freeBlend.getBlendWeight('state1')).toEqual(0);
      await freeBlend.setBlendWeight('state1', 10);

      expect(freeBlend.getBlendWeight('state1')).toEqual(1);
    });
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
        expect(state._internalWeight).toEqual(1/2);
      });

      state3.weight = 1.0;

      freeBlend.updateInternalWeight(1);

      freeBlend._states.forEach(state => {
        expect(state._internalWeight).toEqual(1/3);
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
        expect(state._internalWeight).toEqual(1/4);
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

  describe('play', () => {
    it('should play all blend states', () => {
      freeBlend.play();

      freeBlend._states.forEach(state => {
        expect(state.play).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('pause', () => {
    it('should pause all blend states', () => {
      freeBlend.pause();

      freeBlend._states.forEach(state => {
        expect(state.pause).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('resume', () => {
    it('should resume all blend states', () => {
      freeBlend.resume();

      freeBlend._states.forEach(state => {
        expect(state.resume).toHaveBeenCalledTimes(1);
      })
    });
  });

  describe('stop', () => {
    it('should stop all blend states', () => {
      freeBlend.stop();

      freeBlend._states.forEach(state => {
        expect(state.stop).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('cancel', () => {
    it('should cancel all blend states', () => {
      freeBlend.cancel();

      freeBlend._states.forEach(state => {
        expect(state.cancel).toHaveBeenCalledTimes(1);
      });
    });
  });
});