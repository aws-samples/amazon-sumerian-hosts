// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractState from './AbstractState';
import AnimationPlayerInterface from '../AnimationPlayerInterface';
import StateContainerInterface from './StateContainerInterface';

/**
 * Class for playing an ordered array of animation states in sequence.
 *
 * @extends AbstractState
 * @implements @AnimationPlayerInterface
 */
class QueueState extends AnimationPlayerInterface.Mixin(
  StateContainerInterface.Mixin(AbstractState)
) {
  /**
   * @constructor
   *
   * @param {Object} [options={}] - Options for the state.
   * @param {boolean} [options.autoAdvance=true] - Whether to autmatically advance
   * to the next state in the queue as each state completes.
   * @param {Array.<AbstractState>} [queueStates=[]] - Array of states to be played
   * in order.
   */
  constructor(options = {}, queueStates = []) {
    super(options);

    queueStates.forEach(state => {
      this.addState(state);
    });

    this._queue = this._states.keys();
    this._done = true;
  }

  /**
   * Gets whether the animation queue has reached the end.
   */
  get done() {
    return this._done;
  }

  /**
   * Gets the internal weight.
   *
   * @readonly
   * @type {number}
   */
  get internalWeight() {
    return this._currentState
      ? this._currentState.internalWeight * this._internalWeight
      : 0;
  }

  /**
   * Restart the queue iterator.
   *
   * @private
   */
  _reset() {
    this._queue = this._states.keys();
    const {value, done} = this._queue.next();
    this._done = done;

    return value || null;
  }

  /**
   * Multiplies the user weight by a factor to determine the internal weight.
   *
   * @param {number} factor - 0-1 multiplier to apply to the user weight.
   */
  updateInternalWeight(factor) {
    super.updateInternalWeight(factor);

    if (this._currentState) {
      this._currentState.updateInternalWeight(this._internalWeight);
    }
  }

  /**
   * Start the next animation in the queue.
   *
   * @param {Function=} onNext - Function to execute each time an animation completes
   * and the queue moves to the next animation.
   * @param {boolean} [wrap=false] - Whether or not to start the queue from the
   * beginning again if the end has been reached.
   *
   * @returns {Deferred}
   */
  next(onNext, wrap = false) {
    // Move the queue forward
    const {value: name, done} = this._queue.next();
    this._done = done;
    this._paused = false;

    // The queue has reached the end
    if (done) {
      // Start the queue over
      if (wrap) {
        return this.play(
          this._playCallbacks.onFinish,
          this._playCallbacks.onError,
          this._playCallbacks.onCancel,
          onNext
        );
      }
      // Stop the queue
      else {
        this._promises.finish.resolve();
        return this._promises.finish;
      }
    }

    // Signal the next animation is starting
    if (typeof onNext === 'function') {
      const lastName = [...this._states.keys()][this._states.size - 1];
      const isQueueEnd = name === lastName;
      onNext({
        name,
        canAdvance: this.getState(name).loopCount !== Infinity && !isQueueEnd,
        isQueueEnd,
      });
    }

    // Start the next animation
    this.playAnimation(
      name,
      this._transitionTime,
      this._easingFn,
      () => {
        if (!this._paused && !this.isTransitioning) {
          this.next(onNext);
        }
      },
      this._playCallbacks.onError
    );

    return this._promises.finish;
  }

  play(onFinish, onError, onCancel, onNext) {
    const name = this._reset();
    super.play(onFinish, onError, onCancel);

    if (this._done) {
      this._promises.finish.resolve();
    } else {
      // Signal the next animation is starting
      if (name !== this.currentAnimation && typeof onNext === 'function') {
        const lastName = [...this._states.keys()][this._states.size - 1];
        const isQueueEnd = name === lastName;
        onNext({
          name,
          canAdvance: name
            ? this.getState(name).loopCount !== Infinity && !isQueueEnd
            : true,
          isQueueEnd: !name || isQueueEnd,
        });
      }

      // Start the next animation
      this.playAnimation(
        name,
        this._currentState ? this._transitionTime : 0,
        this._easingFn,
        () => {
          if (!this._paused && !this.isTransitioning) {
            this.next(onNext);
          }
        },
        onError
      );
    }

    return this._promises.finish;
  }

  pause() {
    const paused = super.pause();
    this.pauseAnimation();

    return paused;
  }

  resume(onFinish, onError, onCancel, onNext) {
    if (this._done) {
      return this.play(onFinish, onError, onCancel, onNext);
    } else {
      super.resume(onFinish, onError, onCancel);

      this.resumeAnimation(
        this._currentState.name,
        this._transitionTime,
        this._easingFn,
        () => {
          if (!this._paused && !this.isTransitioning) {
            this.next(onNext);
          }
        },
        onError
      );

      return this._promises.finish;
    }
  }

  cancel() {
    const canceled = super.cancel();

    if (this._currentState) {
      this._currentState.cancel();
    }

    return canceled;
  }

  stop() {
    const stopped = super.stop();
    this.stopAnimation();
    this._done = true;

    return stopped;
  }

  discard() {
    super.discard();

    this.discardStates();
  }
}

export default QueueState;
