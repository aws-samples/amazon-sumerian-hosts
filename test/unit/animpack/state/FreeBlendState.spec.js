// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */

import describeHostEnvironment from "../../EnvironmentHarness";
import FreeBlendState from "../../../../src/core/animpack/state/FreeBlendState";
import Deferred from 'core/Deferred';

describeHostEnvironment('FreeBlendState', (options = {}, env) => {
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

  describe('animations', () => {
    it('should return an array of state names that the FreeBlendState controls', () => {
      let anims = freeBlend.animations;
      expect(anims.length).toEqual(2);
      expect(anims.includes('state1')).toBeTrue();
      expect(anims.includes('state2')).toBeTrue();
    });
  });

  describe('addState', () => {
    it('should execute a console warning if the state is already in the FreeBlendState', () => {
      const onWarn = spyOn(console, 'warn');
      freeBlend.addState(state1);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should not add a new state if the state is already in the FreeBlendState', () => {
      const numStates = freeBlend._states.size;
      freeBlend.addState(state1);

      expect(freeBlend._states.size).toEqual(numStates);
    });

    it('should execute a console warning if a state with the same name exits in the FreeBlendState', () => {
      const onWarn = spyOn(console, 'warn');
      freeBlend.addState(state3);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should increment a new state\'s name if a state with the same name exists in the FreeBlendState', () => {
      const currentName = state3.name;
      freeBlend.addState(state3);

      expect(state3.name).toBeGreaterThan(currentName);
    });

    it('should store a new key in the _states map', () => {
      const numStates = freeBlend._states.size;
      freeBlend.addState(state3);

      expect(freeBlend._states.size).toBeGreaterThan(numStates);
    });

    it('should return the name of the state', () => {
      const result = freeBlend.addState(state3);

      expect(state3.name).toEqual(result);
    });
  });

  describe('removeState', () => {
    it('should execute a console warning if the state is not in the container', () => {
      const onWarn = spyOn(console, 'warn');
      freeBlend.removeState('NonState');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should remove the state from the _states map', () => {
      freeBlend.removeState('state1');

      expect(freeBlend._states.has('state1')).toBeFalse();
    });
  });

  describe('renameState', () => {
    it('should throw an error if the state is not in the container', () => {
      expect(() => {
        freeBlend.renameState('NotState', 'NewStateName')
      }).toThrowError();
    });

    it('should not change the name if newName is currentName', () => {
      const currentName = state1.name;
      expect(freeBlend.renameState(state1.name, state1.name)).toEqual(currentName);
    });

    it('should execute a console warning if a state with the same newName exits in the FreeBlendState', () => {
      const onWarn = spyOn(console, 'warn');
      freeBlend.renameState('state1', 'state2');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should increment a new state\'s name if a state with the same name exists in the FreeBlendState', () => {
      freeBlend.renameState(state1.name, state2.name);

      expect(state1.name).toBeGreaterThan(state2.name);
    });

    it('should store the new state key and remove the old key', () => {
      const oldName = state1.name;
      const newName = 'newStateName';
      freeBlend.renameState(oldName, newName);

      expect(freeBlend._states.has(newName)).toBeTrue();
      expect(freeBlend._states.has(oldName)).toBeFalse();
    });

    it('should not change the number of states in the container', () => {
      const numStates = freeBlend._states.size;
      freeBlend.renameState(state1.name, state2.name);

      expect(freeBlend._states.size).toEqual(numStates);
    });

    it('should return the new name of the state', () => {
      const result = freeBlend.renameState(state1.name, 'newStateName');

      expect(state1.name).toEqual(result);
    });
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
      let freeBlend = new FreeBlendState({weight: 1});
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
      let freeBlend = new FreeBlendState({weight: 1});
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
      let freeBlend = new FreeBlendState({weight: 1});
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

  describe('discard', () => {
    it('should execute discard on all stored states', () => {
      const states = [...freeBlend._states.values()];
      freeBlend.discard();

      states.forEach(state => {
        expect(state.discard).toHaveBeenCalledTimes(1);
      });
    });

    it('should remove all references to states', () => {
      expect(freeBlend._states).toBeDefined();

      freeBlend.discard();

      expect(freeBlend._states).not.toBeDefined();
    });
  });
});