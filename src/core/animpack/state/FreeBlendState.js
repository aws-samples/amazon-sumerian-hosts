// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractState from './AbstractState';
import AnimationUtils from '../AnimationUtils';
import Utils from '../../Utils';
import Deferred from '../../Deferred';

/**
 * Class for blending N number of blend states.
 *
 * @extends AbstractState
 */
class FreeBlendState extends AbstractState {
  /**
   * @constructor
   *
   * @param {Object} [options={}] - Options for the container state.
   * @param {Array.<AbstractState>} [blendStates=[]] - Blend states to be controlled by
   * this container.
   */
  constructor(options = {}, blendStates = []) {
    super(options);

    this._states = new Map();
    blendStates.forEach(state => {
      this.addState(state);
    });
  }

  /**
   * Gets an array of the names of all states the container controls.
   *
   * @readonly
   * @type {Array.<sring>}
   */
  get animations() {
    return [...this._states.keys()];
  }

  get internalWeight() {
    let blendWeights = 0;
    this._states.forEach(state => {
      blendWeights += state.internalWeight;
    });
    return blendWeights;
  }

  /**
   * Add a new state to be controlled by the container. States are stored by name
   * so the state's name must be unique to the layer, if it isn't the name will be
   * incremented until it is unique.
   *
   * @param {AbstractState} state - State to add to the contianer.
   *
   * @returns {string} - Unique name of the state.
   */
  addState(state) {
    // Make sure the state is not already in this container
    if ([...this._states.values()].includes(state)) {
      console.warn(
        `Cannot add animation to FreeBlendState ${this.name}. Animation was already added.`
      );
      return state.name;
    }

    // Make sure the state name is unique
    const uniqueName = Utils.getUniqueName(state.name, [
      ...this._states.keys(),
    ]);

    if (state.name !== uniqueName) {
      console.warn(
        `Animation name ${state.name} is not unique for FreeBlendState ${this.name}. New animation will be added with name ${uniqueName}.`
      );
      state.name = uniqueName;
    }

    this._states.set(state.name, state);

    return state.name;
  }

  /**
   * Removes a state with the given name from the container.
   *
   * @param {string} name - Name of the state to remove.
   *
   * @returns {boolean} - Whether or not a state was removed.
   */
  removeState(name) {
    // Check if the state is in this container
    if (!this._states.has(name)) {
      console.warn(
        `Did not remove animation ${name} from FreeBlendState ${this.name}. No animation exists with this name.`
      );
      return false;
    }

    this._states.get(name).discard();
    this._states.delete(name);
    return true;
  }

  /**
   * Renames a state with the given name in the container. Name must be unique
   * to the container, if it isn't the name will be incremented until it is unique.
   *
   * @param {string} currentName - Name of the state to rename.
   * @param {string} newName - Name to update the state with.
   *
   * @returns {string} - Updated name for the state.
   */
  renameState(currentName, newName) {
    // Make sure the state is in this container
    const state = this._states.get(currentName);
    if (state === undefined) {
      throw new Error(
        `Cannot rename animation ${currentName} in FreeBlendState ${this.name}. No animation exists with this name.`
      );
    }

    // Exit if the names are the same
    if (currentName === newName) {
      return currentName;
    }

    // Make sure the name is unique
    const uniqueName = Utils.getUniqueName(
      newName,
      [...this._states.keys()].filter(s => s.name !== currentName)
    );

    if (newName !== uniqueName) {
      console.warn(
        `Animation name ${newName} is not unique in FreeBlendState ${this.name}. Animation will be renamed to ${uniqueName}.`
      );
      newName = uniqueName;
    }

    state.name = newName;
    this._states.delete(currentName);
    this._states.set(state.name, state);

    return state.name;
  }

  /**
   * Returns the weight of a state controlled by the container.
   *
   * @param {string} name - Name of the state to return the weight from.
   *
   * @returns {number} - Weight of the state.
   */
  getBlendWeight(name) {
    // Make sure the name is valid
    const state = this._states.get(name);
    if (state === undefined) {
      throw new Error(
        `Cannot get weight of state ${name} from FreeBlendState ${this.name}. No state exists with this name.`
      );
    }

    return state.weight;
  }

  /**
   * Sets the weight of a state controlled by the container.
   *
   * @param {string} name - Name of the state to set the weight of.
   * @param {number} weight - Weight value to set on the state.
   *
   * @returns {Deferred}
   */
  setBlendWeight(name, weight, seconds = 0, easingFn) {
    // Make sure the name is valid
    const state = this._states.get(name);

    if (state === undefined) {
      throw new Error(
        `Cannot set weight of state ${name} from FreeBlendState ${this.name}. No state exists with this name.`
      );
    }

    weight = AnimationUtils.clamp(weight);
    return state.setWeight(weight, seconds, easingFn);
  }

  updateInternalWeight(factor) {
    super.updateInternalWeight(factor);

    // Determine the total active weight of blend states
    let sumWeights = 0;

    this._states.forEach(state => {
      sumWeights += state.weight;
    });

    // Ensure the sum of blend state internal weights does not exceed container internal weight
    factor /= Math.max(sumWeights, 1);

    // Sum of blend state internal weights should not exceed container internal weight
    this._states.forEach(state => {
      state.updateInternalWeight(factor * this._weight);
    });
  }

  update(deltaTime) {
    super.update(deltaTime);
    this._states.forEach(state => {
      state.update(deltaTime);
    });
  }

  play(onFinish, onError, onCancel) {
    const promises = [];
    promises.push(super.play());
    this._states.forEach(state => {
      promises.push(state.play());
    });
    return Deferred.all(promises, onFinish, onError, onCancel);
  }

  pause() {
    this._states.forEach(state => {
      state.pause();
    });
    return super.pause();
  }

  resume(onFinish, onError, onCancel) {
    const promises = [];
    promises.push(super.resume());
    this._states.forEach(state => {
      promises.push(state.resume());
    });
    return Deferred.all(promises, onFinish, onError, onCancel);
  }

  cancel() {
    this._states.forEach(state => {
      state.cancel();
    });
    return super.cancel();
  }

  stop() {
    this._states.forEach(state => {
      state.stop();
    });
    return super.stop();
  }

  discard() {
    super.discard();

    this._states.forEach(state => {
      state.discard();
    });
    delete this._states;
  }
}

export default FreeBlendState;
