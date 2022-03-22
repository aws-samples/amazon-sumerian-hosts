// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Deferred from '../../Deferred';
import MathUtils from '../../MathUtils';
import AnimationUtils from '../AnimationUtils';

/**
 * Base class for a state in our animation system.
 *
 * @abstract
 */
class AbstractState {
  /**
   * @constructor
   *
   * @param {Object=} options - Options for the animation state.
   * @param {string=} options.name - Name for the animation state. Names must be
   * unique for the container the state is applied to and should be validated at
   * the container level. If no name is given it will default to the constructor
   * name.
   * @param {weight} [options.weight=0] - The 0-1 amount of influence the state will have.
   */
  constructor(options = {}) {
    this.name =
      options.name !== undefined ? options.name : this.constructor.name;
    this._weight =
      options.weight !== undefined ? MathUtils.clamp(options.weight, 0, 1) : 0;
    this._internalWeight = this._weight;
    this._paused = false;

    this._promises = {
      finish: Deferred.resolve(),
      weight: Deferred.resolve(),
      play: Deferred.resolve(),
    };

    this._playCallbacks = {
      onFinish: undefined,
      onError: undefined,
      onCancel: undefined,
    };
  }

  /**
   * Gets whether or not the state is currently paused.
   *
   * @type {number}
   */
  get paused() {
    return this._paused;
  }

  /**
   * Gets and sets the user defined weight.
   *
   * @type {number}
   */
  get weight() {
    return this._weight;
  }

  set weight(weight) {
    this._weight = MathUtils.clamp(weight, 0, 1);
  }

  /**
   * Gets whether or not the weight is currently being animated.
   *
   * @readonly
   * @type {boolean}
   */
  get weightPending() {
    return this._promises.weight && this._promises.weight.pending;
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
    this._promises.weight.cancel();
    weight = MathUtils.clamp(weight);

    this._promises.weight = AnimationUtils.interpolateProperty(
      this,
      'weight',
      weight,
      {seconds, easingFn}
    );

    return this._promises.weight;
  }

  /**
   * Gets the internal weight.
   *
   * @readonly
   * @type {number}
   */
  get internalWeight() {
    return this._internalWeight;
  }

  /**
   * Multiplies the user weight by a factor to determine the internal weight.
   *
   * @param {number} factor - 0-1 multiplier to apply to the user weight.
   */
  updateInternalWeight(factor) {
    this._internalWeight = this._weight * factor;
  }

  /**
   * Update any values that need to be evaluated every frame.
   *
   * @param {number} deltaTime - Time in milliseconds since the last update.
   */
  update(deltaTime) {
    if (!this._paused) {
      Object.values(this._promises).forEach(promise => {
        promise.execute(deltaTime);
      });
    }
  }

  /**
   * Start playback of the state from the beginning.
   *
   * @param {Function=} onFinish - Function to execute when the state finishes.
   * @param {Function=} onError - Function to execute if the state encounters
   * an error during playback.
   * @param {Function=} onCancel - Function to execute if playback is canceled.
   *
   * @returns {Deferred}
   */
  play(onFinish, onError, onCancel) {
    this._paused = false;
    this._playCallbacks.onFinish = onFinish;
    this._playCallbacks.onError = onError;
    this._playCallbacks.onCancel = onCancel;

    this._promises.play = new Deferred(undefined, onFinish, onError, onCancel);
    this._promises.finish = Deferred.all([
      this._promises.play,
      this._promises.weight,
    ]);

    return this._promises.finish;
  }

  /**
   * Pause playback of the state. This prevents pending promises from being executed.
   *
   * @returns {boolean}
   */
  pause() {
    this._paused = true;
    return true;
  }

  /**
   * Resume playback of the state.
   *
   * @param {Function=} onFinish - Function to execute when the state finishes.
   * @param {Function=} onError - Function to execute if the state encounters
   * an error during playback.
   * @param {Function=} onCancel - Function to execute if playback is canceled.
   *
   * @returns {Deferred}
   */
  resume(onFinish, onError, onCancel) {
    this._paused = false;

    if (!this._promises.play.pending) {
      this._playCallbacks.onFinish = onFinish || this._playCallbacks.onFinish;
      this._playCallbacks.onError = onError || this._playCallbacks.onError;
      this._playCallbacks.onCancel = onCancel || this._playCallbacks.onCancel;

      this._promises.play = new Deferred(
        undefined,
        this._playCallbacks.onFinish,
        this._playCallbacks.onError,
        this._playCallbacks.onCancel
      );
      this._promises.finish = Deferred.all([
        this._promises.play,
        this._promises.weight,
      ]);
    }

    return this._promises.finish;
  }

  /**
   * Cancel playback of the state and cancel any pending promises.
   *
   * @returns {boolean}
   */
  cancel() {
    this._paused = true;

    Object.values(this._promises).forEach(promise => {
      promise.cancel();
    });

    return true;
  }

  /**
   * Stop playback of the state and resolve any pending promises.
   *
   * @returns {boolean}
   */
  stop() {
    this._paused = true;

    Object.values(this._promises).forEach(promise => {
      promise.resolve();
    });

    return true;
  }

  /**
   * Cancel any pending promises and remove reference to them.
   */
  discard() {
    this.cancel();

    delete this._promises;
  }

  /**
   * Force the internal weight to 0. Should be called before switching or transitioning
   * to a new state.
   */
  deactivate() {
    this.updateInternalWeight(0);
  }
}

export default AbstractState;
