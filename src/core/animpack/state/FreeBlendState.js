// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractBlendState from './AbstractBlendState';

/**
 * Class for blending N number of blend states.
 *
 * @extends AbstractBlendState
 */
class FreeBlendState extends AbstractBlendState {
  /**
   * @constructor
   *
   * @param {Object} [options={}] - Options for the container state.
   * @param {Array.<AbstractState>} [blendStates=[]] - Blend states to be controlled by
   * this container.
   */
  constructor(options = {}, blendStates = []) {
    super(options, blendStates);
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
}

export default FreeBlendState;
