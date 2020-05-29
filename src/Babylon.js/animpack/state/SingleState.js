// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CoreSingleState from 'core/animpack/state/SingleState';

const babylonBlendModes = {
  Override: false,
  Additive: true,
};

/**
 * Class for playing a single animation
 */
export default class SingleState extends CoreSingleState {
  /**
   * @private
   *
   * @param {Object=} options - Options for the animation state.
   * @param {string=} options.name - Name for the animation state. Names must be
   * unique for the layer the state is applied to.
   * @param {weight} [options.weight=0] - The 0-1 amount of influence the state will have.
   * @param {timeScale} [timeScale=1] - Factor to scale the playback speed of the
   * animation.
   * @param {number} [options.loopCount=Infinity] - Number of times the animation should
   * repeat before finishing.
   * @param {string} [options.blendMode=LayerBlendModes[DefaultLayerBlendMode]] - Type of
   * blending the animation should use.
   * @param {number=} from - Start time in seconds for playback of the animation.
   * Defaults to the time of the earliest frame in the group.
   * @param {number=} to - End time in seconds for playback of the animataion.
   * Defaults to the time of the latest frame in the group.
   * @param {BABYLON.AnimationGroup} babylonGroup - The animation group that controls
   * playback of the animation.
   * @param {BABYLON.Scene} babylonScene - The scene containing the babylonGroup.
   **/
  constructor(options = {}, babylonGroup, babylonScene) {
    super(options);
    this._onFinishedEvent = this._onFinishedEvent.bind(this);
    this._onLoopEvent = this._onLoopEvent.bind(this);

    this._babylonScene = babylonScene;
    this._babylonAnimations = [...babylonGroup.targetedAnimations];
    this._babylonAnimatables = [];
    this._babylonNumAnimations = this._babylonAnimations.length;
    this._babylonLoopCount = this._loopCount * this._babylonNumAnimations;
    this._looped = 0;
    this._finished = 0;
    this._from = Number.isNaN(Number(options.from))
      ? babylonGroup.from
      : Number(options.from);
    this._to = Number.isNaN(Number(options.to))
      ? babylonGroup.to
      : Number(options.to);
    this._started = false;
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
   * @private
   *
   * Stop and discard of currently stored animatables and generate new ones that
   * are paused.
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
   * @private
   *
   * Reset variables and animations. Should be called before playing from the
   * beginning and if calling stop.
   */
  _reset() {
    this._looped = 0;
    this._finished = 0;
    this._started = true;
    this._createAnimatables();
  }

  /**
   * @private
   *
   * Pause the animation and reset counters once the animation finishes.
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
   * @private
   *
   * Increment loop counter for each animation loop. If loop counter meets
   * loopCount, notifiy that the animation has finished.
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
