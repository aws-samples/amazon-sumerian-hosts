// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
import SingleState from 'app/animpack/state/SingleState';
import {LayerBlendModes} from 'core/animpack/AnimationLayer';
import Deferred from 'core/Deferred';
import describeEnvironment from '../../EnvironmentHarness';

describeEnvironment('SingleState', (options = {}, env) => {
  let state;
  let beginAnimationSpy;

  beforeEach(() => {
    let mockBabylonGroup;
    let mockThreeAction;
    let mockThreeMixer;

    switch (env) {
      case 'babylon':
        mockBabylonGroup = {
          from: 0,
          to: 2,
          targetedAnimations: [
            {
              target: {},
              animation: {},
            },
          ],
          normalize: jasmine.createSpy('normalize')
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
        state = new SingleState(undefined, mockBabylonGroup, options.scene);
        break;
      case 'three':
        mockThreeMixer = new THREE.EventDispatcher();
        mockThreeAction = {
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
        break;
      case 'core':
      default:
        state = new SingleState();
    }
  });

  describe('normalizedTime', () => {
    switch (env) {
      case 'babylon':
        describe('babylon get', () => {
          it('should return 0 if masterFrame does not exist in animatable', () => {
            expect(state.normalizedTime).toEqual(0);
          });

          it('should return percentage of master from between to and frame', () => {
            state._babylonAnimatables = [{masterFrame: 1}];

            expect(state.normalizedTime).toEqual(0.5);
          });
        })
        describe('babylon set', () => {
          beforeEach(() => {
            state._babylonAnimatables = [{goToFrame: jasmine.createSpy()}];
          });

          it('should set the _threeAction time to the target time by multiplying clip duration', () => {
            state.normalizedTime = 1;

            expect(state._babylonAnimatables[0].goToFrame).toHaveBeenCalledWith(2);
          });

          it('should clamp the time into 0 and 1', () => {
            state.normalizedTime = 10;

            expect(state._babylonAnimatables[0].goToFrame).toHaveBeenCalledWith(2);
          });
        })
        break;
      case 'three':
        describe('three get', () => {
          it('should return 0 if time does not exist in threeAction', () => {
            expect(state.normalizedTime).toEqual(0);
          });

          it('should return time divided by clip duration', () => {
            state._threeAction.time = 0.5;
            state._threeAction.getClip = jasmine.createSpy().and.callFake(function() { return {duration: 1} });

            expect(state.normalizedTime).toEqual(0.5);
          });
        })
        describe('three set', () => {
          beforeEach(() => {
            state._threeAction.time = 0.5;
            state._threeAction.getClip = jasmine.createSpy().and.callFake(function() { return {duration: 1} });
          });

          it('should set the _threeAction time to the target time by multiplying clip duration', () => {
            state.normalizedTime = 1;

            expect(state._threeAction.time).toEqual(1);
          });

          it('should clamp the time into 0 and 1', () => {
            state.normalizedTime = 10;

            expect(state._threeAction.time).toEqual(1);
          });
        })
        break;
      case 'core':
      default:
        break;
    }
  });

  describe('timeScale', () => {
    it('should return a number', () => {
      expect(typeof state.timeScale).toEqual('number');
    });

    switch (env) {
      case 'babylon':
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
        break;
      case 'three':
        it('should set the _threeAction timeScale property to the input value', () => {
          expect(state._threeAction.timeScale).toEqual(1);

          state.timeScale = 2;

          expect(state._threeAction.timeScale).toEqual(2);
        });
        break;
      case 'core':
      default:
        break;
    }
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

      state._promises.timeScale.catch(e => {});

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

    switch (env) {
      case 'babylon':
        it('should set the loopAnimation property of every stored animatable to true if loopCount is greater than 1', () => {
          state._babylonAnimatables = [
            {loopAnimation: false},
            {loopAnimation: false},
          ];
          state.loopCount = 1;

          expect(
            state._babylonAnimatables.every(a => a.loopAnimation)
          ).toBeFalse();

          state.loopCount = 10;

          expect(
            state._babylonAnimatables.every(a => a.loopAnimation)
          ).toBeTrue();
        });
        break;
      case 'three':
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
        break;
      case 'core':
      default:
        break;
    }
  });

  describe('blendMode', () => {
    it('should return a value from LayerBlendModes', () => {
      expect(Object.values(LayerBlendModes)).toContain(state.blendMode);
    });
  });

  describe('updateInternalWeight', () => {
    switch (env) {
      case 'babylon':
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
        break;
      case 'three':
        it('should execute setEffectiveWeight on _threeAction using _internalWeight', () => {
          state.weight = 1;
          state.updateInternalWeight(0.25);

          expect(state._threeAction.setEffectiveWeight).toHaveBeenCalledWith(
            state._internalWeight
          );
        });
        break;
      case 'core':
      default:
        break;
    }
  });

  describe('play', () => {
    switch (env) {
      case 'babylon':
        it('should create a new array of animatables', () => {
          const currentAnimatables = [...state._babylonAnimatables];

          state.play();

          expect(state._babylonAnimatables).not.toEqual(currentAnimatables);
        });
        break;
      case 'three':
        it('should execute reset on _threeAction', () => {
          state.play();

          expect(state._threeAction.reset).toHaveBeenCalledTimes(1);
        });
        it('should execute play on _threeAction', () => {
          state.play();

          expect(state._threeAction.play).toHaveBeenCalledTimes(1);
        });
        break;
      case 'core':
      default:
        break;
    }
  });

  describe('pause', () => {
    switch (env) {
      case 'babylon':
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
        break;
      case 'three':
        it('should set _threeAction.paused to true', () => {
          state._threeAction.paused = false;

          state.pause();

          expect(state._threeAction.paused).toBeTrue();
        });
        it('should execute play on _threeAction', () => {});
        break;
      case 'core':
      default:
        break;
    }
  });

  describe('resume', () => {
    switch (env) {
      case 'babylon':
        it('should set the speedRatio property of all animatables to the _timeScale value', () => {
          state._babylonAnimatables = [
            {speedRatio: 0, stop: jasmine.createSpy('stop')},
            {speedRatio: 0, stop: jasmine.createSpy('stop')},
          ];

          expect(
            state._babylonAnimatables.every(
              a => a.speedRatio === state.timeScale
            )
          ).not.toBeTrue();

          state.resume();

          expect(
            state._babylonAnimatables.every(
              a => a.speedRatio === state.timeScale
            )
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
        break;
      case 'three':
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
        break;
      case 'core':
      default:
        break;
    }
  });

  describe('cancel', () => {
    switch (env) {
      case 'babylon':
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
        break;
      case 'three':
        it('should set _threeAction.paused to true', () => {
          state._threeAction.paused = false;

          state.cancel();

          expect(state._threeAction.paused).toBeTrue();
        });
        break;
      case 'core':
      default:
        break;
    }
  });

  describe('stop', () => {
    switch (env) {
      case 'babylon':
        it('should create a new array of animatables', () => {
          const currentAnimatables = [...state._babylonAnimatables];

          state.stop();

          expect(state._babylonAnimatables).not.toEqual(currentAnimatables);
        });
        break;
      case 'three':
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
        break;
      case 'core':
      default:
        break;
    }
  });

  describe('discard', () => {
    switch (env) {
      case 'babylon':
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
        break;
      case 'three':
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
        break;
      case 'core':
      default:
        break;
    }
  });
});
