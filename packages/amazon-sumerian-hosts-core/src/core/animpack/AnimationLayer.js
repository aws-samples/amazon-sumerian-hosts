// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractBlendState from './state/AbstractBlendState';
import AnimationPlayerInterface from './AnimationPlayerInterface';
import AnimationUtils from './AnimationUtils';
import MathUtils from '../MathUtils';
import Deferred from '../Deferred';
import StateContainerInterface from './state/StateContainerInterface';

/**
 * Enum for types of {@link AnimationLayer} blending.
 *
 * @readonly
 * @enum {string}
 */
export const LayerBlendModes = {Override: 'Override', Additive: 'Additive'};

/**
 * The default blending mode {@link AnimationLayer}.
 *
 * @readonly
 * @type {string}
 */
export const DefaultLayerBlendMode = 'Override';

/**
 * Checks if a given blendMode is present in the values of {@link LayerBlendModes}.
 * If it is, return the original value, otherwise return {@link DefaultLayerBlendMode}.
 *
 * @param {string} blendMode - The name of the type of blending.
 *
 * @returns {(string|DefaultLayerBlendMode)}
 */
export function validateBlendMode(blendMode) {
  if (Array.from(Object.values(LayerBlendModes)).includes(blendMode)) {
    return blendMode;
  } else {
    return DefaultLayerBlendMode;
  }
}

/**
 * Class for managing a set of animations where only one state can be active at
 * any given time.
 *
 * @implements AnimationPlayerInterface
 * @implements StateContainerInterface
 */
