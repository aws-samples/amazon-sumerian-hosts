// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
import SingleState from 'app/animpack/state/SingleState';
import {LayerBlendModes, Deferred} from '@amazon-sumerian-hosts/core';
import describeEnvironment from '../../EnvironmentHarness';

describeEnvironment('SingleState', () => {
  let state;

  beforeEach(() => {

    const mockThreeMixer = new THREE.EventDispatcher();
    const mockThreeAction = {
      clampWhenFinished: false,
      enabled: false,
      loop: THREE.LoopRepeat,
      paused: false,
      repetitions: Infinity,
      timeScale: 1,
      weight: 1,
      blendMode: THREE.NormalAnimationBlendMode,
      reset: jasmine.createSpy('reset'),
      play: jasmine.createSpy('play'),
      setEffectiveWeight: jasmine.createSpy('setEffectiveWeight'),
      getMixer: () => {
        return mockThreeMixer;
      },
    };
    state = new SingleState(undefined, mockThreeAction);
  });

  describe('normalizedTime', () => {
    describe('three get', () => {
      it('should return 0 if time does not exist in threeAction', () => {
        expect(state.normalizedTime).toEqual(0);
      });

      it('should return time divided by clip duration', () => {
        state._threeAction.time = 0.5;
        state._threeAction.getClip = jasmine
          .createSpy()
          .and.callFake(function() {
            return {duration: 1};
          });

        expect(state.normalizedTime).toEqual(0.5);
      });
    });

    describe('three set', () => {
      beforeEach(() => {
        state._threeAction.time = 0.5;
        state._threeAction.getClip = jasmine
          .createSpy()
          .and.callFake(function() {
            return {duration: 1};
          });
      });

      it('should set the _threeAction time to the target time by multiplying clip duration', () => {
        state.normalizedTime = 1;

        expect(state._threeAction.time).toEqual(1);
      });

      it('should clamp the time into 0 and 1', () => {
        state.normalizedTime = 10;

        expect(state._threeAction.time).toEqual(1);
      });
    });
  });

  describe('timeScale', () => {
    it('should return a number', () => {
      expect(typeof state.timeScale).toEqual('number');
    });

    it('should set the _threeAction timeScale property to the input value', () => {
      expect(state._threeAction.timeScale).toEqual(1);

      state.timeScale = 2;

      expect(state._threeAction.timeScale).toEqual(2);
    });
  });

  describe('timeScalePending', () => {
    it('should return true if the timeScale promise has not been resolved, rejected or canceled', () => {
      state._promises.timeScale = new Deferred();

      expect(state.timeScalePending).toBeTrue();
    });

    it('should return false if the timeScale promise has been resolved', () => {
      state._promises.timeScale = new Deferred();

      expect(state.timeScalePending).toBeTrue();

      state._promises.timeScale.resolve();

      expect(state.timeScalePending).toBeFalse();
    });

    it('should return false if the timeScale promise has been rejected', () => {
      state._promises.timeScale = new Deferred();

      expect(state.timeScalePending).toBeTrue();

      state._promises.timeScale.reject();

      state._promises.timeScale.catch();

      expect(state.timeScalePending).toBeFalse();
    });

    it('should return false if the timeScale promise has been canceled', () => {
      state._promises.timeScale = new Deferred();

      expect(state.timeScalePending).toBeTrue();

      state._promises.timeScale.cancel();

      expect(state.timeScalePending).toBeFalse();
    });
  });

  describe('setTimeScale', () => {
    it('should return a deferred promise', () => {
      const interpolator = state.setTimeScale(0);

      expect(interpolator).toBeInstanceOf(Deferred);
    });

    it('should update the timeScale value when the promise is executed', () => {
      const interpolator = state.setTimeScale(0, 1);

      expect(state.timeScale).toEqual(1);

      interpolator.execute(250);

      expect(state.timeScale).toEqual(0.75);
    });

    it('should resolve once the timeScale reaches the target value', async () => {
      const interpolator = state.setTimeScale(0, 1);

      interpolator.execute(1000);

      await expectAsync(interpolator).toBeResolved();
    });
  });

  describe('loopCount', () => {
    it('should return a number', () => {
      expect(typeof state.loopCount).toEqual('number');
    });

    it('should set _threeAction.repetitions to the value of loopCount', () => {
      state.loopCount = 1;

      expect(state._threeAction.repetitions).toEqual(1);

      state.loopCount = 10;

      expect(state._threeAction.repetitions).toEqual(10);
    });

    it('should set _threeAction.loop to THREE.LoopRepeat if loopCount is greater than 1', () => {
      state.loopCount = 10;

      expect(state._threeAction.loop).toEqual(THREE.LoopRepeat);
    });

    it('should set _threeAction.loop to THREE.LoopOnce if loopCount equals 1', () => {
      state.loopCount = 1;

      expect(state._threeAction.loop).toEqual(THREE.LoopOnce);
    });
  });

  describe('blendMode', () => {
    it('should return a value from LayerBlendModes', () => {
      expect(Object.values(LayerBlendModes)).toContain(state.blendMode);
    });
  });

  describe('updateInternalWeight', () => {
    it('should execute setEffectiveWeight on _threeAction using _internalWeight', () => {
      state.weight = 1;
      state.updateInternalWeight(0.25);

      expect(state._threeAction.setEffectiveWeight).toHaveBeenCalledWith(
        state._internalWeight
      );
    });
  });

  describe('play', () => {
    it('should execute reset on _threeAction', () => {
      state.play();

      expect(state._threeAction.reset).toHaveBeenCalledTimes(1);
    });

    it('should execute play on _threeAction', () => {
      state.play();

      expect(state._threeAction.play).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause', () => {
    it('should set _threeAction.paused to true', () => {
      state._threeAction.paused = false;

      state.pause();

      expect(state._threeAction.paused).toBeTrue();
    });

    it('should execute play on _threeAction', () => {});
  });

  describe('resume', () => {
    it('should set _threeAction.paused to false', () => {
      state._threeAction.paused = true;

      state.resume();

      expect(state._threeAction.paused).toBeFalse();
    });

    it('should set _threeAction.enabled to true', () => {
      state._threeAction.enabled = false;

      state.resume();

      expect(state._threeAction.enabled).toBeTrue();
    });

    it('should execute play on _threeAction', () => {
      state.resume();

      expect(state._threeAction.play).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel', () => {
    it('should set _threeAction.paused to true', () => {
      state._threeAction.paused = false;

      state.cancel();

      expect(state._threeAction.paused).toBeTrue();
    });
  });

  describe('stop', () => {
    it('should execute reset on _threeAction', () => {
      state.stop();

      expect(state._threeAction.reset).toHaveBeenCalledTimes(1);
    });

    it('should set _threeAction.paused to true', () => {
      state._threeAction.paused = false;

      state.stop();

      expect(state._threeAction.paused).toBeTrue();
    });

    it('should execute play on _threeAction', () => {
      state.stop();

      expect(state._threeAction.play).toHaveBeenCalledTimes(1);
    });
  });

  describe('discard', () => {
    it("should stop listening to the mixer's finish event", () => {
      const onRemoveListener = spyOn(
        state._threeAction.getMixer(),
        'removeEventListener'
      );
      state.discard();

      expect(onRemoveListener).toHaveBeenCalledWith(
        'finished',
        state._onFinishedEvent
      );
    });

    it('should set enabled on _threeAction to false', () => {
      state._threeAction.enabled = true;

      state.discard();

      expect(state._threeAction.enabled).toBeFalse();
    });
  });
});
