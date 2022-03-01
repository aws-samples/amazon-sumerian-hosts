// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-underscore-dangle */
/* eslint-disable jasmine/no-spec-dupes */
import {Deferred, QueueState} from '@amazon-sumerian-hosts/core';

describe('QueueState', () => {
  let queueState;
  let state1;
  let state2;
  let state3;

  beforeEach(() => {
    state1 = {
      name: 'state1',
      weight: 1,
      loopCount: 1,
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
      weight: 1,
      loopCount: Infinity,
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
      name: 'state3',
      weight: 1,
      loopCount: 2,
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
    queueState = new QueueState({}, [state1, state2, state3]);
  });

  describe('_reset', () => {
    it('should set _done to false if there are stored states', () => {
      queueState._done = true;
      queueState._reset();

      expect(queueState._done).toBeFalse();
    });

    it('should set _done to true if there are no stored states', () => {
      queueState._done = false;
      queueState._states = new Map();
      queueState._reset();

      expect(queueState._done).toBeTrue();
    });

    it('should return the name of the first stored state if there are stored states', () => {
      expect(queueState._reset()).toEqual('state1');
    });

    it('should return null if there are no stored states', () => {
      queueState._states = new Map();

      expect(queueState._reset()).toEqual(null);
    });
  });

  describe('updateInternalWeight', () => {
    it('should execute updateInternalWeight with _internalWeight on the current state if there is one', () => {
      queueState._currentState = state1;
      queueState.updateInternalWeight(1);

      expect(state1.updateInternalWeight).toHaveBeenCalledWith(
        queueState._internalWeight
      );
    });

    it('should not throw an error if there is no current state', () => {
      queueState._currentState = null;

      expect(() => {
        queueState.updateInternalWeight(1);
      }).not.toThrowError();
    });
  });

  describe('next', () => {
    it('should return a Deferred promise', () => {
      expect(queueState.next()).toBeInstanceOf(Deferred);
    });

    it('should advance _queue by calling its next method', () => {
      const onNext = spyOn(queueState._queue, 'next');
      onNext.and.callFake(() => {
        return {value: 'state1', done: false};
      });
      queueState.next();

      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should set the value of _done to the done result of _queue.next', () => {
      queueState._done = false;
      const onNext = spyOn(queueState._queue, 'next');
      onNext.and.callFake(() => {
        return {value: undefined, done: true};
      });
      queueState.next();

      expect(queueState._done).toBeTrue();
    });

    it('should resolve and return the finish promise if _done gets updated to true and the wrap input parameter is false', () => {
      queueState._promises.finish = new Deferred();
      const onNext = spyOn(queueState._queue, 'next');
      onNext.and.callFake(() => {
        return {value: undefined, done: true};
      });
      const result = queueState.next(undefined, false);

      expect(result).toEqual(queueState._promises.finish);
      return expectAsync(result).toBeResolved();
    });

    it('should execute play if _done gets updated to true and the wrap input parameter is true', () => {
      const onPlay = spyOn(queueState, 'play');
      const onNext = spyOn(queueState._queue, 'next');
      onNext.and.callFake(() => {
        return {value: undefined, done: true};
      });
      queueState.next(() => {}, true);

      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it("should execute the onNext input function with {name: name of next state in the queue, canAdvance: true if next state's loopCount is less than Infinity and not the last state in the queue, isQueueEnd: true if it's the last state in the queue} if _done gets updated to false", () => {
      const onNext = jasmine.createSpy('onNext');
      queueState.next(onNext);

      expect(onNext).toHaveBeenCalledWith({
        name: 'state1',
        canAdvance: true,
        isQueueEnd: false,
      });

      queueState.next(onNext);

      expect(onNext).toHaveBeenCalledWith({
        name: 'state2',
        canAdvance: false,
        isQueueEnd: false,
      });

      queueState.next(onNext);

      expect(onNext).toHaveBeenCalledWith({
        name: 'state3',
        canAdvance: false,
        isQueueEnd: true,
      });
    });

    it('should execute playAnimation if done is updated to false', () => {
      const onPlay = spyOn(queueState, 'playAnimation');
      queueState.next();

      expect(onPlay).toHaveBeenCalledTimes(1);
    });
  });

  describe('play', () => {
    it('should return a Deferred promise', () => {
      expect(queueState.play()).toBeInstanceOf(Deferred);
    });

    it('should advance _queue by calling _reset', () => {
      const onReset = spyOn(queueState, '_reset');
      onReset.and.callFake(() => {
        queueState._done = false;
        return 'state1';
      });
      queueState.play();

      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should resolve and return the finish promise if _done gets updated to true', () => {
      state1.play = jasmine.createSpy().and.callFake(onFinished => {
        return onFinished();
      });
      queueState._promises.finish = new Deferred();
      spyOn(Object.getPrototypeOf(queueState._queue), 'next').and.callFake(() => {
        return {value: undefined, done: true};
      });
      const result = queueState.play();

      expect(result).toEqual(queueState._promises.finish);
      return expectAsync(result).toBeResolved();
    });

    it("should execute the onNext input function with {name: name of first state in the queue, canAdvance: true if first state's loopCount not Infinity and not the last state in the queue, isQueueEnd: true if it's the last state in the queue} if _done gets updated to false", () => {
      const onNext = jasmine.createSpy('onNext');
      queueState.play(undefined, undefined, undefined, onNext);

      expect(onNext).toHaveBeenCalledWith({
        name: 'state1',
        canAdvance: true,
        isQueueEnd: false,
      });

      queueState.next();
      queueState.play(undefined, undefined, undefined, onNext);

      expect(onNext).toHaveBeenCalledWith({
        name: 'state1',
        canAdvance: true,
        isQueueEnd: false,
      });
    });

    it('should execute playAnimation if done is updated to false', () => {
      const onPlay = spyOn(queueState, 'playAnimation');
      queueState.next();

      expect(onPlay).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause', () => {
    it('should execute pauseAnimation', () => {
      const onPause = spyOn(queueState, 'pauseAnimation');
      queueState.pause();

      expect(onPause).toHaveBeenCalledTimes(1);
    });
  });

  describe('resume', () => {
    it('should return a Deferred promise', () => {
      expect(queueState.resume()).toBeInstanceOf(Deferred);
    });

    it('should execute play if _done is true', () => {
      queueState._done = true;
      const onPlay = spyOn(queueState, 'play');
      queueState.resume();

      expect(onPlay).toHaveBeenCalledTimes(1);
    });

    it('should execute resumeAnimation if _done is false', () => {
      queueState._done = false;
      queueState._currentState = state1;
      const onResume = spyOn(queueState, 'resumeAnimation');
      queueState.resume();

      expect(onResume).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel', () => {
    it('should execute cancel on the current state if there is one', () => {
      queueState._currentState = state1;
      queueState.cancel();

      expect(state1.cancel).toHaveBeenCalledTimes(1);
    });

    it('should not throw an error if there is no current state', () => {
      queueState._currentState = null;

      expect(() => {
        queueState.cancel();
      }).not.toThrowError();
    });
  });

  describe('stop', () => {
    it('should execute stopAnimation', () => {
      const onStop = spyOn(queueState, 'stopAnimation');
      queueState.stop();

      expect(onStop).toHaveBeenCalledTimes(1);
    });
  });
});