class AnimationLayer extends AnimationPlayerInterface.Mixin(
  StateContainerInterface.Mixin()
) {
  /**
   * @constructor
   *
   * @param {Object=} options -  Options for the animation layer.
   * @param {string} options.name - Name of the layer. Names must be unique to the
   * animation feature that contains the layer.
   * @param {LayerBlendModes} [options.blendMode=DefaultLayerBlendMode] -
   * Type of blending to use for all states controlled by the layer.
   * @param {number} [options.weight=1] - The amount of influence the layer's current
   * animation has over the result for the host.
   * @param {number} [options.transitionTime=0] - The default amount of time to use when
   * playing and resuming animations.
   * @param {Function=} options.easingFn - The default easing function to use when
   * transitioning between animations and setting layer weight.
   */
  constructor(options = {}) {
    super(options);

    this.name = options.name === undefined ? 'AnimationLayer' : options.name;
    this._blendMode = Array.from(Object.values(LayerBlendModes)).includes(
      options.blendMode
    )
      ? options.blendMode
      : DefaultLayerBlendMode;
    this._promises = {
      weight: Deferred.resolve(),
    };
    this._weightPaused = false;

    this.weight = typeof options.weight === 'number' ? options.weight : 1;
    this._internalWeight = this._weight;
  }

  /**
   * Gets the type of blending used for states controlled by the layer.
   *
   * @readonly
   * @type {string}
   */
  get blendMode() {
    return this._blendMode;
  }

  /**
   * Gets and sets the amount of influence the layer's current animation has over
   * the result for the host.
   *
   * @type {number}
   */
  set weight(weight) {
    this._weight = MathUtils.clamp(weight, 0, 1);
  }

  get weight() {
    return this._weight;
  }

  /**
   * Gets whether or not the layer's weight value is currently being animated.
   *
   * @readonly
   * @type {boolean}
   */
  get weightPending() {
    return this._promises.weight && this._promises.weight.pending;
  }

  /**
   * Pause the current animation state and any interpolation happening on the layer's
   * weight property.
   *
   * @returns {boolean}
   */
  pause() {
    this._paused = true;
    this._weightPaused = true;

    return this.pauseAnimation() || this.weightPending;
  }

  /**
   * Resume the current animation state and any interpolation happening on the layer's
   * weight property.
   *
   * @returns {boolean}
   */
  resume() {
    this._paused = false;
    this._weightPaused = false;

    const isWeightActive = this.weightPending;

    if (this._currentState) {
      return this.resumeAnimation() || isWeightActive;
    } else {
      return isWeightActive;
    }
  }

  /**
   * Updates the user defined weight over time.
   *
   * @param {number} weight - The target weight value.
   * @param {number} [seconds=0] - The amount of time it will take to reach the
   * target weight.
   * @param {Function=} easingFn - The easing function to use for interpolation.
   *
   * @returns {Deferred}
   */
  setWeight(weight, seconds = 0, easingFn) {
    if (this.weightPending) {
      this._promises.weight.cancel();
    }

    weight = MathUtils.clamp(weight);
    this._promises.weight = AnimationUtils.interpolateProperty(
      this,
      'weight',
      weight,
      {
        seconds,
        easingFn: easingFn !== undefined ? easingFn : this._easingFn,
      }
    );

    return this._promises.weight;
  }

  /**
   * Pause any interpolation happening on the layer's weight property.
   *
   * @returns {boolean}
   */
  pauseWeight() {
    this._weightPaused = true;

    return this.weightPending;
  }

  /**
   * Resume any interpolation happening on the layer's weight property.
   *
   * @returns {boolean}
   */
  resumeWeight() {
    this._weightPaused = false;

    return this.weightPending;
  }

  /**
   * Multiplies the user weight by a factor to determine the internal weight.
   *
   * @param {number} factor - 0-1 multiplier to apply to the user weight.
   */
  updateInternalWeight(factor) {
    this._internalWeight = this._weight * factor;

    if (this._currentState) {
      this._currentState.updateInternalWeight(this._internalWeight);
    }
  }

  /**
   * Returns the names of blend states in an animation.
   *
   * @param {string} animationName - Name of the animation.
   *
   * @returns {Array.<string>} - Names of blend states.
   */
  getAnimationBlendNames(animationName) {
    const state = this.getState(animationName);

    if (state === undefined) {
      throw new Error(
        `Cannot get blend names of animation ${animationName} on layer ${this.name}. No animation exists with this name.`
      );
    }

    if (state instanceof AbstractBlendState) {
      return state.getStateNames();
    }

    throw new Error(
      `Cannot get blend names of animation ${animationName} on layer ${this.name}. Animation is not an instance of AbstractBlendState.`
    );
  }

  /**
   * Update the weight for a blend state of an animation.
   *
   * @param {string} animationName - Name of the animation containing the blend state
   * to update.
   * @param {string} blendName - Name of the blend state to update.
   * @param {number} weight - Weight value to set on the animation. This number shoudld be
   * in the 0-1 range.
   * @param {number=} seconds - Number of seconds it should take to reach the new weight.
   * Default is zero and will set immediately.
   * @param {Function=} easingFn - Easing function to use while interpolating the new
   * weight. Default is Easing.Linear.InOut.
   *
   * @returns {Deferred} - Promise that will resolve once the animation's weight reaches
   * the target value.
   */
  setAnimationBlendWeight(
    animationName,
    blendName,
    weight,
    seconds = 0,
    easingFn
  ) {
    const state = this.getState(animationName);

    if (state === undefined) {
      throw new Error(
        `Cannot set blend weight of animation ${animationName} on layer ${this.name}. No animation exists with this name.`
      );
    }

    if (state instanceof AbstractBlendState) {
      return state.setBlendWeight(blendName, weight, seconds, easingFn);
    }

    throw new Error(
      `Cannot set blend weight of animation ${animationName} on layer ${this.name}. Animation is not an instance of AbstractBlendState.`
    );
  }

  /**
   * Returns the weight for a blend state of an animation.
   *
   * @param {string} animationName - Name of the animation containing the blend state
   * to update.
   * @param {string} blendName - Name of the blend state to retrieve the weight of.
   *
   * @returns {number} - Weight of the blend state.
   */
  getAnimationBlendWeight(animationName, blendName) {
    const state = this.getState(animationName);

    if (state === undefined) {
      throw new Error(
        `Cannot get blend weight of animation ${animationName} on layer ${this.name}. No animation exists with this name.`
      );
    }

    if (state instanceof AbstractBlendState) {
      return state.getBlendWeight(blendName);
    }

    throw new Error(
      `Cannot get blend weight of animation ${animationName} on layer ${this.name}. Animation is not an instance of AbstractBlendState.`
    );
  }

  /**
   * Update any weight interpolators and the current animation.
   *
   * @param {number} deltaTime - Time in milliseconds since the last update.
   */
  update(deltaTime) {
    super.update(deltaTime);

    if (!this._paused && !this._weightPaused) {
      this._promises.weight.execute(deltaTime);
    }
  }

  /**
   * Cancel any pending promises and discard states controlled by the layer.
   */
  discard() {
    super.discard();

    this.discardStates();

    this._promises.weight.cancel();
    delete this._promises;
  }
}

export default AnimationLayer;
