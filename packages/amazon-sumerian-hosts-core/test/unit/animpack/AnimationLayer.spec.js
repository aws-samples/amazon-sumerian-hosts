// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-empty */
/* eslint-disable no-undef */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-underscore-dangle */
import {AnimationLayer, Deferred, LayerBlendModes} from '@amazon-sumerian-hosts/core';

describe('AnimationLayer', () => {
  let layer;
  let state1;
  let state2;
  let state3;

  beforeEach(() => {
    state1 = {
      name: 'state1',
      weight: 1,
      setWeight: jasmine.createSpy('setWeight'),
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
    state1.setWeight.and.callFake(() => new Deferred());
    state2 = {
      name: 'state2',
      weight: 0,
      setWeight: jasmine.createSpy('setWeight'),
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
    state2.setWeight.and.callFake(() => new Deferred());
    state3 = {
      name: 'state2',
      weight: 0.5,
      setWeight: jasmine.createSpy('setWeight'),
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
    state3.setWeight.and.callFake(() => new Deferred());
    layer = new AnimationLayer();
    layer._states.set('state1', state1);
    layer._states.set('state2', state2);
    layer._currentState = state1;
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

      layer._promises.weight.catch();

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

    it('should resolve once the weight reaches the target value', async () => {
      const interpolator = layer.setWeight(1, 1);

      interpolator.execute(1000);

      await expectAsync(interpolator).toBeResolved();
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

  describe('update', () => {
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
    it('should cancel the weight promise', async () => {
      const weightPromise = new Deferred();
      layer._promises.weight = weightPromise;

      expect(weightPromise.canceled).toBeFalse();

      layer.discard();

      expect(weightPromise.canceled).toBeTrue();
      await expectAsync(weightPromise).toBeResolved();
    });

    it('should remove all references to promises', () => {
      expect(layer._promises).toBeDefined();

      layer.discard();

      expect(layer._promises).not.toBeDefined();
    });
  });
});
