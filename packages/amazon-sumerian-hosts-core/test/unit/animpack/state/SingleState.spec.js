// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
import {Deferred, LayerBlendModes, SingleState} from '@amazon-sumerian-hosts/core';
import describeEnvironment from '../../EnvironmentHarness';

describeEnvironment('SingleState', () => {
  let state;

  beforeEach(() => {
    state = new SingleState();
  });

  describe('timeScale', () => {
    it('should return a number', () => {
      expect(typeof state.timeScale).toEqual('number');
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
  });

  describe('blendMode', () => {
    it('should return a value from LayerBlendModes', () => {
      expect(Object.values(LayerBlendModes)).toContain(state.blendMode);
    });
  });
});
