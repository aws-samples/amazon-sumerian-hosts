// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Deferred from 'core/Deferred';
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

    // Stop any pending promises
    this._weightPromise.cancel();
    const weightPromises = [];

    // Start tweening weight to 0 for the current states
    this._from.forEach(state => {
      weightPromises.push(state.setWeight(0, transitionTime, easingFn));
    });

    // Start tweening weight to 1 for the target state
    if (this._to) {
      weightPromises.push(this._to.setWeight(1, transitionTime, easingFn));
      this.name = this._to.name;
    } else {
      this.name = null;
    }

    this._weightPromise = Deferred.all(weightPromises).then(() => {
      const canceled = weightPromises.some(p => p.canceled);

      // Signal completion if animations complete without being canceled
      if (!canceled && typeof onComplete === 'function') {
        onComplete();
      }
    });
  }

  play() {
    const playPromise = super.play();
    let toPromise;

    this._from.forEach(state => {
      state.resume();
    });

    if (this._to) {
      toPromise = this._to.play();
    }

    return this._weightPromise.then(() => {
      return toPromise || playPromise;
    });
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

  resume() {
    const playPromise = super.resume();
    let toPromise;

    this._from.forEach(state => {
      state.resume();
    });

    if (this._to) {
      toPromise = this._to.resume();
    }

    return this._weightPromise.then(() => {
      return toPromise || playPromise;
    });
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
