// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */

import RandomAnimationState from 'core/animpack/state/RandomAnimationState';
import Deferred from 'core/Deferred';
import Utils from 'core/Utils';
import describeHostEnvironment from '../../EnvironmentHarness';

describeHostEnvironment('RandomAnimationState', () => {
  let randomAnimState;
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
      deactivate: jasmine.createSpy('deactivate'),
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
      deactivate: jasmine.createSpy('deactivate'),
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
      deactivate: jasmine.createSpy('deactivate'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
    state3.updateInternalWeight.and.callFake(factor => {
      state3._internalWeight = state1.weight * factor;
    });
    state3.setWeight.and.callFake(weight => {
      state3.weight = weight;
    });
    spyOn(Utils, 'getRandomInt').and.returnValue(0);

    randomAnimState = new RandomAnimationState();
    randomAnimState.addState(state1);
    randomAnimState.addState(state2);
  });

  describe('_resetTimer', () => {
    it('should reset play timer using Utils function', () => {
      spyOn(Utils, 'getRandomFloat').and.returnValue(0.5);
      randomAnimState._resetTimer();

      expect(Utils.getRandomFloat).toHaveBeenCalledWith(
        randomAnimState._playInterval / 4,
        randomAnimState._playInterval * 2
      );

      expect(randomAnimState._promises.timer).toBeInstanceOf(Deferred);
    });
  });

  describe('updateInternalWeight', () => {
    it('should update currentState internal weight internal weight of this state', () => {
      const randomAnimState = new RandomAnimationState({weight: 1});
      randomAnimState.addState(state1);
      randomAnimState.addState(state2);
      state1.weight = 1.0;
      state2.weight = 1.0;
      randomAnimState._currentState = state1;

      randomAnimState.updateInternalWeight(1 / 2);

      expect(state1._internalWeight).toEqual(1 / 2);
      expect(state2._internalWeight).toBeUndefined();
    });
  });

  describe('playRandomAnimation', () => {
    it('should prepare and call state1 play function', () => {
      randomAnimState.playRandomAnimation();

      expect(Utils.getRandomInt).toHaveBeenCalledWith(0, 2);
      expect(state1.play).toHaveBeenCalledTimes(1);
    });
  });

  describe('play', () => {
    it('should call state1 play function', () => {
      randomAnimState.play();

      expect(state1.play).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause', () => {
    it('should call state1 pause function', () => {
      randomAnimState.play();
      randomAnimState.pause();

      expect(state1.pause).toHaveBeenCalledTimes(1);
    });
  });

  describe('resume', () => {
    it('should call state1 resume function', () => {
      randomAnimState.play();
      randomAnimState.resume();

      expect(state1.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('should call stopAnimation function', () => {
      randomAnimState.stopAnimation = jasmine.createSpy('stopAnimation');
      randomAnimState.play();
      randomAnimState.stop();

      expect(randomAnimState.stopAnimation).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel', () => {
    it('should call state 1 cancel function', () => {
      randomAnimState.play();
      randomAnimState.cancel();

      expect(state1.cancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('discard', () => {
    it('should execute discard on all stored states', () => {
      const states = [...randomAnimState._states.values()];
      randomAnimState.discard();

      states.forEach(state => {
        expect(state.discard).toHaveBeenCalledTimes(1);
      });
    });

    it('should remove all references to states', () => {
      expect(randomAnimState._states).toBeDefined();

      randomAnimState.discard();

      expect(randomAnimState._states).not.toBeDefined();
    });
  });
});
