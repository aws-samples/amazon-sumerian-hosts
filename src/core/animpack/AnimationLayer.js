// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import TransitionState from './state/TransitionState';
import AnimationUtils from './AnimationUtils';
import Deferred from '../Deferred';
import Utils from '../Utils';
import FreeBlendState from './state/FreeBlendState';

export const LayerBlendModes = {Override: 'Override', Additive: 'Additive'};
export const DefaultLayerBlendMode = 'Override';

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
 */
class AnimationLayer {
  /**
   * @private
   *
   * @param {Object=} options -  Options for the animation layer.
   * @param {string} options.name - Name of the layer. Names must be unique to the
   * animation feature that contains the layer.
   * @param {LayerBlendModes} [blendMode=LayerBlendModes[DefaultLayerBlendMode]] -
   * Type of blending to use for all states controlled by the layer.
   * @param {number} [weight=1] - The amount of influence the layer's current
   * animation has over the result for the host.
   * @param {number} [transitionTime=0] - The default amount of time to use when
   * playing and resuming animations.
   * @param {Function=} easingFn - The default easing function to use when
   * transitioning between animations and setting layer weight.
   */
  constructor(options = {}) {
    this.name = options.name === undefined ? 'AnimationLayer' : options.name;
    this._blendMode = Array.from(Object.values(LayerBlendModes)).includes(
      options.blendMode
    )
      ? options.blendMode
      : DefaultLayerBlendMode;
    this._transitionState = new TransitionState();
    this._states = new Map();
    this._currentState = null;
    this._promises = {
      weight: Deferred.resolve(),
    };
    this._paused = false;
    this._weightPaused = false;

    this.weight = typeof options.weight === 'number' ? options.weight : 1;
    this._internalWeight = this._weight;
    this._transitionTime =
      Number(options.transitionTime) >= 0 ? Number(options.transitionTime) : 0;
    this._easingFn =
      typeof options.easingFn === 'function' ? options.easingFn : undefined;
  }

  /**
   * Gets whether or not the layer is updating states and weights.
   */
  get paused() {
    return this._paused;
  }

  /**
   * Gets the type of blending used for states controlled by the layer.
   */
  get blendMode() {
    return this._blendMode;
  }

  /**
   * Gets and sets the default number of seconds it takes to transition to a new
   * animation.
   */
  get transitionTime() {
    return this._transitionTime;
  }

  set transitionTime(seconds) {
    seconds = Number(seconds);

    if (!(seconds >= 0)) {
      throw new Error(
        `Cannot set transition time for layer ${this._name} to ${seconds}. Seconds must be a numeric value greather than or equal to zero.`
      );
    }

    this._transitionTime = seconds;
  }

  /**
   * Gets and sets the default easing function to use when transitioning and
   * setting weights.
   */
  get easingFn() {
    return this._easingFn;
  }

  set easingFn(fn) {
    this._easingFn = fn;
  }

  /**
   * Gets and sets the amount of influence the layer's current animation has over
   * the result for the host.
   */
  set weight(weight) {
    this._weight = AnimationUtils.clamp(weight, 0, 1);
  }

  get weight() {
    return this._weight;
  }

  /**
   * Gets whether or not the layer's weight value is currently being animated.
   */
  get weightPending() {
    return this._promises.weight && this._promises.weight.pending;
  }

  /**
   * Gets the state the layer is currently in control of.
   */
  get currentState() {
    return this._currentState;
  }

  /**
   * Gets the name of the state the layer is currently in control of.
   */
  get currentAnimation() {
    if (this._currentState) {
      return this._currentState.name;
    }

    return null;
  }

  /**
   * Gets an array of the names of all states the layer controls.
   */
  get animations() {
    return [...this._states.keys()];
  }

  /**
   * Gets whether or not the layer is currently transitioning to a new animation.
   */
  get isTransitioning() {
    return this._currentState === this._transitionState;
  }

