// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-undef */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */

import describeHostEnvironment from '../../EnvironmentHarness';
import StateContainerInterface from '../../../../src/core/animpack/state/StateContainerInterface';

describeHostEnvironment('StateContainerMixin', () => {
  let state1;
  let state2;
  let state3;
  let testContainer;

  class TestContainerClass extends StateContainerInterface.Mixin() {}

  beforeEach(() => {
    state1 = {
      name: 'state1',
      discard: jasmine.createSpy('discard'),
    };
    state2 = {
      name: 'state2',
      discard: jasmine.createSpy('discard'),
    };
    state3 = {
      name: 'state2',
      discard: jasmine.createSpy('discard'),
    };

    testContainer = new TestContainerClass();
    testContainer.addState(state1);
    testContainer.addState(state2);
  });

  describe('getStateName', () => {
    it('should return an array of state names that the container controls', () => {
      const stateNames = testContainer.getStateNames();

      expect(stateNames.length).toEqual(2);
      expect(stateNames.includes('state1')).toBeTrue();
      expect(stateNames.includes('state2')).toBeTrue();
    });
  });

  describe('addState', () => {
    it('should execute a console warning if the state is already in the container', () => {
      const onWarn = spyOn(console, 'warn');
      testContainer.addState(state1);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should not add a new state if the state is already in the container', () => {
      const numStates = testContainer._states.size;
      testContainer.addState(state1);

      expect(testContainer._states.size).toEqual(numStates);
    });

    it('should execute a console warning if a state with the same name exists in the container', () => {
      const onWarn = spyOn(console, 'warn');
      testContainer.addState(state3);

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it("should increment a new state's name if a state with the same name exists in the container", () => {
      const currentName = state3.name;
      testContainer.addState(state3);

      expect(state3.name).toBeGreaterThan(currentName);
    });

    it('should store a new key in the _states map', () => {
      const numStates = testContainer._states.size;
      testContainer.addState(state3);

      expect(testContainer._states.size).toBeGreaterThan(numStates);
    });

    it('should return the name of the state', () => {
      const result = testContainer.addState(state3);

      expect(state3.name).toEqual(result);
    });
  });

  describe('removeState', () => {
    it('should execute a console warning if the state is not in the container', () => {
      const onWarn = spyOn(console, 'warn');
      testContainer.removeState('NonState');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should remove the state from the _states map', () => {
      testContainer.removeState('state1');

      expect(testContainer._states.has('state1')).toBeFalse();
    });
  });

  describe('renameState', () => {
    it('should throw an error if the state is not in the container', () => {
      expect(() => {
        testContainer.renameState('NotState', 'NewStateName');
      }).toThrowError();
    });

    it('should not change the name if newName is currentName', () => {
      const currentName = state1.name;

      expect(testContainer.renameState(state1.name, state1.name)).toEqual(
        currentName
      );
    });

    it('should execute a console warning if a state with the same newName exits in the container', () => {
      const onWarn = spyOn(console, 'warn');
      testContainer.renameState('state1', 'state2');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it("should increment a new state's name if a state with the same name exists in the container", () => {
      testContainer.renameState(state1.name, state2.name);

      expect(state1.name).toBeGreaterThan(state2.name);
    });

    it('should store the new state key and remove the old key', () => {
      const oldName = state1.name;
      const newName = 'newStateName';
      testContainer.renameState(oldName, newName);

      expect(testContainer._states.has(newName)).toBeTrue();
      expect(testContainer._states.has(oldName)).toBeFalse();
    });

    it('should not change the number of states in the container', () => {
      const numStates = testContainer._states.size;
      testContainer.renameState(state1.name, state2.name);

      expect(testContainer._states.size).toEqual(numStates);
    });

    it('should return the new name of the state', () => {
      const result = testContainer.renameState(state1.name, 'newStateName');

      expect(state1.name).toEqual(result);
    });
  });

  describe('discard', () => {
    it('should execute discard on all stored states', () => {
      testContainer.discardStates();

      expect(state1.discard).toHaveBeenCalledTimes(1);
      expect(state2.discard).toHaveBeenCalledTimes(1);
    });

    it('should remove all references to states', () => {
      expect(testContainer._states).toBeDefined();

      testContainer.discardStates();

      expect(testContainer._states).not.toBeDefined();
    });
  });
});
