// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import MathUtils from './MathUtils';
import {Quadratic} from './animpack/Easing';
import ManagedAnimationLayerInterface from './animpack/ManagedAnimationLayerInterface';
import TextToSpeechFeatureDependentInterface from './awspack/TextToSpeechFeatureDependentInterface';
import AbstractHostFeature from './AbstractHostFeature';

/**
 * Default mapping of Polly viseme names to animation options objects.
 *
 * @property {Object} [sil={name: 'sil'}]
 * @property {Object} [p={name: 'p', overrideWeight: 0.9}]
 * @property {Object} [t={name: 't', blendTime: 0.2}]
 * @property {Object} [S={name: 'S'}]
 * @property {Object} [T={name: 'T'}]
 * @property {Object} [f={name: 'f', overrideWeight: 0.75}]
 * @property {Object} [k={name: 'k'}]
 * @property {Object} [i={name: 'i'}]
 * @property {Object} [r={name: 'r'}]
 * @property {Object} [s={name: 's', blendTime: 0.25}]
 * @property {Object} [u={name: 'u'}]
 * @property {Object} [@={name: '@'}]
 * @property {Object} [a={name: 'a'}]
 * @property {Object} [e={name: 'e', blendTime: 0.2}]
 * @property {Object} [E={name: 'E'}]
 * @property {Object} [o={name: 'o'}]
 * @property {Object} [O={name: 'O'}]
 */
const DefaultVisemeMap = {
  sil: {name: 'sil'},
  p: {name: 'p', overrideWeight: 0.9},
  t: {name: 't', blendTime: 0.2},
  S: {name: 'S'},
  T: {name: 'T'},
  f: {name: 'f', overrideWeight: 0.75},
  k: {name: 'k'},
  i: {name: 'i'},
  r: {name: 'r'},
  s: {name: 's', blendTime: 0.25},
  u: {name: 'u'},
  '@': {name: '@'},
  a: {name: 'a'},
  e: {name: 'e', blendTime: 0.2},
  E: {name: 'E'},
  o: {name: 'o'},
  O: {name: 'O'},
};

/**
 * Lipsync controls two types of movement: idle animation that should play while
 * speech is playing and viseme animations corresponding to Polly visemes whose
 * weights should be turned on and off as they are encountered in the Polly SSML
 * transcript. Layers owned by this feature will be enabled while speech is playing
 * and disabled once it stops.
 *
 * @extends AbstractHostFeature
 * @alias core/LipsyncFeature
 * @implements TextToSpeechFeatureDependentInterface
 * @implements ManagedAnimationLayerInterface
 */
