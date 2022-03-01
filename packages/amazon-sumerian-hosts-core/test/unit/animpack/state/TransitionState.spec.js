// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable jasmine/no-spec-dupes */
import {Deferred, TransitionState} from '@amazon-sumerian-hosts/core';

describe('TransitionState', () => {
  let state;
  let toState;
  let fromStates;

  beforeEach(() => {
    toState = {
      weight: 0,
      setWeight: jasmine.createSpy('setWeight'),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      resume: jasmine.createSpy('resume'),
      cancel: jasmine.createSpy('cancel'),
      stop: jasmine.createSpy('stop'),
      update: jasmine.createSpy('update'),
      deactivate: jasmine.createSpy('deactivate'),
      _promises: {weight: new Deferred()},
    };
    toState.setWeight.and.callFake(weight => {
      toState.weight = weight;
      return Deferred.resolve();
    });
    fromStates = [
      {
        weight: 0.5,
        setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
        updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
        play: jasmine.createSpy('play'),
        pause: jasmine.createSpy('pause'),
        resume: jasmine.createSpy('resume'),
        cancel: jasmine.createSpy('cancel'),
        stop: jasmine.createSpy('stop'),
        update: jasmine.createSpy('update'),
        deactivate: jasmine.createSpy('deactivate'),
        _promises: {weight: new Deferred()},
      },
      {
        weight: 0.5,
        setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
        updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
        play: jasmine.createSpy('play'),
        pause: jasmine.createSpy('pause'),
        resume: jasmine.createSpy('resume'),
        cancel: jasmine.createSpy('cancel'),
        stop: jasmine.createSpy('stop'),
        update: jasmine.createSpy('update'),
        deactivate: jasmine.createSpy('deactivate'),
        _promises: {weight: new Deferred()},
      },
    ];
    fromStates[0].setWeight.and.callFake(weight => {
      fromStates[0].weight = weight;
      return Deferred.resolve();
    });
    fromStates[1].setWeight.and.callFake(weight => {
      fromStates[1].weight = weight;
      return Deferred.resolve();
    });
    state = new TransitionState();
    state._weight = 1;
    state._internalWeight = 1;
    state._to = toState;
    state._from = fromStates;
  });

  describe('internalWeight', () => {
    it('should return the sum of all controlled states multiplied by the _internalWeight of the state', () => {
      state._internalWeight = 0.25;

      expect(state.internalWeight).toEqual(
        (toState.weight + fromStates[0].weight + fromStates[1].weight) *
          state._internalWeight
      );

      state._to = null;
      state._internalWeight = 0.75;

      expect(state.internalWeight).toEqual(
        (fromStates[0].weight + fromStates[1].weight) * state._internalWeight
      );
    });
  });

  describe('updateInternalWeight', () => {
    it('should execute updateInternalWeight on all controlled states', () => {
      state.updateInternalWeight(0.35);

      expect(toState.updateInternalWeight).toHaveBeenCalledWith(0.35);
      expect(fromStates[0].updateInternalWeight).toHaveBeenCalledWith(0.35);
      expect(fromStates[1].updateInternalWeight).toHaveBeenCalledWith(0.35);
    });
  });

  describe('configure', () => {
    it('should cancel the current weight promise', () => {
      const onCancel = spyOn(state._weightPromise, 'cancel');

      state.configure(fromStates, toState, 1);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should store a new weight promise for each controlled state', () => {
      state._to = null;
      state._from = [];
      state.configure(fromStates, toState, 1);

      expect(toState.setWeight).toHaveBeenCalledWith(1, 1, undefined);
      expect(fromStates[0].setWeight).toHaveBeenCalledWith(0, 1, undefined);
      expect(fromStates[1].setWeight).toHaveBeenCalledWith(0, 1, undefined);
    });

    it("should only resolve on its own the new weight promise once the target state's weight reaches 1 and the current state's weights reach 0", async () => {
      state.configure(fromStates, toState, 1);

      await expectAsync(state._weightPromise).toBeResolved();

      expect(toState.weight).toEqual(1);

      expect(fromStates[0].weight).toEqual(0);

      expect(fromStates[1].weight).toEqual(0);
    });

    it("should deactivate any states that aren't in the new configuration", () => {
      state._to = null;
      state._from = [fromStates[0]];
      state.configure([fromStates[1]], toState, 1);

      expect(fromStates[0].deactivate).toHaveBeenCalledTimes(1);
      expect(fromStates[1].deactivate).not.toHaveBeenCalled();
      expect(toState.deactivate).not.toHaveBeenCalled();
    });
  });

  describe('play', () => {
    it('should resume all from states', () => {
      state.play();

      expect(fromStates[0].resume).toHaveBeenCalledTimes(1);
      expect(fromStates[1].resume).toHaveBeenCalledTimes(1);
    });

    it('should play the to state', () => {
      state.play();

      expect(toState.play).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause', () => {
    it('should pause all controlled states', () => {
      state.pause();

      expect(fromStates[0].pause).toHaveBeenCalledTimes(1);
      expect(fromStates[1].pause).toHaveBeenCalledTimes(1);
      expect(toState.pause).toHaveBeenCalledTimes(1);
    });
  });

  describe('resume', () => {
    it('should resume all controlled states', () => {
      state.resume();

      expect(fromStates[0].resume).toHaveBeenCalledTimes(1);
      expect(fromStates[1].resume).toHaveBeenCalledTimes(1);
      expect(toState.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel', () => {
    it('should pause all from states', () => {
      state.cancel();

      expect(fromStates[0].pause).toHaveBeenCalledTimes(1);
      expect(fromStates[1].pause).toHaveBeenCalledTimes(1);
    });

    it('should cancel the to state', () => {
      state.cancel();

      expect(toState.cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('should pause all from states', () => {
      state.stop();

      expect(fromStates[0].pause).toHaveBeenCalledTimes(1);
      expect(fromStates[1].pause).toHaveBeenCalledTimes(1);
    });

    it('should stop the to state', () => {
      state.stop();

      expect(toState.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should update all controlled states', () => {
      state.update(200);

      expect(fromStates[0].update).toHaveBeenCalledWith(200);
      expect(fromStates[1].update).toHaveBeenCalledWith(200);
      expect(toState.update).toHaveBeenCalledWith(200);
    });
  });

  describe('discard', () => {
    it('should remove references to controlled states', () => {
      expect(state._to).not.toEqual(null);
      expect(state._from).not.toEqual([]);

      state.discard();

      expect(state._to).toEqual(null);
      expect(state._from).toEqual([]);
    });

    it('should cancel the _weightPromise', () => {
      const onCancel = spyOn(state._weightPromise, 'cancel');
      state.discard();

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('deactivate', () => {
    it('should execute deactivate on all controlled states', () => {
      state._to = toState;
      state._from = fromStates;
      state.deactivate();

      expect(fromStates[0].deactivate).toHaveBeenCalledTimes(1);
      expect(fromStates[1].deactivate).toHaveBeenCalledTimes(1);
      expect(toState.deactivate).toHaveBeenCalledTimes(1);
    });
  });
});
