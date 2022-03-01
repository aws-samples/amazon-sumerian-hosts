// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
import {anim} from '@amazon-sumerian-hosts/babylon';
import {Deferred, LayerBlendModes} from '@amazon-sumerian-hosts/core';
import describeEnvironment from '../../EnvironmentHarness';

describeEnvironment('SingleState', (options = {}) => {
  let state;
  let beginAnimationSpy;

  beforeEach(() => {

    const mockBabylonGroup = {
      from: 0,
      to: 2,
      targetedAnimations: [
        {
          target: {},
          animation: {},
        },
      ],
      normalize: jasmine.createSpy('normalize'),
    };
    beginAnimationSpy = spyOn(options.scene, 'beginDirectAnimation');
    beginAnimationSpy.and.callFake(
      (
        target,
        animations,
        from,
        to,
        loopAnimation,
        speedRatio,
        onAnimationEnd,
        onAnimationLoop,
        isAdditive
      ) => {
        return {
          weight: 1,
          speedRatio,
          to,
          from,
          loopAnimation,
          isAdditive,
          disposeOnEnd: true,
          stop: jasmine.createSpy('stop'),
          onAnimationEnd,
          onAnimationLoop,
        };
      }
    );
    state = new anim.SingleState(undefined, mockBabylonGroup, options.scene);
  });

  describe('normalizedTime', () => {
    describe('babylon get', () => {
      it('should return 0 if masterFrame does not exist in animatable', () => {
        expect(state.normalizedTime).toEqual(0);
      });

      it('should return percentage of master from between to and frame', () => {
        state._babylonAnimatables = [{masterFrame: 1}];

        expect(state.normalizedTime).toEqual(0.5);
      });
    });

    describe('babylon set', () => {
      beforeEach(() => {
        state._babylonAnimatables = [{goToFrame: jasmine.createSpy()}];
      });

      it('should set the babylon time to the target time by multiplying clip duration', () => {
        state.normalizedTime = 1;

        expect(state._babylonAnimatables[0].goToFrame).toHaveBeenCalledWith(2);
      });

      it('should clamp the time into 0 and 1', () => {
        state.normalizedTime = 10;

        expect(state._babylonAnimatables[0].goToFrame).toHaveBeenCalledWith(2);
      });
    });
  });

  describe('timeScale', () => {
    it('should return a number', () => {
      expect(typeof state.timeScale).toEqual('number');
    });

    it('should set the speedRatio property of every stored animatable to the input value', () => {
      state._babylonAnimatables = [{speedRatio: 1}, {speedRatio: 5}];

      expect(
        state._babylonAnimatables.every(a => a.speedRatio === 2)
      ).not.toBeTrue();

      state.timeScale = 2;

      expect(
        state._babylonAnimatables.every(a => a.speedRatio === 2)
      ).toBeTrue();
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

    it('should set the loopAnimation property of every stored animatable to true if loopCount is greater than 1', () => {
      state._babylonAnimatables = [
        {loopAnimation: false},
        {loopAnimation: false},
      ];
      state.loopCount = 1;

      expect(state._babylonAnimatables.every(a => a.loopAnimation)).toBeFalse();

      state.loopCount = 10;

      expect(state._babylonAnimatables.every(a => a.loopAnimation)).toBeTrue();
    });
  });

  describe('blendMode', () => {
    it('should return a value from LayerBlendModes', () => {
      expect(Object.values(LayerBlendModes)).toContain(state.blendMode);
    });
  });

  describe('updateInternalWeight', () => {
    it('should set the weight of all stored animatables to the _internalWeight value', () => {
      state._babylonAnimatables = [{weight: 1}, {weight: 1}];

      expect(
        state._babylonAnimatables.every(a => a.weight === 0.25)
      ).toBeFalse();

      state.weight = 1;
      state.updateInternalWeight(0.25);

      expect(
        state._babylonAnimatables.every(a => a.weight === 0.25)
      ).toBeTrue();
    });
  });

  describe('play', () => {
    it('should create a new array of animatables', () => {
      const currentAnimatables = [...state._babylonAnimatables];

      state.play();

      expect(state._babylonAnimatables).not.toEqual(currentAnimatables);
    });
  });

  describe('pause', () => {
    it('should set speedRatio property of all stored animatables to 0', () => {
      state._babylonAnimatables = [{speedRatio: 10}, {speedRatio: 10}];

      expect(
        state._babylonAnimatables.every(a => a.speedRatio === 0)
      ).toBeFalse();

      state.pause();

      expect(
        state._babylonAnimatables.every(a => a.speedRatio === 0)
      ).toBeTrue();
    });
  });

  describe('resume', () => {
    it('should set the speedRatio property of all animatables to the _timeScale value', () => {
      state._babylonAnimatables = [
        {speedRatio: 0, stop: jasmine.createSpy('stop')},
        {speedRatio: 0, stop: jasmine.createSpy('stop')},
      ];

      expect(
        state._babylonAnimatables.every(a => a.speedRatio === state.timeScale)
      ).not.toBeTrue();

      state.resume();

      expect(
        state._babylonAnimatables.every(a => a.speedRatio === state.timeScale)
      ).toBeTrue();
    });

    it("should create a new array of animatables if it hasn't been previously started", () => {
      const currentAnimatables = [...state._babylonAnimatables];
      state._started = true;
      state.resume();

      expect(state._babylonAnimatables).toEqual(currentAnimatables);

      state._started = false;
      state.resume();

      expect(state._babylonAnimatables).not.toEqual(currentAnimatables);
    });
  });

  describe('cancel', () => {
    it('should set speedRatio property of all stored animatables to 0', () => {
      state._babylonAnimatables = [{speedRatio: 10}, {speedRatio: 10}];

      expect(
        state._babylonAnimatables.every(a => a.speedRatio === 0)
      ).toBeFalse();

      state.cancel();

      expect(
        state._babylonAnimatables.every(a => a.speedRatio === 0)
      ).toBeTrue();
    });
  });

  describe('stop', () => {
    it('should create a new array of animatables', () => {
      const currentAnimatables = [...state._babylonAnimatables];

      state.stop();

      expect(state._babylonAnimatables).not.toEqual(currentAnimatables);
    });
  });

  describe('discard', () => {
    it('should stop all stored animatables', () => {
      const animatables = [
        {stop: jasmine.createSpy('stop')},
        {stop: jasmine.createSpy('stop')},
      ];
      state._babylonAnimatables = [...animatables];
      state.discard();

      animatables.forEach(animatable => {
        expect(animatable.stop).toHaveBeenCalledTimes(1);
      });
    });
  });
});