  /**
   * Return the state with the given name.
   *
   * @param {string} name - Name of the state.
   *
   * @returns {AbstractState}
   */
  getState(name) {
    return this._states.get(name);
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

    weight = AnimationUtils.clamp(weight);
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
   * @private
   *
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
   * Add a new animation state to be controlled by the layer. States are stored
   * by name so the state's name must be unique to the layer, if it isn't the name
   * will be incremented until it is unique.
   *
   * @param {AbstractState} state - The state to add to the layer.
   *
   * @returns {string} The unique name of the state.
   */
  addAnimation(state) {
    // Make sure the state is not already on the layer
    if ([...this._states.values()].includes(state)) {
      console.warn(
        `Cannot add animation ${state.name} to layer ${this.name}. Animation was already added to the layer.`
      );
      return state.name;
    }

    // Make sure the state name is unique
    const stateName = Utils.getUniqueName(
      state.name,
      [...this._states.keys()]
    );

    if (state.name !== stateName) {
      console.warn(
        `Animation name ${state.name} is not unique for layer ${this.name}. New animation will be added with the name ${stateName}.`
      );
      state.name = stateName;
    }

    this._states.set(state.name, state);

    return state.name;
  }

  /**
   * Removes an animation state with the given name from the layer.
   *
   * @param {string} name - Name of the state to remove.
   *
   * @returns {boolean} Whether or not a state was removed.
   */
  removeAnimation(name) {
    if (this._states.has(name)) {
      this._states.get(name).discard();
      this._states.delete(name);
      return true;
    } else {
      console.warn(
        `Did not remove animation ${name} from layer ${this.name}. No animation exists with this name.`
      );
      return false;
    }
  }

  /**
   * Renames an animation state with the given name on the layer. Name must be unique
   * to the layer, if it isn't the name will be incremented until it is unique.
   *
   * @param {string} currentName - Name of the animation to rename.
   * @param {string} newName - Name to update the animation's name with.
   *
   * @returns {string} Updated name for the animation.
   */
  renameAnimation(currentName, newName) {
    // Make sure the name is valid
    if (!this._states.has(currentName)) {
      throw new Error(
        `Cannot rename animation ${currentName} on layer ${this.name}. No animation exists with this name.`
      );
    }

    // Exit if the names are the same
    if (currentName === newName) {
      return currentName;
    }

    // Make sure the name is unique
    const name = Utils.getUniqueName(
      newName,
      [...this._states.keys()].filter(s => s.name !== currentName)
    );

    if (name !== newName) {
      console.warn(
        `Animation name ${newName} is not unique on layer ${this.name}. Animation will be renamed to ${name}.`
      );
    }

    const state = this._states.get(currentName);
    this._states.delete(currentName);
    this._states.set(name, state);
    state.name = name;

    return name;
  }

  /**
   * Returns the names of blend states in an animation.
   *
   * @param {string} animationName - Name of the animation.
   *
   * @returns {Array.<string>} - Names of blend states.
   */
  getAnimationBlendNames(animationName) {
    const state = this._states.get(animationName);

    if (state === undefined) {
      throw new Error(
        `Cannot get blend names of animation ${animationName} on layer ${this.name}. No animation exists with this name.`
      );
    }

    if (state instanceof FreeBlendState) {
      return state.animations;
    }

    throw new Error(
      `Cannot get blend names of animation ${animationName} on layer ${this.name}. Animation is not an instance of FreeBlendState.`
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
    const state = this._states.get(animationName);

    if (state === undefined) {
      throw new Error(
        `Cannot set blend weight of animation ${animationName} on layer ${this.name}. No animation exists with this name.`
      );
    }

    if (state instanceof FreeBlendState) {
      return state.setBlendWeight(blendName, weight, seconds, easingFn);
    }

    throw new Error(
      `Cannot set blend weight of animation ${animationName} on layer ${this.name}. Animation is not an instance of FreeBlendState.`
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
    const state = this._states.get(animationName);

    if (state === undefined) {
      throw new Error(
        `Cannot set blend weight of animation ${animationName} on layer ${this.name}. No animation exists with this name.`
      );
    }

    if (state instanceof FreeBlendState) {
      return state.getBlendWeight(blendName);
    }

    throw new Error(
      `Cannot get blend weight of animation ${animationName} on layer ${this.name}. Animation is not an instance of FreeBlendState.`
    );
  }

  /**
   * @private
   *
   * Update the layer's current state to a new value. If transitionTime is defined
   * and greater than zero, perform a smooth blend between any states that currently
   * have non-zero weight values and the new state.
   *
   * @param {(string|null)} name - Name of the state to transition to.
   * @param {string} playMethod - Name of the operation being prepared for, to be
   * used in error messaging.
   * @param {number=} transitionTime - Amount of time in seconds it will take to
   * switch to the new state.
   * @param {Function=} easingFn - Easing function to use when transitioning to a
   * new state over time.
   * @param {Function=} onError - Function to execute if an error is encountered.
   */
  _prepareCurrentState(name, playMethod, transitionTime, easingFn, onError) {
    if (name !== null && !this._states.has(name)) {
      const e = new Error(
        `Cannot ${playMethod} animation ${name} on layer ${this.name}. No animation exists with this name.`
      );

      if (typeof onError === 'function') {
        onError(e);
      }

      throw e;
    }

    const targetState = name !== null ? this._states.get(name) : null;

    // Make sure the new state isn't already playing
    if (this._currentState !== targetState) {
      // Switch to the new state immediately
      if (transitionTime <= 0) {
        // Cancel the current state and set its weight to 0
        if (this._currentState) {
          this._currentState.cancel();
          this._currentState.weight = 0;
          this._currentState.deactivate();
        }

        this._currentState = targetState;
      }
      // Blend to the new state over time
      else {
        // Make sure to transition out of any states with non-zero weight
        const currentStates = [...this._states.values()].filter(
          s => s !== targetState && (s.weight || s.weightPending)
        );

        // Update the transition state with new inputs
        this._transitionState.configure(
          currentStates,
          targetState,
          transitionTime,
          easingFn,
          () => {
            this._currentState = targetState;
            this._transitionState.weight = 0;
          }
        );

        this._currentState = this._transitionState;
      }

      // Update weight for the new current state so it has full influence for the layer
      this._currentState.weight = 1;
    }

    this._currentState.updateInternalWeight(this._internalWeight);
  }

  /**
   * Start playback an animation from the beginning.
   *
   * @param {string} name - Name of the animation to play.
   * @param {number=} transitionTime - Amount of time it will take before the
   * new state has full influence for the layer.
   * @param {Function=} easingFn - Easing function to use for blending if transitionTime
   * is greater than zero.
   * @param {Function=} onFinish - Function to execute when the animation finishes.
   * @param {Function=} onError - Function to execute if the animation encounters
   * an error during playback.
   * @param {Function=} onCancel - Function to execute if playback is canceled.
   *
   * @returns {Deferred}
   */
  playAnimation(name, transitionTime, easingFn, onFinish, onError, onCancel) {
    let error;
    let reject = false;
    try {
      this._prepareCurrentState(
        name,
        'play',
        transitionTime !== undefined ? transitionTime : this._transitionTime,
        easingFn !== undefined ? easingFn : this._easingFn,
        onError
      );
    } catch (e) {
      error = e;
      reject = true;
    }

    if (reject) {
      return Deferred.reject(error);
    }

    return this._currentState.play(onFinish, onError, onCancel);
  }

  /**
   * Pause playback of the current animation.
   *
   * @returns {boolean}
   */
  pauseAnimation() {
    if (this._currentState) {
      return this._currentState.pause();
    } else {
      return false;
    }
  }

  /**
   * Resume playback of an animation.
   *
   * @param {string=} name - Name of the animation to resume playback for. Default
   * is the layer's current animation name.
   * @param {number=} transitionTime - Amount of time it will take before the
   * new state has full influence for the layer.
   * @param {Function=} onFinish - Function to execute when the state finishes.
   * @param {Function=} onError - Function to execute if the state encounters
   * an error during playback.
   * @param {Function=} onCancel - Function to execute if playback is canceled.
   *
   * @returns {Deferred}
   */
  resumeAnimation(name, transitionTime, easingFn, onFinish, onError, onCancel) {
    if (name === undefined && this._currentState) {
      name = this._currentState.name;
    }

    let error;
    let reject = false;
    try {
      this._prepareCurrentState(
        name,
        'resume',
        transitionTime !== undefined ? transitionTime : this._transitionTime,
        easingFn !== undefined ? easingFn : this._easingFn,
        onError
      );
    } catch (e) {
      error = e;
      reject = true;
    }

    if (reject) {
      return Deferred.reject(error);
    }

    return this._currentState.resume(onFinish, onError, onCancel);
  }

  /**
   * Stop playback of the current animation.
   *
   * @returns {boolean}
   */
  stopAnimation() {
    if (this._currentState) {
      return this._currentState.stop();
    } else {
      return false;
    }
  }

  /**
   * @private
   *
   * Update any weight interpolators and the current animation.
   *
   * @param {number} deltaTime - Time in milliseconds since the last update.
   */
  update(deltaTime) {
    if (!this._paused && !this._weightPaused) {
      this._promises.weight.execute(deltaTime);
    }

    if (this._currentState) {
      this._currentState.update(deltaTime);
    }
  }

  /**
   * Cancel any pending promises and discard states controlled by the layer.
   */
  discard() {
    this._states.forEach(state => {
      state.discard();
    });

    this._transitionState.discard();
    this._promises.weight.cancel();

    delete this._states;
    delete this._transitionState;
    delete this._promises;
  }
}

export default AnimationLayer;
