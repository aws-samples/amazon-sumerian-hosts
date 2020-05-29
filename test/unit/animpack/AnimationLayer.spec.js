// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-empty */
/* eslint-disable no-undef */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-underscore-dangle */
import AnimationLayer, {LayerBlendModes} from 'core/animpack/AnimationLayer';
import Deferred from 'core/Deferred';

describe('AnimationLayer', () => {
  let layer;
  let state1;
  let state2;
  let state3;

  beforeEach(() => {
    state1 = {
      name: 'state1',
      weight: 1,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      resume: jasmine.createSpy('resume'),
      cancel: jasmine.createSpy('cancel'),
      stop: jasmine.createSpy('stop'),
      update: jasmine.createSpy('update'),
      discard: jasmine.createSpy('discard'),
      deactivate: jasmine.createSpy('deactivate'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
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
      deactivate: jasmine.createSpy('deactivate'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
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
      deactivate: jasmine.createSpy('deactivate'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
    layer = new AnimationLayer();
    layer._states.set('state1', state1);
    layer._states.set('state2', state2);
    layer._currentState = state1;
  });

  describe('paused', () => {
    it('should return a boolean', () => {
      expect(typeof layer.paused).toEqual('boolean');
    });
  });

  describe('blendMode', () => {
    it('should return a valid LayerBlendMode', () => {
      expect(Object.values(LayerBlendModes)).toContain(layer.blendMode);
    });
  });

  describe('weight', () => {
    it('should return a number', () => {
      expect(typeof layer.weight).toEqual('number');
    });

    it('should be clamped between 0 and 1', () => {
      layer.weight = -10;

      expect(layer.weight).toEqual(0);

      layer.weight = 10;

      expect(layer.weight).toEqual(1);
    });
  });

  describe('weightPending', () => {
    it('should return true if the weight promise has not been resolved, rejected or canceled', () => {
      layer._promises.weight = new Deferred();

      expect(layer.weightPending).toBeTrue();
    });

    it('should return false if the weight promise has been resolved', () => {
      layer._promises.weight = new Deferred();

      expect(layer.weightPending).toBeTrue();

      layer._promises.weight.resolve();

      expect(layer.weightPending).toBeFalse();
    });

    it('should return false if the weight promise has been rejected', () => {
      layer._promises.weight = new Deferred();

      expect(layer.weightPending).toBeTrue();

      layer._promises.weight.reject();

      expect(layer.weightPending).toBeFalse();
    });

    it('should return false if the weight promise has been canceled', () => {
      layer._promises.weight = new Deferred();

      expect(layer.weightPending).toBeTrue();

      layer._promises.weight.cancel();

      expect(layer.weightPending).toBeFalse();
    });
  });

  describe('pause', () => {
    it('should execute pauseAnimation', () => {
      const onPauseAnimation = spyOn(layer, 'pauseAnimation');
      layer.pause();

      expect(onPauseAnimation).toHaveBeenCalledTimes(1);
    });

    it('should prevent update from executing the weight promise', () => {
      layer._promises.weight = new Deferred();
      let onExecute = spyOn(layer._promises.weight, 'execute');
      layer.update(200);

      expect(onExecute).toHaveBeenCalledWith(200);

      layer._promises.weight = new Deferred();
      onExecute = spyOn(layer._promises.weight, 'execute');
      layer.pause();
      layer.update(200);

      expect(onExecute).not.toHaveBeenCalled();
    });

    it('should return a boolean', () => {
      expect(typeof layer.pause()).toEqual('boolean');
    });
  });

  describe('resume', () => {
    it('should execute resumeAnimation if there is a current state', () => {
      const onResumeAnimation = spyOn(layer, 'resumeAnimation');
      layer._currentState = null;
      layer.resume();

      expect(onResumeAnimation).not.toHaveBeenCalled();

      layer._currentState = state1;
      layer.resume();

      expect(onResumeAnimation).toHaveBeenCalledTimes(1);
    });

    it('should allow update to execute the weight promise', () => {
      const onExecute = spyOn(layer._promises.weight, 'execute');
      layer._paused = true;
      layer._weightPaused = true;
      layer.update(200);

      expect(onExecute).not.toHaveBeenCalled();

      layer.resume();
      layer.update(200);

      expect(onExecute).toHaveBeenCalledWith(200);
    });

    it('should return a boolean', () => {
      expect(typeof layer.resume()).toEqual('boolean');
    });
  });

  describe('setWeight', () => {
    it('should return a deferred promise', () => {
      const interpolator = layer.setWeight(1);

      expect(interpolator).toBeInstanceOf(Deferred);
    });

    it('should update the weight value when the promise is executed', () => {
      layer._weight = 0;
      const interpolator = layer.setWeight(1, 1);

      expect(layer.weight).toEqual(0);

      interpolator.execute(250);

      expect(layer.weight).toEqual(0.25);
    });

    it('should resolve once the weight reaches the target value', () => {
      const interpolator = layer.setWeight(1, 1);

      expectAsync(interpolator).not.toBeResolved();

      interpolator.execute(1000);

      expectAsync(interpolator).toBeResolved();
    });
  });

  describe('pauseWeight', () => {
    it('should prevent update from executing the weight promise', () => {
      const onExecute = spyOn(layer._promises.weight, 'execute');
      layer.update(200);

      expect(onExecute).toHaveBeenCalledWith(200);
      expect(onExecute).toHaveBeenCalledTimes(1);

      layer.pauseWeight();
      layer.update(200);

      expect(onExecute).toHaveBeenCalledTimes(1);
    });

    it('should return a boolean', () => {
      expect(typeof layer.pauseWeight()).toEqual('boolean');
    });
  });

  describe('resumeWeight', () => {
    it('should allow update to execute the weight promise', () => {
      const onExecute = spyOn(layer._promises.weight, 'execute');
      layer._weightPaused = true;
      layer.update(200);

      expect(onExecute).not.toHaveBeenCalled();

      layer.resumeWeight();
      layer.update(200);

      expect(onExecute).toHaveBeenCalledWith(200);
    });

    it('should return a boolean', () => {
      expect(typeof layer.resumeWeight()).toEqual('boolean');
    });
  });

  describe('updateInternalWeight', () => {
    it('should set the _internal weight to the value of weight multiplied by the input factor', () => {
      layer.weight = 0.5;
      layer.updateInternalWeight(0.5);

      expect(layer._internalWeight).toEqual(0.25);
    });

    it('should execute updateInternalWeight on the current state with the new _internalWeight value', () => {
      layer.weight = 0.5;
      layer.updateInternalWeight(0.5);

      expect(state1.updateInternalWeight).toHaveBeenCalledWith(0.25);
    });
  });

  describe('addAnimation', () => {
    it('should execute a console warning if the state is already on the layer', () => {
      const onWarn = spyOn(console, 'warn');
      layer.addAnimation(state1);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should not add a new state if the state is already on the layer', () => {
      const numStates = layer._states.size;
      layer.addAnimation(state1);

      expect(layer._states.size).toEqual(numStates);
    });

    it('should execute a console warning if a state with the same name exists on the layer', () => {
      const onWarn = spyOn(console, 'warn');
      layer.addAnimation(state3);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it("should increment the state's name if a state with the same name exists on the layer", () => {
      const currentName = state3.name;
      layer.addAnimation(state3);

      expect(state3.name).toBeGreaterThan(currentName);
    });

    it('should store a new key in the _states map', () => {
      const numStates = layer._states.size;
      layer.addAnimation(state3);

      expect(layer._states.size).toBeGreaterThan(numStates);
    });

    it('should return the name of the state', () => {
      const result = layer.addAnimation(state3);

      expect(result).toEqual(state3.name);
    });
  });

  describe('removeAnimation', () => {
    it('should execute a console warning if no state exists on the layer with the given name', () => {
      const onWarn = spyOn(console, 'warn');
      layer.removeAnimation('state5');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should return false if no state exists on the layer with the given name', () => {
      expect(layer.removeAnimation('state5')).toBeFalse();
    });

    it('should remove a key from the _states map', () => {
      const numStates = layer._states.size;
      layer.removeAnimation('state1');

      expect(layer._states.size).toBeLessThan(numStates);
    });

    it('should return true if a state was removed', () => {
      expect(layer.removeAnimation('state1')).toBeTrue();
    });
  });

  describe('renameAnimation', () => {
    it('should throw an error if no animation exists on the layer with the given current name', () => {
      expect(
        layer.renameAnimation.bind(layer, 'state4', 'state5')
      ).toThrowError();
    });

    it('should execute a console warning if the new name conflicts with another state on the layer', () => {
      const onWarn = spyOn(console, 'warn');
      layer.renameAnimation('state2', 'state1');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should remove the key from the _states map that has the current name', () => {
      expect(layer._states.get('state1')).toBeDefined();

      layer.renameAnimation('state1', 'state5');

      expect(layer._states.get('state1')).not.toBeDefined();
    });

    it('should add a new key to the _states map with the new name', () => {
      expect(layer._states.get('state5')).not.toBeDefined();

      layer.renameAnimation('state1', 'state5');

      expect(layer._states.get('state5')).toBeDefined();
    });

    it('should not modify the size of the _states map', () => {
      const numStates = layer._states.size;
      layer.renameAnimation('state1', 'state5');

      expect(layer._states.size).toEqual(numStates);
    });

    it('should return the updated name of the state', () => {
      const result = layer.renameAnimation('state1', 'state5');

      expect(result).toEqual(state1.name);
    });
  });

  describe('_prepareCurrentState', () => {
    it('should execute onError argument and throw an error if no state exists on the layer with the given name', () => {
      const onError = jasmine.createSpy('onError');
      try {
        layer._prepareCurrentState('state5', 'play', 0, undefined, onError);
      } catch (e) {}

      expect(onError).toHaveBeenCalledTimes(1);
      expect(
        layer._prepareCurrentState.bind(layer, 'state5', 'play')
      ).toThrowError();
    });

    it('should set _currentState to the targetState if transition time is less than or equal to 0', () => {
      expect(layer._currentState).not.toEqual(state2);

      layer._prepareCurrentState('state2', 'play', 0);

      expect(layer._currentState).toEqual(state2);
    });

    it("should force the previous _currentState's weight to 0 if transition time is less than or equal to 0", () => {
      expect(state1.weight).toEqual(1);

      layer._prepareCurrentState('state2', 'play', 0);

      expect(state1.weight).toEqual(0);
    });

    it('should set the _currentState to _transitionState if transition time is greater than zero', () => {
      expect(layer._currentState).not.toEqual(layer._transitionState);

      layer._prepareCurrentState('state2', 'play', 1);

      expect(layer._currentState).toEqual(layer._transitionState);
    });

    it("should force the new _currentState's weight to 1", () => {
      expect(state2.weight).toEqual(0);

      layer._prepareCurrentState('state2', 'play', 0);

      expect(state2.weight).toEqual(1);

      expect(layer._transitionState.weight).toEqual(0);

      layer._prepareCurrentState('state1', 'play', 1);

      expect(layer._transitionState.weight).toEqual(1);
    });

    it('should configure the transition state with currentStates set to an array of states with non-zero or pending weights', () => {
      state3.name = 'state3';
      layer._states.set('state3', state3);
      layer._prepareCurrentState('state2', 'play', 1);

      expect(layer._transitionState._from).toContain(state1);
      expect(layer._transitionState._from).toContain(state3);
      expect(layer._transitionState._from.length).toEqual(2);
    });
  });

  describe('playAnimation', () => {
    it('should return a rejected promise if _prepareCurrentState fails', () => {
      expectAsync(layer.playAnimation('state5')).toBeRejected();
    });

    it('should execute the onError function if _prepareCurrentState fails', () => {
      const onError = jasmine.createSpy('onError');
      layer.playAnimation('state5', 0, undefined, undefined, onError);

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should return the play promise of the new current state if _prepareCurrentState succeeds', () => {
      state2.play.and.callFake(() => state2._promises.play);
      const result = layer.playAnimation('state2');

      expect(result).toEqual(state2._promises.play);
    });
  });

  describe('pauseAnimation', () => {
    it('should execute pause on the current state', () => {
      layer.pauseAnimation();

      expect(state1.pause).toHaveBeenCalledTimes(1);
    });

    it('should return true if the current state was not null', () => {
      state1.pause.and.callFake(() => true);

      expect(layer.pauseAnimation()).toBeTrue();
    });

    it('should return false if the current state was null', () => {
      layer._currentState = null;

      expect(layer.pauseAnimation()).toBeFalse();
    });
  });

  describe('resumeAnimation', () => {
    it('should return a rejected promise if _prepareCurrentState fails', () => {
      expectAsync(layer.resumeAnimation('state5')).toBeRejected();
    });

    it('should execute the onError function if _prepareCurrentState fails', () => {
      const onError = jasmine.createSpy('onError');
      layer.resumeAnimation('state5', 0, undefined, undefined, onError);

      expect(onError).toHaveBeenCalledTimes(1);
    });

    it('should return the play promise of the new current state if _prepareCurrentState succeeds', () => {
      state2.resume.and.callFake(() => state2._promises.play);
      const result = layer.resumeAnimation('state2');

      expect(result).toEqual(state2._promises.play);
    });

    it('should execute resume on the current state if no input name is defined', () => {
      layer.resumeAnimation();

      expect(state1.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopAnimation', () => {
    it('should execute stop on the current state', () => {
      layer.stopAnimation();

      expect(state1.stop).toHaveBeenCalledTimes(1);
    });

    it('should return true if the current state was not null', () => {
      state1.stop.and.callFake(() => true);

      expect(layer.stopAnimation()).toBeTrue();
    });

    it('should return false if the current state was null', () => {
      layer._currentState = null;

      expect(layer.stopAnimation()).toBeFalse();
    });
  });

  describe('update', () => {
    it('should execute update on the current state', () => {
      layer.update(200);

      expect(state1.update).toHaveBeenCalledWith(200);
    });

    it("should execute the weight promise if the layer and weight aren't paused", () => {
      const onExecute = spyOn(layer._promises.weight, 'execute');
      layer._paused = true;
      layer._weightPaused = false;
      layer.update(200);

      expect(onExecute).not.toHaveBeenCalled();

      layer._paused = false;
      layer._weightPaused = true;
      layer.update(200);

      expect(onExecute).not.toHaveBeenCalled();

      layer._paused = false;
      layer._weightPaused = false;
      layer.update(200);

      expect(onExecute).toHaveBeenCalledTimes(1);
    });
  });

  describe('discard', () => {
    it('should execute discard on all stored states', () => {
      const onDiscard = spyOn(layer._transitionState, 'discard');
      layer.discard();

      expect(state1.discard).toHaveBeenCalledTimes(1);
      expect(state2.discard).toHaveBeenCalledTimes(1);
      expect(onDiscard).toHaveBeenCalledTimes(1);
    });

    it('should cancel the weight promise', () => {
      const weightPromise = new Deferred();
      layer._promises.weight = weightPromise;

      expect(weightPromise.canceled).toBeFalse();
      expectAsync(weightPromise).not.toBeResolved();

      layer.discard();

      expect(weightPromise.canceled).toBeTrue();
      expectAsync(weightPromise).toBeResolved();
    });

    it('should remove all references to states and promises', () => {
      expect(layer._states).toBeDefined();
      expect(layer._transitionState).toBeDefined();
      expect(layer._promises).toBeDefined();

      layer.discard();

      expect(layer._states).not.toBeDefined();
      expect(layer._transitionState).not.toBeDefined();
      expect(layer._promises).not.toBeDefined();
    });
  });
});
