// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractState from './AbstractState';
import AnimationUtils from '../AnimationUtils';
import Deferred from '../../Deferred';
import StateContainerInterface from './StateContainerInterface';

/**
 * Class for blending N number of blend states.
 *
 * @extends AbstractState
 * @implements StateContainerInterface
 */
class FreeBlendState extends StateContainerInterface.Mixin(AbstractState) {
  /**
   * @constructor
   *
   * @param {Object} [options={}] - Options for the container state.
   * @param {Array.<AbstractState>} [blendStates=[]] - Blend states to be controlled by
   * this container.
   */
  constructor(options = {}, blendStates = []) {
    super(options);

    blendStates.forEach(state => {
      this.addState(state);
    });
  }

  get internalWeight() {
    let blendWeights = 0;
    this._states.forEach(state => {
      blendWeights += state.internalWeight;
    });
    return blendWeights;
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
    const state = this.getState(name);
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
    const state = this.getState(name);

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
    this.discardStates();
  }
}

export default FreeBlendState;
