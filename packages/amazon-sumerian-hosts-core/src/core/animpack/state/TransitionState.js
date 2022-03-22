// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Deferred from '../../Deferred';
import AbstractState from './AbstractState';

/**
 * Class for smooth transitioning between states on an animation layer.
 *
 * @extends AbstractState
 */
class TransitionState extends AbstractState {
  constructor(options = {}) {
    super(options);

    this._to = null;
    this._from = [];
    this._weightPromise = Deferred.resolve();
  }

  get internalWeight() {
    // Find the combined weight of all sub-states
    let totalWeight = 0;

    if (this._to) {
      totalWeight += this._to.weight;
    }

    this._from.forEach(state => {
      totalWeight += state.weight;
    });

    return totalWeight * this._internalWeight;
  }

  updateInternalWeight(factor) {
    super.updateInternalWeight(factor);

    this._from.forEach(state => {
      state.updateInternalWeight(this._internalWeight);
    });

    if (this._to) {
      this._to.updateInternalWeight(this._internalWeight);
    }
  }

  /**
   * Update sub-states the transition is controlling and start new weight
   * animations on each one. This should be called each time the current state of
   * an animation layer gets updated to a new value and a transition time greater
   * that zero is specified.
   *
   * @param {Array.<AbstractState>} [currentStates=[]] - States whose weight values
   * will be animated to 0.
   * @param {AbstractState=} targetState - State whose weight will be animated
   * to 1.
   * @param {number} transitionTime - Amount of time it will in seconds take for
   * weight animations to complete.
   * @param {Function=} easingFn - Easing function to use for weight animations.
   * Default is Easing.Linear.InOut.
   * @param {Function=} onComplete - Function to execute once all weight animations
   * complete.
   */
  configure(
    currentStates = [],
    targetState,
    transitionTime,
    easingFn,
    onComplete
  ) {
    // Deactivate any states that aren't in the new configuration
    if (this._to === targetState || currentStates.includes(this._to)) {
      this._to = null;
    }
    this._from = this._from.filter(
      state => state !== targetState && !currentStates.includes(state)
    );
    this.deactivate();

    this._from = currentStates;
    this._to = targetState;
    this.reset(transitionTime, easingFn, onComplete);
  }

  /**
   * Start new weight animations state the transition controls. This should be called
   * if an animation is played with a transition time greater than zero and a transtion
   * to that animation was already in progress.
   *
   * @param {number} transitionTime - Amount of time it will in seconds take for
   * weight animations to complete.
   * @param {Function=} easingFn - Easing function to use for weight animations.
   * Default is Easing.Linear.InOut.
   * @param {Function=} onComplete - Function to execute once all weight animations
   * complete.
   */
  reset(transitionTime, easingFn, onComplete) {
    // Stop any pending promises
    this._weightPromise.cancel();

    // Start tweening weight to 0 for the current states
    const weightPromises = this._from.map(state =>
      state.setWeight(0, transitionTime, easingFn)
    );

    // Start tweening weight to 1 for the target state
    if (this._to) {
      weightPromises.push(this._to.setWeight(1, transitionTime, easingFn));
      this.name = this._to.name;
    } else {
      this.name = null;
    }

    this._weightPromise = Deferred.all(weightPromises, () => {
      this._from.forEach(state => {
        state.cancel();
        state.deactivate();
      });
      if (typeof onComplete === 'function') {
        onComplete();
      }
    });
  }

  play(onFinish, onError, onCancel, onNext) {
    this._paused = false;
    this._playCallbacks.onFinish = onFinish;
    this._playCallbacks.onError = onError;
    this._playCallbacks.onCancel = onCancel;

    const promises = [this._weightPromise];

    this._from.forEach(state => {
      state.resume();
    });

    if (this._to) {
      this._promises.play = this._to.play(
        undefined,
        undefined,
        undefined,
        onNext
      );
      promises.push(this._promises.play);
    }

    this._promises.finish = Deferred.all(promises, onFinish, onError, onCancel);
    return this._promises.finish;
  }

  pause() {
    this._from.forEach(state => {
      state.pause();
    });

    if (this._to) {
      this._to.pause();
    }

    return super.pause();
  }

  resume(onFinish, onError, onCancel, onNext) {
    this._paused = false;

    if (!this._promises.play.pending) {
      this._playCallbacks.onFinish = onFinish || this._playCallbacks.onFinish;
      this._playCallbacks.onError = onError || this._playCallbacks.onError;
      this._playCallbacks.onCancel = onCancel || this._playCallbacks.onCancel;
    }

    const promises = [this._weightPromise];

    this._from.forEach(state => {
      state.resume();
    });

    if (this._to) {
      this._promises.play = this._to.resume(
        undefined,
        undefined,
        undefined,
        onNext
      );
      promises.push(this._promises.play);
    }

    this._promises.finish = Deferred.all(
      promises,
      this._playCallbacks.onFinish,
      this._playCallbacks.onError,
      this._playCallbacks.onCancel
    );
    return this._promises.finish;
  }

  cancel() {
    this._from.forEach(state => {
      state.pause();
    });

    if (this._to) {
      this._to.cancel();
    }

    this._weightPromise.cancel();

    return super.cancel();
  }

  stop() {
    this._from.forEach(state => {
      state.pause();
    });

    if (this._to) {
      this._to.stop();
    }

    return super.stop();
  }

  update(deltaTime) {
    super.update(deltaTime);

    this._from.forEach(state => {
      state.update(deltaTime);
    });

    if (this._to) {
      this._to.update(deltaTime);
    }
  }

  discard() {
    super.discard();

    this._weightPromise.cancel();
    delete this._weightPromise;
    this._to = null;
    this._from.length = 0;
  }

  deactivate() {
    if (this._to) {
      this._to.deactivate();
    }

    this._from.forEach(state => {
      state.deactivate();
    });
  }
}

export default TransitionState;
