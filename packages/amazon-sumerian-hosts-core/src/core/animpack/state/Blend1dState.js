// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Deferred from '../../Deferred';
import AbstractBlendState from './AbstractBlendState';
import AnimationUtils from '../AnimationUtils';

/**
 * Class for blending N number of blend states based on a single
 * parameter.
 *
 * @extends AbstractBlendState
 */
class Blend1dState extends AbstractBlendState {
  /**
   * @constructor
   *
   * @param {Object} [options] - Options for the container state
   * @param {Array.<AbstractBlendState>} [blendStates=[]] - Blend states to be
   * controlled by this container.
   * @param {Array.<number>} [blendThresholds=[]] - Threshold values for activating
   * each blend state.
   * @param {Array.<boolean>} [phaseMatches=[]] - Booleans indicating whether or not
   * each blend state should be phase matched.
   */
  constructor(
    options = {},
    blendStates = [],
    blendThresholds = [],
    phaseMatches = []
  ) {
    super(options, blendStates);

    this._blendValue = 0;
    this._promises = {
      ...this._promises,
      blendValue: Deferred.resolve(),
    };

    // Validate there are no duplicate thresholds
    const nonZeroDifferentSize =
      blendStates.length !== 0 && blendStates.length !== blendThresholds.length;
    if (nonZeroDifferentSize) {
      throw new Error(
        `Cannot create Blend1dState with blendThresholds ${blendThresholds}. BlendThresholds count does not match blendStates count.`
      );
    }

    const containsDuplicates =
      new Set(blendThresholds).size !== blendThresholds.length;
    if (containsDuplicates) {
      throw new Error(
        `Cannot create Blend1dState with blendThresholds ${blendThresholds}. BlendThresholds contains duplicate values`
      );
    }

    // Initialize the thresholds map
    this._thresholds = [];
    [...this._states.values()].forEach((state, index) => {
      this._thresholds.push({
        value: blendThresholds[index],
        name: state.name,
        phaseMatch: phaseMatches[index] || false,
      });
    });

    this._sortThresholds();
    this._forceNoThresholdDupes = true;

    this._phaseLeadState = null;

    this._updateBlendWeights();
  }

  /**
   * Gets and sets the blend parameter value.
   */
  get blendValue() {
    return this._blendValue;
  }

  set blendValue(value) {
    this._blendValue = value;
  }

  /**
   * Gets whether or not the blend value is currently being animated.
   */
  get blendValuePending() {
    return this._promises.blendValue && this._promises.blendValue.pending;
  }

  /**
   * Updates the user defined weight over time.
   *
   * @param {null} name - Unused parameter.
   * @param {number} weight - The target weight value.
   * @param {number} [seconds=0] - The amount of time it will take to reach the
   * target weight.
   * @param {Function=} easingFn - The easing function to use for interpolation.
   *
   * @returns {Deferred}
   */
  setBlendWeight(name, value, seconds = 0, easingFn) {
    this._promises.blendValue.cancel();

    this._promises.blendValue = AnimationUtils.interpolateProperty(
      this,
      'blendValue',
      value,
      {
        seconds,
        easingFn,
        onProgress: () => {
          this._updateBlendWeights();
        },
        onFinish: () => {
          this._updateBlendWeights();
        },
      }
    );

    return this._promises.blendValue;
  }

  /**
   * Gets the user defined weight.
   *
   * @returns {number}
   */
  getBlendWeight() {
    return this.blendValue;
  }

  addState(state, thresholdValue = 0, phaseMatch = false) {
    this._thresholds = this._thresholds || [];

    // Make sure there is not already a state with this threshold
    const sameValue = this._thresholds.find(
      threshold => threshold.value === thresholdValue
    );
    if (this._forceNoThresholdDupes && sameValue !== undefined) {
      throw new Error(
        `Cannot set blend threshold of ${thresholdValue} for state ${state.name} on ${this.name}. A state already exists with that threshold.`
      );
    }

    super.addState(state);
    this._thresholds.push({
      value: thresholdValue,
      name: state.name,
      phaseMatch: phaseMatch || false,
    });

    this._sortThresholds();

    return state.name;
  }

