// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
import Deferred from 'core/Deferred';
import AbstractBlendState from 'core/animpack/state/AbstractBlendState';
import describeHostEnvironment from '../../EnvironmentHarness';

describeHostEnvironment('AbstractBlendState', () => {
  let blend;
  let state1;
  let state2;
  let state3;

  beforeEach(() => {
    state1 = {
      name: 'state1',
      weight: 1,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      resume: jasmine.createSpy('resume'),
      cancel: jasmine.createSpy('cancel'),
      stop: jasmine.createSpy('stop'),
      update: jasmine.createSpy('update'),
      discard: jasmine.createSpy('discard'),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
    state1.setWeight.and.callFake(weight => {
      state1.weight = weight;
    });
    state2 = {
      name: 'state2',
      weight: 0,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      resume: jasmine.createSpy('resume'),
      cancel: jasmine.createSpy('cancel'),
      stop: jasmine.createSpy('stop'),
      update: jasmine.createSpy('update'),
      discard: jasmine.createSpy('discard'),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
    state2.setWeight.and.callFake(weight => {
      state2.weight = weight;
    });
    state3 = {
      name: 'state2',
      weight: 0.5,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      play: jasmine.createSpy('play'),
      pause: jasmine.createSpy('pause'),
      resume: jasmine.createSpy('resume'),
      cancel: jasmine.createSpy('cancel'),
      stop: jasmine.createSpy('stop'),
      update: jasmine.createSpy('update'),
      discard: jasmine.createSpy('discard'),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      _promises: {weight: new Deferred(), play: new Deferred()},
    };
    state3.setWeight.and.callFake(weight => {
      state3.weight = weight;
    });

    blend = new AbstractBlendState({}, [state1, state2]);
  });

  describe('getBlendWeight', () => {
    it('should throw an error when the state is not in the container', () => {
      expect(() => {
        blend.getBlendWeight('NotState');
      }).toThrowError();
    });

    it('should get the weight for the state', () => {
      const weight = 0.52;
      state1.weight = weight;

      expect(blend.getBlendWeight('state1')).toEqual(weight);
    });
  });

  describe('setBlendWeight', () => {
    it('should throw an error when the state is not in the container', () => {
      expect(() => {
        blend.setBlendWeight('NotState');
      }).toThrowError();
    });

    it('should set the state weight to the target weight', async () => {
      const weight = 0.52;

      expect(state1.weight).not.toEqual(weight);

      await blend.setBlendWeight(state1.name, weight);

      expect(state1.weight).toEqual(weight);
    });

    it('should clamp state weights between 0 and 1', async () => {
      await blend.setBlendWeight('state1', -10);

      expect(blend.getBlendWeight('state1')).toEqual(0);
      await blend.setBlendWeight('state1', 10);

      expect(blend.getBlendWeight('state1')).toEqual(1);
    });
  });

  describe('updateInternalWeight', () => {
    it('should call updateInternalWeight on all blend states', () => {
      blend.updateInternalWeight(1);

      blend._states.forEach(state => {
        expect(state.updateInternalWeight).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('update', () => {
    it('should call update on all blend states', () => {
      blend.update(1);

      blend._states.forEach(state => {
        expect(state.update).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('play', () => {
    it('should play all blend states', () => {
      blend.play();

      blend._states.forEach(state => {
        expect(state.play).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('pause', () => {
    it('should pause all blend states', () => {
      blend.pause();

      blend._states.forEach(state => {
        expect(state.pause).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('resume', () => {
    it('should resume all blend states', () => {
      blend.resume();

      blend._states.forEach(state => {
        expect(state.resume).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('stop', () => {
    it('should stop all blend states', () => {
      blend.stop();

      blend._states.forEach(state => {
        expect(state.stop).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('cancel', () => {
    it('should cancel all blend states', () => {
      blend.cancel();

      blend._states.forEach(state => {
        expect(state.cancel).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('discard', () => {
    it('should discard all blend states', () => {
      const states = blend._states;

      blend.discard();

      states.forEach(state => {
        expect(state.discard).toHaveBeenCalledTimes(1);
      });

      expect(blend._states).not.toBeDefined();
    });
  });
});