class LipsyncFeature extends AbstractHostFeature.mix(
  TextToSpeechFeatureDependentInterface.Mixin,
  ManagedAnimationLayerInterface.Mixin
) {
  /**
   * @constructor
   *
   * @param {core/HostObject} host - Host that owns the feature.
   * @param {Object=} visemeOptions - Options for the viseme layers.
   * @param {number} [visemeOptions.blendTime=0.15] - Default amount of time it
   * will take to manipulate each freeBlend weight on the viseme states.
   * @param {Object} [visemeOptions.decayRate={amount: .5, seconds: .5}] - An object
   * describing the 0-1 factor viseme weight will decay if the viseme duration is
   * longer than the blendTime and the number of seconds it would take to decay
   * by that factor.
   * @param {number} [visemeOptions.easingFn=Quadratic.InOut] - Default easing function
   * to use when manipulating viseme freeBlend weights.
   * @param {Array.<Object>} [visemeOptions..layers=[]] - An array of layer options
   * objects to register as viseme layers.
   * @param {Object=} talkingOptions - Options for the talking layers.
   * @param {number} [talkingOptions.blendTime=0.75] - Default amount of time to
   * enable and disable the talking idle layers
   * @param {number} [talkingOptions.easingFn=Quadratic.InOut] - Default easing
   * function to use when manipulating weights on the talking idle layers.
   * @param {Array.<Object>} [talkingOptions.layers=[]] - An array of layer options
   * objects to register as talking layers.
   * @param {number} [visemeLeadTime=.067] - The amount of time to instruct the
   * TextToSpeechFeature to emit speechmarks before each one's actual timestamp
   * is reached. This will set the 'speechMarkOffset' variable on the TextToSpeechFeature.
   */
  constructor(
    host,
    {
      blendTime: visemeBlendTime = 0.15,
      decayRate: {amount = 0.5, seconds = 0.5} = {},
      easingFn: visemeEasingFn = Quadratic.InOut,
      layers: visemeLayers = [],
    } = {},
    {
      blendTime: talkingBlendTime = 0.75,
      easingFn: talkingEasingFn = Quadratic.InOut,
      layers: talkingLayers = [],
    } = {},
    visemeLeadTime = 0.067
  ) {
    super(host);

    this._visemeLayers = {};
    this._talkingLayers = {};
    this.visemeLeadTime = visemeLeadTime;

    // Register the viseme layers
    visemeLayers.forEach(({name, animation, visemeMap = DefaultVisemeMap}) => {
      this.registerVisemeLayer(name, {
        animation,
        visemeMap,
        decayRate: {amount, seconds},
        blendTime: visemeBlendTime,
        easingFn: visemeEasingFn,
      });
    });

    // Register the talking layers
    talkingLayers.forEach(({name, animation}) => {
      this.registerTalkingLayer(name, {
        animation,
        blendTime: talkingBlendTime,
        easingFn: talkingEasingFn,
      });
    });
  }

  /**
   * Ensure that registered viseme animations are FreeBlendStates.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that contains the viseme animation.
   * @param {string} animationName - Name of the animation.
   */
  _registerVisemeAnimation(layerName, animationName) {
    if (this._managedLayers[layerName].animations[animationName].isActive) {
      if (
        this._host.AnimationFeature.getAnimationType(
          layerName,
          animationName
        ) !== 'freeBlend'
      ) {
        // Warn and deactivate if the registered state is not freeBlend
        console.warn(
          `Cannot register Lipsync viseme animation ${animationName} on layer ${layerName} for host ${this._host.id}. Viseme animations must be of type 'freeBlend'.`
        );
        this._managedLayers[layerName].animations[
          animationName
        ].isActive = false;
      } else {
        // Check if the blendWeights can be manipulated now
        const weightNames = this._host.AnimationFeature.getAnimationBlendNames(
          layerName,
          animationName
        );
        const {visemeMap} = this._managedLayers[layerName].animations[
          animationName
        ];

        Object.values(visemeMap).forEach(visemeOptions => {
          visemeOptions.isActive = weightNames.includes(visemeOptions.name);
        });
      }
    }
  }

  /**
   * If the added feature is TextToSpeech, update its speechMarkOffset variable.
   *
   * @private
   *
   * @param {string} typeName - Name of the type of feature that was added.
   */
  _onFeatureAdded(typeName) {
    this._visemeLayers = this._visemeLayers || {};
    this._talkingLayers = this._talkingLayers || {};

    super._onFeatureAdded(typeName);

    if (typeName === 'TextToSpeechFeature') {
      this._host.TextToSpeechFeature.speechmarkOffset =
        -this._visemeLeadTime || 0;
    }
  }

  _onLayerAdded({name}) {
    super._onLayerAdded({name});

    // Validate the viseme animation
    if (this._visemeLayers[name] !== undefined) {
      this._registerVisemeAnimation(name, this._visemeLayers[name]);
    }
  }

  _onAnimationAdded({layerName, animationName}) {
    super._onAnimationAdded({layerName});

    // Validate the viseme animation
    if (this._visemeLayers[layerName] === animationName) {
      this._registerVisemeAnimation(layerName, this._visemeLayers[layerName]);
    }
  }

  _onPlay() {
    // Turn on the layer weights
    this.enable();

    // Set the current animations
    [this._visemeLayers, this._talkingLayers].forEach(layers => {
      Object.entries(layers).forEach(([layerName, animationName]) => {
        if (this._managedLayers[layerName].animations[animationName].isActive) {
          this._host.AnimationFeature.resumeAnimation(layerName, animationName);
        }
      });
    });
  }

  _onPause() {
    this._onStop();
  }

  _onResume() {
    this._onPlay();
  }

  _onStop() {
    // Turn off the layer weights
    this.disable();

    // Pause the current animations
    [this._visemeLayers, this._talkingLayers].forEach(layers => {
      Object.entries(layers).forEach(([layerName, animationName]) => {
        if (this._managedLayers[layerName].animations[animationName].isActive) {
          this._host.AnimationFeature.pauseAnimation(layerName, animationName);
        }
      });
    });
  }

  /**
   * When viseme events are caught, turn on weight of the new viseme for the duration
   * of the speech mark, then turn weight back off.
   *
   * @private
   *
   * @param {Object} event - Event data passed from the speech.
   * @param {Object} event.mark - Speechmark object.
   */
  async _onViseme({mark}) {
    Object.entries(this._visemeLayers).forEach(([layerName, animName]) => {
      // Make sure the layer can be manipulated
      const {isActive, visemeMap} = this._managedLayers[layerName].animations[
        animName
      ];

      if (!isActive) {
        return;
      }

      // Take variables from the viseme if they exist and default to the layer
      const {
        name: viseme,
        isActive: isVisemeActive,
        decayRate,
        blendTime,
        easingFn,
        overrideWeight,
      } = {
        ...this._managedLayers[layerName],
        ...visemeMap[mark.value],
      };

      const visemeNames = this._host.AnimationFeature.getAnimationBlendNames(
        layerName,
        animName
      );

      // Make sure the new viseme has an active freeBlend weight
      if (!isVisemeActive || !visemeNames.includes(viseme)) {
        return;
      }

      // Find the peak weight for the viseme and the amount of time it should
      // take to reach it
      let weight = 1;
      const duration = mark.duration / 1000;
      if (duration < blendTime) {
        const lerpFactor = blendTime > 0 ? duration / blendTime : 1;
        weight =
          overrideWeight !== undefined
            ? overrideWeight
            : MathUtils.lerp(0, 1, lerpFactor);
      }
      const blendInTime = Math.min(duration, blendTime);

      // Find the amount and time viseme will be held for
      const holdTime = duration - blendTime;

      if (holdTime < 0) {
        // Perform in -> out animation
        this._animateSimpleViseme(
          layerName,
          animName,
          viseme,
          weight,
          blendInTime,
          blendTime,
          easingFn
        );
      } else {
        const lerpFactor =
          decayRate.seconds > 0 ? holdTime / decayRate.seconds : 1;
        // Perform in -> hold -> out animation
        const decayWeight = MathUtils.lerp(
          weight,
          weight * decayRate.amount,
          Math.min(1, lerpFactor)
        );
        this._animateHeldViseme(
          layerName,
          animName,
          viseme,
          weight,
          decayWeight,
          blendInTime,
          holdTime,
          blendTime,
          easingFn
        );
      }
    });
  }

  /**
   * Animate a viseme blend weight towards a value and then back to zero.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that contains the viseme.
   * @param {string} animName - Name of the freeblend animation that contains
   * the viseme.
   * @param {string} visemeName - Name of the blend weight to manipulate.
   * @param {number} weight - Peak weight to animate towards.
   * @param {number} blendInTime - Amount of time it should take to reach the
   * peak weight.
   * @param {number} blendOutTime - Amount of time it should take to animate back
   * to zero after reaching the peak weight.
   * @param {Function} easingFn - Easing function to use during animation.
   */
  _animateSimpleViseme(
    layerName,
    animName,
    visemeName,
    peakWeight,
    blendInTime,
    blendOutTime,
    easingFn
  ) {
    // Animate towards the peak value
    const weightPromise = this._host.AnimationFeature.setAnimationBlendWeight(
      layerName,
      animName,
      visemeName,
      peakWeight,
      blendInTime,
      easingFn
    );

    // Animate back to zero if there was no weight interruption
    weightPromise.then(() => {
      if (!weightPromise.canceled) {
        this._host.AnimationFeature.setAnimationBlendWeight(
          layerName,
          animName,
          visemeName,
          0,
          blendOutTime,
          easingFn
        );
      }
    });
  }

  /**
   * Animate a viseme blend weight towards a value and then back to zero.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that contains the viseme.
   * @param {string} animName - Name of the freeblend animation that contains
   * the viseme.
   * @param {string} visemeName - Name of the blend weight to manipulate.
   * @param {number} peakWeight - Peak weight to animate towards.
   * @param {number} decayWeight - Weight to animate towards after reaching the
   * peak weight.
   * @param {number} blendInTime - Amount of time it should take to reach the
   * peak weight.
   * @param {number} holdTime - Amount of time it should take to reach the decay
   * weight after the peak weight has been reached.
   * @param {number} blendOutTime - Amount of time it should take to animate back
   * to zero after reaching the decay weight.
   * @param {Function} easingFn - Easing function to use during animation.
   */
  async _animateHeldViseme(
    layerName,
    animName,
    visemeName,
    peakWeight,
    decayWeight,
    blendInTime,
    holdTime,
    blendOutTime,
    easingFn
  ) {
    // Animate towards the peak value
    const startPromise = this._host.AnimationFeature.setAnimationBlendWeight(
      layerName,
      animName,
      visemeName,
      peakWeight,
      blendInTime,
      easingFn
    );

    await startPromise;

    if (!startPromise.canceled) {
      // Animate towards the decay value if there was no weight interruption
      const holdPromise = this._host.AnimationFeature.setAnimationBlendWeight(
        layerName,
        animName,
        visemeName,
        decayWeight,
        holdTime,
        easingFn
      );

      await holdPromise;

      if (!holdPromise.canceled) {
        // Animate back to zero if there was no weight interruption
        this._host.AnimationFeature.setAnimationBlendWeight(
          layerName,
          animName,
          visemeName,
          0,
          blendOutTime,
          easingFn
        );
      }
    }
  }

  /**
   * Gets and sets the amount of time in seconds to negatively offset speechmark
   * emission by.
   *
   * @type {number}
   */
  get visemeLeadTime() {
    return this._visemeLeadTime;
  }

  set visemeLeadTime(seconds) {
    this._visemeLeadTime = seconds;

    if (this._host.TextToSpeechFeature) {
      this._host.TextToSpeechFeature.speechmarkOffset = -seconds;
    }
  }

  /**
   * Start keeping track of an animation layer that owns a freeBlend animation
   * with blendWeights corresponding to visemes.
   *
   * @param {string} layerName - Name of the layer to keep track of.
   * @param {Object=} options - Options for the layer.
   * @param {string} [options.animation='visemes'] - Name of the animation on the
   * layer that will be played during speech. This animation must be of type
   * freeBlend.
   * @param {Object=} decayRate
   * @param {number} [decayRate.amount=0.5] - The percentage to decrease the viseme's
   * peak value by over time once the peak value has been reached.
   * @param {number} [decayRate.seconds=0.5] - The amount of time in seconds to
   * decrease the viseme's weight once it has reached its peak value.
   * @param {number=} [options.blendTime=[LipsyncFeature.DEFAULT_LAYER_OPTIONS.blendTime]{@link LipsyncFeature#DEFAULT_LAYER_OPTIONS#blendTime}] -
   * Default amount of time to use when manipulating animation blendWeights.
   * @param {Function=} options.easingFn - Default easing function to use when
   * manipulating animation blendWeights.
   * @param {Object} [options.visemeMap=DefaultVisemeMap] - Object containing key/value pairs of
   * Polly viseme names mapped to objects containing the name of the corresponding
   * animation blendWeight and any other animation options to use such as viseme
   * specific blend times and easing functions.
   */
  registerVisemeLayer(
    layerName,
    {
      animation = 'visemes',
      decayRate = {amount: 0.5, seconds: 0.5},
      blendTime = LipsyncFeature.DEFAULT_LAYER_OPTIONS.blendTime,
      easingFn,
      visemeMap = DefaultVisemeMap,
    } = {}
  ) {
    // Register the layer and animation
    this.registerLayer(layerName, {
      decayRate,
      blendTime,
      easingFn,
      animations: {[animation]: {visemeMap}},
    });
    this._visemeLayers[layerName] = animation;

    // Validate the viseme animation
    this._registerVisemeAnimation(layerName, animation);
  }

  /**
   * Start keeping track of an animation layer that contains a looping animation
   * to be played during speech.
   *
   * @param {string} layerName - Name of the layer to keep track of.
   * @param {Object=} options - Options for the layer.
   * @param {string} [options.animation='stand_talk'] - Name of the animation on the
   * layer that will be played during speech.
   * @param {number} [options.blendTime=[LipsyncFeature.DEFAULT_LAYER_OPTIONS.blendTime]{@link LipsyncFeature#DEFAULT_LAYER_OPTIONS#blendTime}] -
   * Default amount of time to use when manipulating the layer's weights.
   * @param {Function=} options.easingFn - Default easing function to use when
   * manipulating the layer's weights.
   */
  registerTalkingLayer(
    layerName,
    {
      animation = 'stand_talk',
      blendTime = LipsyncFeature.DEFAULT_LAYER_OPTIONS.blendTime,
      easingFn,
    } = {}
  ) {
    // Register the layer and animation
    this.registerLayer(layerName, {
      blendTime,
      easingFn,
      animations: {[animation]: {}},
    });
    this._talkingLayers[layerName] = animation;
  }

  /**
   * Adds a namespace to the host with the name of the feature to contain properties
   * and methods from the feature that users of the host need access to.
   *
   * @see LipsyncFeature
   */
  installApi() {
    /**
     * @inner
     * @namespace LipsyncFeature
     */
    const api = super.installApi();

    /**
     * @memberof LipsyncFeature
     * @name registerLayer
     * @instance
     * @method
     * @see ManagedAnimationLayerInterface#registerLayer
     */

    /**
     * @memberof LipsyncFeature
     * @name registerAnimation
     * @instance
     * @method
     * @see ManagedAnimationLayerInterface#registerAnimation
     */

    /**
     * @memberof LipsyncFeature
     * @name setLayerWeights
     * @instance
     * @method
     * @see ManagedAnimationLayerInterface#setLayerWeights
     */

    /**
     * @memberof LipsyncFeature
     * @name enable
     * @instance
     * @method
     * @see ManagedAnimationLayerInterface#enable
     */

    /**
     * @memberof LipsyncFeature
     * @name disable
     * @instance
     * @method
     * @see ManagedAnimationLayerInterface#disable
     */

    Object.assign(api, {
      /**
       * @memberof LipsyncFeature
       * @instance
       * @method
       * @see core/LipsyncFeature#registerVisemeLayer
       */
      registerVisemeLayer: this.registerVisemeLayer.bind(this),
      /**
       * @memberof LipsyncFeature
       * @instance
       * @method
       * @see core/LipsyncFeature#registerTalkingLayer
       */
      registerTalkingLayer: this.registerTalkingLayer.bind(this),
    });

    /**
     * @memberof LipsyncFeature
     * @instance
     * @name visemeLeadTime
     * @see core/LipsyncFeature#visemeLeadTime
     */
    Object.defineProperty(api, 'visemeLeadTime', {
      get: () => this.visemeLeadTime,
      set: seconds => {
        this.visemeLeadTime = seconds;
      },
    });

    return api;
  }
}

export default LipsyncFeature;
export {DefaultVisemeMap};