  removeState(name) {
    const removed = super.removeState(name);

    if (removed) {
      const index = this._thresholds.findIndex(
        threshold => threshold.name === name
      );
      this._thresholds.splice(index, 1);
    }

    return removed;
  }

  renameState(currentName, newName) {
    newName = super.renameState(currentName, newName);

    const threshold = this._thresholds.find(
      threshold => threshold.name === currentName
    );
    threshold.name = newName;

    return newName;
  }

  /**
   * Gets the threshold value of a blend with the corresponding name.
   *
   * @param {string} name - Name of the blend to get the threshold of.
   *
   * @returns {number} Threhold value.
   */
  getBlendThreshold(name) {
    const threshold = this._thresholds.find(
      threshold => threshold.name === name
    );

    if (threshold === undefined) {
      throw new Error(
        `Cannot get blend threshold of state ${name} on ${this.name}. No state exists with that name.`
      );
    }

    return threshold.value;
  }

  /**
   * Sets the threshold value of a blend with the corresponding name.
   *
   * @param {string} name - Name of the blend to set the threshold.
   * @param {number} value - Value of the threshold to set.
   *
   * @returns {number} Set threshold value.
   */
  setBlendThreshold(name, value) {
    // Make sure there is not already a state with this threshold
    const sameValue = this._thresholds.find(
      threshold => threshold.value === value
    );
    if (sameValue !== undefined) {
      throw new Error(
        `Cannot set blend threshold of ${value} for state ${name} on ${this.name}. A state already exists with that threshold.`
      );
    }

    const threshold = this._thresholds.find(
      threshold => threshold.name === name
    );

    if (threshold === undefined) {
      throw new Error(
        `Cannot set blend threshold of state ${name} on ${this.name}. No state exists with that name.`
      );
    }

    threshold.value = value;

    this._sortThresholds();

    return threshold.value;
  }

  updateInternalWeight(factor) {
    super.updateInternalWeight(factor);

    if (this._phaseLeadState) {
      this._states.forEach(state => {
        if (state.weight !== 0) {
          state.normalizedTime = this._phaseLeadState.normalizedTime;
        }
      });
    }
  }

  /**
   * Updates the blend weights based on their corresponding threshold values
   * and the current blendValue. Additionally, sets a lead phase state if the
   * conditions for phase-matching have been satisfied.
   *
   * @private
   */
  _updateBlendWeights() {
    if (this._thresholds.length === 0) return;

    if (this._thresholds.length === 1) {
      const state = this._states.get(this._thresholds[0].name);
      state.setWeight(1);
      return;
    }

    // Initially set all sub-state weights to zero
    this._states.forEach(state => {
      state.setWeight(0);
    });

    this._phaseLeadState = null;

    // Find the first threshold that is greater than or equal to the parameter value
    let targetIndex = this._thresholds.findIndex(threshold => {
      return threshold.value >= this._blendValue;
    });

    if (targetIndex === 0 || targetIndex === -1) {
      // Give one state full influence
      targetIndex = targetIndex === -1 ? this._thresholds.length - 1 : 0;
      const state = this._states.get(this._thresholds[targetIndex].name);
      state.setWeight(1);
    } else {
      // Linear interpolate influence between two states
      const thresholdA = this._thresholds[targetIndex - 1];
      const thresholdB = this._thresholds[targetIndex];

      const factorB =
        (this.blendValue - thresholdA.value) /
        (thresholdB.value - thresholdA.value);
      const factorA = 1 - factorB;

      const stateA = this._states.get(thresholdA.name);
      const stateB = this._states.get(thresholdB.name);

      stateA.setWeight(factorA);
      stateB.setWeight(factorB);

      // Set phase-matching if needed
      if (thresholdA.phaseMatch && thresholdB.phaseMatch) {
        this._phaseLeadState = factorA > factorB ? stateA : stateB;
      }
    }
  }

  /**
   * Sorts the thresholds from low to high based on value.
   *
   * @private
   */
  _sortThresholds() {
    this._thresholds.sort((a, b) => a.value - b.value);
  }
}

export default Blend1dState;
