// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {
  SingleState as CoreSingleState,
  MathUtils,
} from '@amazon-sumerian-hosts/core';
import '@babylonjs/core/Animations/animatable';

const babylonBlendModes = {
  Override: false,
  Additive: true,
};

/**
 * @extends core/SingleState
 * @alias babylonjs/SingleState
 */
class SingleState extends CoreSingleState {
  /**
   * @constructor
   *
   * @param {Object=} options - Options for the animation state.
   * @param {AnimationGroup} babylonGroup - The animation group that controls
   * playback of the animation.
   * @param {Scene} babylonScene - The scene containing the babylonGroup.
   **/
  constructor(options = {}, babylonGroup, babylonScene) {
    super(options);
    this._onFinishedEvent = this._onFinishedEvent.bind(this);
    this._onLoopEvent = this._onLoopEvent.bind(this);

    this._from = Number.isNaN(Number(options.from))
      ? babylonGroup.from
      : Number(options.from);
    this._to = Number.isNaN(Number(options.to))
      ? babylonGroup.to
      : Number(options.to);
    babylonGroup.normalize(this._from, this._to);
    this._babylonScene = babylonScene;
    this._babylonAnimations = [...babylonGroup.targetedAnimations];
    this._babylonAnimatables = [];
    this._babylonNumAnimations = this._babylonAnimations.length;
    this._babylonLoopCount = this._loopCount * this._babylonNumAnimations;
    this._looped = 0;
    this._finished = 0;
    this._started = false;
  }

  get normalizedTime() {
    const animatable = this._babylonAnimatables[0];
    if (animatable && animatable.masterFrame) {
      return (animatable.masterFrame - this._from) / (this._to - this._from);
    }
    return 0;
  }

  set normalizedTime(time) {
    time = MathUtils.clamp(time);
    this._babylonAnimatables.forEach(animatable => {
      const targetFrame = (this._to - this._from) * time + this._from;
      animatable.goToFrame(targetFrame);
    });
  }

  get timeScale() {
    return super.timeScale;
  }

  set timeScale(timeScale) {
    super.timeScale = timeScale;

    this._babylonAnimatables.forEach(animatable => {
      animatable.speedRatio = timeScale;
    });
  }

  get loopCount() {
    return super.loopCount;
  }

  set loopCount(loopCount) {
    super.loopCount = loopCount;

    this._babylonAnimatables.forEach(animatable => {
      animatable.loopAnimation = loopCount > 1;
    });
  }

  /**
   * Stop and discard of currently stored animatables and generate new ones that
   * are paused.
   *
   * @private
   */
  _createAnimatables() {
    // Create new animatables
    const oldAnimatables = [...this._babylonAnimatables];
    this._babylonAnimatables.length = 0;
    this._babylonAnimations.forEach(targetedAnimation => {
      const animatable = this._babylonScene.beginDirectAnimation(
        targetedAnimation.target,
        [targetedAnimation.animation],
        this._from,
        this._to,
        this._loopCount > 1,
        0,
        this._onFinishedEvent,
        this._onLoopEvent,
        babylonBlendModes[this._blendMode]
      );
      animatable.weight = this._internalWeight;
      animatable.disposeOnEnd = false;
      this._babylonAnimatables.push(animatable);
    });

    // Dispose of the old animatables
    oldAnimatables.forEach(animatable => {
      animatable.stop();
    });
  }

  /**
   * Reset variables and animations. Should be called before playing from the
   * beginning and if calling stop.
   *
   * @private
   */
  _reset() {
    this._looped = 0;
    this._finished = 0;
    this._started = true;
    this._createAnimatables();
  }

  /**
   * Pause the animation and reset counters once the animation finishes.
   *
   * @private
   */
  _onFinishedEvent() {
    this._finished += 1;

    if (this._finished === this._babylonNumAnimations) {
      this._looped = 0;
      this._finished = 0;

      // Pause the animations
      this._babylonAnimatables.forEach(animatable => {
        animatable.speedRatio = 0;
      });

      this._promises.play.resolve();

      // Stop evaluating interpolators if they have already completed
      if (!this.weightPending && !this.timeScalePending) {
        this._paused = true;
      }
    }
  }

  /**
   * Increment loop counter for each animation loop. If loop counter meets
   * loopCount, notifiy that the animation has finished.
   *
   * @private
   */
  _onLoopEvent() {
    this._looped += 1;

    // Signal the state has finished
    if (this._looped === this._babylonLoopCount) {
      this._finished = this._babylonNumAnimations - 1;
      this._onFinishedEvent();
    }
  }

  updateInternalWeight(factor) {
    super.updateInternalWeight(factor);

    this._babylonAnimatables.forEach(animatable => {
      animatable.weight = this._internalWeight;
    });
  }

  play(onFinish, onError, onCancel) {
    this._reset();
    this.timeScale = this._timeScale;

    return super.play(onFinish, onError, onCancel);
  }

  pause() {
    this._babylonAnimatables.forEach(animatable => {
      animatable.speedRatio = 0;
    });

    return super.pause();
  }

  resume(onFinish, onError, onCancel) {
    if (!this._started) {
      this._reset();
    }

    this.timeScale = this._timeScale;

    return super.resume(onFinish, onError, onCancel);
  }

  cancel() {
    this._babylonAnimatables.forEach(animatable => {
      animatable.speedRatio = 0;
    });

    return super.cancel();
  }

  stop() {
    this._reset();

    return super.stop();
  }

  discard() {
    super.discard();

    // Dispose of the babylon resources
    this._babylonAnimatables.forEach(animatable => {
      animatable.stop();
    });
    delete this._babylonAnimations;
    delete this._babylonAnimatables;
    delete this._babylonScene;
  }

  deactivate() {
    super.deactivate();

    this._createAnimatables();
  }
}

export default SingleState;
