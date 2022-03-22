// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-underscore-dangle */
import Deferred from '../../Deferred';
import MathUtils from '../../MathUtils';
import AbstractBlendState from './AbstractBlendState';
import AnimationUtils from '../AnimationUtils';

/**
 * Class for blending N number of blend states based on two
 * paramters.
 *
 * @extends AbstractBlendState
 */
class Blend2dState extends AbstractBlendState {
  /**
   * @constructor
   *
   * @param {Object} [options] - Options for the container state
   * @param {Array.<AbstractBlendState>} [blendStates=[]] - Blend states to be
   * controlled by this container.
   * @param {Array.<Array.<number>>} [blendThresholds=[]] - Threshold values for activating
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

    if (blendStates.length !== blendThresholds.length) {
      throw new Error(
        `Cannot create Blend2dState with blendStates ${blendStates} and blendThresholds ${blendThresholds}. Count of blendStates must match count of blendThresholds.`
      );
    }

    blendThresholds
      .slice(0, blendThresholds.length - 1)
      .forEach((threshold, index) => {
        blendThresholds.slice(index + 1).forEach(otherThreshold => {
          if (
            threshold[0] === otherThreshold[0] &&
            threshold[1] === otherThreshold[1]
          ) {
            throw new Error(
              `Cannot create Blend2dState with blendThresholds ${blendThresholds}. No duplicate values allowed in blendThresholds.`
            );
          }
        });
      });

    this._blendValueX = 0;
    this._blendValueY = 0;

    this._promises = {
      ...this._promises,
      blendValueX: Deferred.resolve(),
      blendValueY: Deferred.resolve(),
    };

    this._thresholds = [];
    [...this._states.values()].forEach((state, index) => {
      this._thresholds.push({
        name: state.name,
        phaseMatch: phaseMatches[index] || false,
      });
    });

    this._vertices = blendThresholds;

    if (this._vertices.length >= 3) {
      this._triangles = MathUtils.getDelaunayTriangulation(this._vertices);
    }

    this._phaseLeadState = null;

    this._updateBlendWeights();
  }

  /**
   * Updates the user defined weight over time.
   *
   * @param {string} name - Name of blend weight to update.
   * @param {number} weight - Target weight value.
   * @param {number} [seconds=0] - The amount of time it will take to reach the
   * target value.
   * @param {Function=} easingFn - The easing function to use for interpolation.
   *
   * @returns {Deferred}
   */
  setBlendWeight(name, value, seconds = 0, easingFn) {
    const property = `blendValue${name.toUpperCase()}`;
    if (property !== 'blendValueX' && property !== 'blendValueY') {
      throw new Error(
        `Cannot set blend weight for ${name} on ${this.name}. Blend2dState only accepts 'X' or 'Y' for setBlendWeight`
      );
    }

    this._promises[property].cancel();

    this._promises[property] = AnimationUtils.interpolateProperty(
      this,
      property,
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

    return this._promises[property];
  }

  /**
   * Gets the user defined weight.
   *
   * @param {string} name - Name of blend weight.
   *
   * @returns {number}
   */
  getBlendWeight(name) {
    const property = name.toUpperCase();
    if (property !== 'X' && property !== 'Y') {
      throw new Error(
        `Cannot get blend weight for ${name} on ${this.name}. Blend2dState only accepts 'X' or 'Y' for getBlendWeight`
      );
    }

    return property === 'X' ? this._blendValueX : this._blendValueY;
  }

  /**
   * Gets and sets the x blend weight.
   */
  get blendValueX() {
    return this._blendValueX;
  }

  set blendValueX(value) {
    this._blendValueX = value;
  }

  /**
   * Gets and sets the y blend weight.
   */
  get blendValueY() {
    return this._blendValueY;
  }

  set blendValueY(value) {
    this._blendValueY = value;
  }

  /**
   * Gets whether or not the x blend value is currently being animated.
   */
  get blendValueXPending() {
    return this._promises.blendValueX && this._promises.blendValueX.pending;
  }

  /**
   * Gets whether or not the y blend value is currently being animated.
   */
  get blendValueYPending() {
    return this._promises.blendValueY && this._promises.blendValueY.pending;
  }

  updateInternalWeight(factor) {
    super.updateInternalWeight(factor);

    if (this._phaseLeadState) {
      [...this._states.values()].forEach((state, index) => {
        if (state.weight !== 0 && this._thresholds[index].phaseMatch) {
          state.normalizedTime = this._phaseLeadState.normalizedTime;
        }
      });
    }
  }

  /**
   * Updates the blend weights based on their corresponding threshold values
   * and the current [x,y] blendValue. Additionally, sets a lead phase state if the
   * conditions for phase-matching have been satisfied.
   *
   * @private
   */
  _updateBlendWeights() {
    if (!this._vertices || this._vertices.length === 0) return;

    if (this._vertices.length === 1) {
      [...this._states.values()][0].weight = 1;
      return;
    }

    // Initially set all sub-state weights to zero
    this._states.forEach(state => {
      state.setWeight(0);
    });
    this._phaseLeadState = null;

    const p = [this._blendValueX, this._blendValueY];

    if (this._vertices.length === 2) {
      this._setInfluenceClosestPointOnLine(p);
    } else {
      const triangle = this._triangles.find(triangle => {
        return MathUtils.isPointInTriangle(
          this._vertices[triangle[0]],
          this._vertices[triangle[1]],
          this._vertices[triangle[2]],
          p
        );
      });

      if (triangle) {
        this._setInfluenceTriangle(triangle, p);
      } else {
        this._setInfluenceClosestPointInTriangles(p);
      }
    }
  }

  /**
   * Sets blend weights for states corresponding to a
   * triangle of thresholds and a given [x,y] blendValues.
   *
   * @param {Array.<Array.<number>>} triangle - Set of triangluated indices
   * that correspond to blend thresholds.
   * @param {Array.<number>} p - Given [x,y] blendValue.
   *
   * @private
   */
  _setInfluenceTriangle(triangle, p) {
    const areaA = MathUtils.triangleArea(
      this._vertices[triangle[1]],
      this._vertices[triangle[2]],
      p
    );

    const areaB = MathUtils.triangleArea(
      this._vertices[triangle[0]],
      this._vertices[triangle[2]],
      p
    );

    const areaC = MathUtils.triangleArea(
      this._vertices[triangle[0]],
      this._vertices[triangle[1]],
      p
    );

    const totalArea = areaA + areaB + areaC;

    const weightA = areaA / totalArea;
    const weightB = areaB / totalArea;
    const weightC = areaC / totalArea;

    const thresholdA = this._thresholds[triangle[0]];
    const thresholdB = this._thresholds[triangle[1]];
    const thresholdC = this._thresholds[triangle[2]];

    const stateA = this._states.get(thresholdA.name);
    const stateB = this._states.get(thresholdB.name);
    const stateC = this._states.get(thresholdC.name);

    stateA.setWeight(weightA);
    stateB.setWeight(weightB);
    stateC.setWeight(weightC);

    this._setPhaseLeadState(
      [stateA, stateB, stateC],
      [thresholdA.phaseMatch, thresholdB.phaseMatch, thresholdC.phaseMatch]
    );
  }

  /**
   * Determines the closest point within a triangle of
   * thresholds based on the current [x,y] blendValues and
   * then sets blend weights for the corresponding states.
   *
   * @param {Array.<number>} p - Given [x,y] blendValue.
   *
   * @private
   */
  _setInfluenceClosestPointInTriangles(p) {
    let globalClosestPoint = null;
    let globalMinDist = Number.POSITIVE_INFINITY;
    let closestTriangle = -1;

    this._triangles.forEach((triangle, index) => {
      const pointA = MathUtils.closestPointOnLine(
        this._vertices[triangle[0]],
        this._vertices[triangle[1]],
        p
      );
      const pointB = MathUtils.closestPointOnLine(
        this._vertices[triangle[1]],
        this._vertices[triangle[2]],
        p
      );
      const pointC = MathUtils.closestPointOnLine(
        this._vertices[triangle[2]],
        this._vertices[triangle[0]],
        p
      );

      const distA = MathUtils.distanceSquared(pointA, p);
      const distB = MathUtils.distanceSquared(pointB, p);
      const distC = MathUtils.distanceSquared(pointC, p);

      let localClosestPoint = pointC;
      let localMinDist = distC;

      if (distA < localMinDist) {
        localClosestPoint = pointA;
        localMinDist = distA;
      }
      if (distB < localMinDist) {
        localClosestPoint = pointB;
        localMinDist = distB;
      }

      if (localMinDist < globalMinDist) {
        globalMinDist = localMinDist;
        globalClosestPoint = [...localClosestPoint];
        closestTriangle = index;
      }
    });

    this._setInfluenceTriangle(
      this._triangles[closestTriangle],
      globalClosestPoint
    );
  }

  /**
   * Determines the closest point on the line formed between the
   * two blend thresholds based on the current [x,y] blendValues and
   * then sets blend weights for the corresponding states.
   *
   * @param {Array.<number>} p - Given [x,y] blendValue.
   *
   * @private
   */
  _setInfluenceClosestPointOnLine(p) {
    const closestPoint = MathUtils.closestPointOnLine(
      this._vertices[[0]],
      this._vertices[[1]],
      p
    );

    const distA = MathUtils.distanceSquared(this._vertices[0], closestPoint);
    const distB = MathUtils.distanceSquared(this._vertices[1], closestPoint);

    const weightA = distB / (distA + distB);
    const weightB = distA / (distA + distB);

    const thresholdA = this._thresholds[0];
    const thresholdB = this._thresholds[1];

    const stateA = this._states.get(thresholdA.name);
    const stateB = this._states.get(thresholdB.name);

    stateA.setWeight(weightA);
    stateB.setWeight(weightB);

    this._setPhaseLeadState(
      [stateA, stateB],
      [thresholdA.phaseMatch, thresholdB.phaseMatch]
    );
  }

  /**
   * Sets a lead phase state if the conditions
   * for phase-matching are satisfied.
   *
   * @param {Array.<AbstractBlendState>} states - States to
   * check phase-matching criteria.
   * @param {Array.<boolean>} phaseMatched - List of phase-match booleans.
   *
   * @private
   */
  _setPhaseLeadState(states, phaseMatched) {
    let max = 0;
    states.forEach((state, index) => {
      if (phaseMatched[index] && state.weight > max) {
        this._phaseLeadState = state;
        max = state.weight;
      }
    });
  }
}

export default Blend2dState;
