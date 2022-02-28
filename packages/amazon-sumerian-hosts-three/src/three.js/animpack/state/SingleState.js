// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {SingleState as CoreSingleState, MathUtils} from '@amazon-sumerian-hosts/core';

/**
 * Threejs AnimationAction object
 * @external "THREE.AnimationAction"
 * @see https://threejs.org/docs/#api/en/animation/AnimationAction
 */

const threeBlendModes = {
  Override: THREE.NormalAnimationBlendMode,
  Additive: THREE.AdditiveAnimationBlendMode,
};

/**
 * @extends core/SingleState
 * @alias threejs/SingleState
 */
class SingleState extends CoreSingleState {
  /**
   * @constructor
   *
   * @param {Object=} options - Options for the animation state.
   * @param {external:"THREE.AnimationAction"} threeAction - Animation action that controls
   * playback of the clip.
   */
  constructor(options = {}, threeAction) {
    super(options);

    // Callback to catch THREE animation action completion
    this._onFinishedEvent = ({type, action}) => {
      // Exit if this isn't the finish event for this animation
      if (type !== 'finished' || action !== this.threeAction) {
        return;
      }

      this._promises.play.resolve();

      // Stop evaluating interpolators if they have already completed
      if (!this.weightPending && !this.timeScalePending) {
        this._paused = true;
      }
    };

    this._threeAction = threeAction;
    this._threeAction.clampWhenFinished = true; // Hold the last frame on completion
    this._threeAction.enabled = false;
    this._threeAction.loop =
      this._loopCount === 1 ? THREE.LoopOnce : THREE.LoopRepeat;
    this._threeAction.paused = this._paused;
    this._threeAction.repetitions = this._loopCount;
    this._threeAction.timeScale = this._timeScale;
    this._threeAction.weight = this._internalWeight;
    this._threeAction.blendMode = threeBlendModes[this._blendMode];

    // Start listening for animation finished events
    this._threeAction
      .getMixer()
      .addEventListener('finished', this._onFinishedEvent);
  }

  /**
   * Gets the THREE.AnimationAction object.
   *
   * @readonly
   * @type {external:"THREE.AnimationAction"}
   */
  get threeAction() {
    return this._threeAction;
  }

  get normalizedTime() {
    if (
      this._threeAction.time &&
      this._threeAction.getClip() &&
      this._threeAction.getClip().duration
    ) {
      return this._threeAction.time / this._threeAction.getClip().duration;
    }
    return 0;
  }

  set normalizedTime(time) {
    time = MathUtils.clamp(time);
    this._threeAction.time = this._threeAction.getClip().duration * time;
  }

  get weight() {
    return super.weight;
  }

  set weight(weight) {
    super.weight = weight;

    this._threeAction.enabled = true;
  }

  updateInternalWeight(factor) {
    super.updateInternalWeight(factor);

    this._threeAction.setEffectiveWeight(this._internalWeight);
  }

  get timeScale() {
    return super.timeScale;
  }

  set timeScale(timeScale) {
    super.timeScale = timeScale;

    this._threeAction.timeScale = timeScale;
  }

  get loopCount() {
    return super.loopCount;
  }

  set loopCount(loopCount) {
    super.loopCount = loopCount;

    this._threeAction.loop =
      loopCount === 1 ? THREE.LoopOnce : THREE.LoopRepeat;
    this._threeAction.repetitions = loopCount;
  }

  play(onFinish, onError, onCancel) {
    // Restart animation
    this._threeAction.reset();
    this._threeAction.play();

    return super.play(onFinish, onError, onCancel);
  }

  pause() {
    // Make sure animation has influence
    this._threeAction.paused = true;
    this._threeAction.play();

    return super.pause();
  }

  resume(onFinish, onError, onCancel) {
    // Make sure the animation can play and has influence
    this._threeAction.paused = false;
    this._threeAction.enabled = true;
    this._threeAction.play();

    return super.resume(onFinish, onError, onCancel);
  }

  cancel() {
    // Stop animation playback
    this._threeAction.paused = true;

    return super.cancel();
  }

  stop() {
    // Restart and pause the animation
    this._threeAction.reset();
    this._threeAction.paused = true;
    this._threeAction.play();

    return super.stop();
  }

  discard() {
    // Stop the animation from having influence
    this._threeAction.enabled = false;

    // Stop listening for finish events
    this._threeAction
      .getMixer()
      .removeEventListener('finished', this._onFinishedEvent);

    super.discard();
  }
}

export default SingleState;
