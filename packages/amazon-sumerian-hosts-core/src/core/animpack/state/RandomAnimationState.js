// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractState from './AbstractState';
import StateContainerInterface from './StateContainerInterface';
import AnimationPlayerInterface from '../AnimationPlayerInterface';
import Utils from '../../Utils';

/**
 * Class for playing random animations at random intervals within this state.
 *
 * @extends AbstractState
 * @implements AnimationPlayerInterface
 * @implements StateContainerInterface
 */
class RandomAnimationState extends AnimationPlayerInterface.Mixin(
  StateContainerInterface.Mixin(AbstractState)
) {
  /**
   * @constructor
   *
   * @param {Object} [options={}] - Options for the container state.
   * @param {number} [options.playInterval=3] - The base animation playback interval.
   * @param {Array.<AbstractState>} [subStates=[]] - states to be randomly picked to play
   */
  constructor(options = {}, subStates = []) {
    super(options);

    this._playInterval = options.playInterval ? options.playInterval : 3;

    subStates.forEach(state => {
      this.addState(state);
    });
  }

  /**
   * Gets and sets the base animation play interval
   *
   * @type {float}
   */
  get playInterval() {
    return this._playInterval;
  }

  set playInterval(playInterval) {
    this._playInterval = playInterval;
  }

  /**
   * Reset the internal timer for animation play interval
   *
   * @private
   */
  _resetTimer() {
    const playTimer = Utils.getRandomFloat(
      this._playInterval / 4,
      this._playInterval * 2
    );
    const onFinish = () => {
      this.playRandomAnimation(this._playCallbacks.onError);
    };
    this._promises.timer = Utils.wait(playTimer, {onFinish});
  }

  updateInternalWeight(factor) {
    super.updateInternalWeight(factor);

    if (this._currentState) {
      this._currentState.updateInternalWeight(this._internalWeight);
    }
  }

  /**
   * Pick a random animation and utilize AnimationPlayerInterface to play that animation
   *
   * @param {Function=} onError - Function to execute if the state encounters
   * an error during playback.
   */
  playRandomAnimation(onError) {
    this._resetTimer();

    const states = this.getStateNames();
    if (this._currentState) {
      states.splice(states.indexOf(this._currentState.name), 1);
    }
    const randomState = states[Utils.getRandomInt(0, states.length)];

    this.playAnimation(
      randomState,
      this._transitionTime,
      this._easingFn,
      undefined,
      onError,
      undefined
    );
  }

  play(onFinish, onError, onCancel) {
    this.playRandomAnimation(onError);
    return super.play(onFinish, onError, onCancel);
  }

  pause() {
    return super.pause() && this.pauseAnimation();
  }

  resume(onFinish, onError, onCancel) {
    if (this._currentState) {
      this.resumeAnimation(
        this._currentState.name,
        this._transitionTime,
        this._easingFn,
        undefined,
        onError,
        undefined
      );
    }
    return super.resume(onFinish, onError, onCancel);
  }

  cancel() {
    return super.cancel() && this.cancelAnimation();
  }

  stop() {
    return super.stop() && this.stopAnimation();
  }

  discard() {
    super.discard();
    this.discardStates();
  }
}

export default RandomAnimationState;
