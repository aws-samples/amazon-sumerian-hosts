// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import ManagedAnimationLayerInterface from './animpack/ManagedAnimationLayerInterface';
import SSMLSpeechmarkInterface from './awspack/SSMLSpeechmarkInterface';
import AbstractHostFeature from './AbstractHostFeature';
import Deferred from './Deferred';
import Utils from './Utils';

/**
 * @constant
 */
const DefaultGestureWords = {
  big: [
    'add',
    'above',
    'authority',
    'big',
    'cover',
    'full',
    'fly',
    'grow',
    'growth',
    'high',
    'huge',
    'increase',
    'major',
    'majority',
    'large',
    'leader',
    'lot',
    'raise',
    'rise',
    'tall',
  ],
  heart: [
    'accept',
    'admit',
    'believe',
    'care',
    'feeling',
    'feel',
    'friend',
    'grateful',
    'happy',
    'heart',
    'human',
    'pain',
    'save',
    'safe',
    'kind',
    'love',
  ],
  in: [
    'include',
    'including',
    'inside',
    'into',
    'now',
    'near',
    'nearest',
    'closest',
    'therein',
    'within',
  ],
  many: [
    'all',
    'always',
    'any',
    'anyone',
    'among',
    'area',
    'around',
    'beautiful',
    'entire',
    'environment',
    'environments',
    'environmental',
    'everybody',
    'everyone',
    'everything',
    'audience',
    'total',
    'group',
    'groups',
    'million',
    'millions',
    'others',
    'billion',
    'billions',
    'hundred',
    'hundreds',
    'many',
    'thousand',
    'thousands',
    'world',
    'worlds',
    'outside',
    'reveal',
  ],
  movement: [
    'away',
    'across',
    'ahead',
    'along',
    'far',
    'fast',
    'follow',
    'go',
    'leave',
    'move',
    'movement',
    'through',
    'throughout',
    'toward',
    'travel',
    'turned',
    'passed',
  ],
  one: [
    'single',
    'one',
    'once',
    'first',
    'firstly',
    'only',
    'solo',
    'warned',
    'truly',
    'up',
    'alone',
  ],
  aggressive: [
    'power',
    'powers',
    'powerful',
    'assert',
    'assertive',
    'strong',
    'stronger',
    'strongest',
    'strength',
    'flex',
    'dang',
    'damn',
    'damnit',
    'darn',
    'shucks',
    'doh',
    'drat',
    'angry',
    'angrier',
    'angriest',
    'aggressive',
    'annoyed',
    'annoying',
    'attack',
    'attacking',
    'offense',
    'offensive',
    'battle',
  ],
  you: ['you', 'yall', "y'all", 'your', 'yours', 'thou', 'thy'],
  defense: [
    'defense',
    'fear',
    'repulsed',
    'scared',
    'scary',
    'scarier',
    'scariest',
    'fearful',
    'afraid',
    'cower',
    'cowers',
    'cowering',
    'hideous',
    'doomed',
    'terrified',
    'terrify',
    'terrifying',
    'terrifies',
    'spooky',
    'spookier',
    'spookiest',
  ],
  wave: [
    'hello',
    'hi',
    'hiya',
    'howdy',
    'welcome',
    'aloha',
    'heya',
    'hey',
    'bye',
    'goodbye',
    'hola',
    'adios',
    'chao',
  ],
  self: ['my', 'I', 'myself', 'self', "I've", 'Ive', 'me', 'mine', 'own'],
};

/**
 * Gesture allows you to play animations on demand on one or more layers from script
 * or ssml. If gesture is played that is a QueueState, the queue will automatically
 * be progressed after a given hold time if a looping queued state is reached. Gesture
 * layers can optionally be automatically disabled when no gesture animation is
 * in progress.
 *
 * @extends AbstractHostFeature
 * @alias core/GestureFeature
 * @implements SSMLSpeechmarkInterface
 * @implements ManagedAnimationLayerInterface
 */
class GestureFeature extends AbstractHostFeature.mix(
  SSMLSpeechmarkInterface.Mixin,
  ManagedAnimationLayerInterface.Mixin
) {
  /**
   * @constructor
   *
   * @param {core/HostObject} host - Host object that owns the feature.
   * @param {Object=} options - Optional options for the feature.
   * @param {number} [options.holdTime = 3] - Amount of time in seconds that must
   * elapse before advancing a gesture that's a {@link QueueState} when the current
   * state in the queue is set to loop infinitely.
   * @param {number} [options.minimumInterval = 0.25] - The minimum amount of time
   * in seconds that must elapse before another gesture can be played.
   * @param  {Object} layers - An object that maps layer names to layer options.
   * These are the layers that will be registered as tracked gesture layers. See
   * {@link ManagedAnimationLayerInterface#registerLayer} for more information
   * on expected format for each layer options object.
   */
  constructor(host, {holdTime = 3, minimumInterval = 1, layers = {}} = {}) {
    super(host);

    this.holdTime = holdTime;
    this.minimumInterval = minimumInterval;

    // Register the gesture layers
    Object.entries(layers).forEach(([name, options = {}]) => {
      this.registerLayer(name, options);
    });
  }

  /**
   * Return a valid hold time value. If hold time isn't defined for the animation,
   * try to use the hold time for the layer. If that's not defined, fall back to
   * the hold time for the feature.
   *
   * @private
   *
   * @param {Object} layer - Managed layer options object.
   * @param {Object} animation - Managed animation options object.
   *
   * @returns {number}
   */
  _getHoldTime(layer, animation) {
    const layerHoldTime =
      layer.holdTime !== undefined ? layer.holdTime : this.holdTime;

    return animation.holdTime !== undefined
      ? animation.holdTime
      : layerHoldTime;
  }

  /**
   * Return a valid minimum interval value. If minimum interval isn't defined for
   * the animation, try to use the minimum interval for the layer. If that's not
   * defined, fall back to the minimum interval for the feature.
   *
   * @private
   *
   * @param {Object} layer - Managed layer options object.
   * @param {Object} animation - Managed animation options object.
   *
   * @returns {number}
   */
  _getMinimumInterval(layer, animation) {
    const layerMinimumInterval =
      layer.minimumInterval !== undefined
        ? layer.minimumInterval
        : this.minimumInterval;

    return animation.minimumInterval !== undefined
      ? animation.minimumInterval
      : layerMinimumInterval;
  }

  /**
   * Callback for {@link core/AnimationFeature#playNextAnimation} event. If the
   * event is emitted for a managed animation and the new queued state cannot
   * advance on its own, start a new timer promise that will advance the queue
   * once it resolves.
   *
   * @private
   *
   * @param {Object} options - Options object passed from playNextAnimation event.
   * @param {string} layerName - Name of the layer that owns the queue state.
   * @param {string} animationName - Name of the queue state animation.
   * @param {boolean} canAdvance - Whether or not the current state in the queue
   * can advance on its own.
   * @param {boolean} isQueueEnd - Whether the current state in the queue is the last
   * state in the queue.
   */
  _onNext({layerName, animationName, canAdvance, isQueueEnd}) {
    // Exit if this isn't a managed layer
    const layer = this._managedLayers[layerName];
    if (layer === undefined) {
      return;
    }

    // Exit if it isn't a managed animation
    const animation = layer.animations[animationName];
    if (animation === undefined) {
      return;
    }

    // Start a new timer for looping states that aren't the end of the queue
    if (!canAdvance && !isQueueEnd && layer.currentGesture === animationName) {
      const holdTime = this._getHoldTime(layer, animation);
      layer.holdTimer.cancel();

      // Skip to the next animation right away if hold time is zero
      if (holdTime <= 0) {
        this._host.AnimationFeature.playNextAnimation(layerName, animationName);
      }

      // Wait for the given hold time before progressing
      else {
        layer.holdTimer = Utils.wait(holdTime, {
          onFinish: () => {
            // Advance the queue to the next state
            if (layer.currentGesture === animationName) {
              this._host.AnimationFeature.playNextAnimation(
                layerName,
                animationName
              );
            }
          },
        });
      }
    }
  }

  /**
   * Callback for {@link core/AnimationFeature#stopAnimation} event. If the
   * event is emitted for a managed animation cancel the layer's stored timers.
   * If the layer is set to auto-disable set its weight to 0.
   *
   * @private
   *
   * @param {Object} options - Options object passed from playNextAnimation event.
   * @param {string} layerName - Name of the layer that owns the stopped animation.
   * @param {string} animationName - Name of the animation that was stopped.
   */
  _onStop({layerName, animationName}) {
    // Make sure the layer is managed
    const layer = this._managedLayers[layerName];
    if (layer === undefined) {
      return;
    }

    // Make sure the animation is managed
    const animation = layer.animations[animationName];
    if (animation !== undefined && animationName === layer.currentGesture) {
      layer.currentGesture = null;
      layer.playTimer = null;
      layer.holdTimer.cancel();

      // Turn off layer weight
      if (layer.autoDisable) {
        this.setLayerWeights(name => name === layerName, 0);
      }
    }
  }

  _onAnimationAdded({layerName, animationName}) {
    const layer = this._managedLayers[layerName];

    if (layer !== undefined) {
      const animation = layer.animations[animationName];

      // Register the animation as active if it is unmanaged
      if (animation === undefined) {
        this.registerAnimation(layerName, animationName);
      }
      // Mark the animation as active if it is managed
      else {
        animation.isActive = true;
      }
    }
  }

  registerLayer(name, options = {}) {
    super.registerLayer(name, {
      ...options,
      holdTimer: Deferred.resolve(),
      playTimer: null,
      currentGesture: null,
    });

    if (this._managedLayers[name].isActive) {
      this._host.AnimationFeature.getAnimations(name).forEach(anim => {
        // Automatically register all animations on the layer
        if (this._managedLayers[name].animations[anim] === undefined) {
          this.registerAnimation(
            name,
            anim,
            this._managedLayers[name].animations[anim]
          );
        }
      });
    }
  }

  registerAnimation(layerName, animationName, options = {}) {
    // Try to fall back to a default word array
    if (!(options.words instanceof Array) && !(options.words instanceof Set)) {
      options.words = DefaultGestureWords[animationName] || [];
    }

    super.registerAnimation(layerName, animationName, options);
  }

  /**
   * Create an object that maps ssml mark syntax required to play each gesture to
   * the words array associated with each gesture. Words arrays are defined at when
   * the gesture animation is registered. Gestures without associated words will
   * be excluded from the result. The resulting object can be used as an input
   * for {@link TextToSpeechUtils.autoGenerateSSMLMarks} to update a speech string
   * with the markup required to play gestures timed with their associated words.
   *
   * @returns {Object}
   */
  createGestureMap() {
    const gestureMap = {};

    Object.entries(this._managedLayers).forEach(([layerName, {animations}]) => {
      Object.entries(animations).forEach(
        ([
          animationName,
          {holdTime, minimumInterval, words, transitionTime},
        ]) => {
          // Only store gestures that have any associated words
          if (words.length) {
            const options = {
              ...(holdTime && {holdTime}),
              ...(minimumInterval && {minimumInterval}),
              ...(transitionTime && {transitionTime}),
            };
            const key = {
              feature: this.constructor.name,
              method: 'playGesture',
              args: [layerName, animationName, options],
            };

            gestureMap[JSON.stringify(key)] = words;
          }
        }
      );
    });

    return gestureMap;
  }

  /**
   * Create an array that contains ssml mark syntax required to play each gesture
   * that does not have any associated words. The resulting array can be used as
   * an input for {@link TextToSpeechUtils.autoGenerateSSMLMarks} or
   * {@link TextToSpeechUtils.addMarksToUnmarkedSentences} to update a speech
   * string with the markup required to play random gestures at each unmarked
   * sentence in the string.
   *
   * @param {Array.<string>=} layers - An array of names of managed layers to generate
   * marks for. If undefined, use all managed layers.
   *
   * @returns {Array.<string>}
   */
  createGenericGestureArray(layers) {
    const genericGestures = [];
    layers = layers || Object.keys(this._managedLayers);

    layers.forEach(layerName => {
      const layer = this._managedLayers[layerName];

      // Make sure the layer is managed
      if (!layer) {
        return;
      }

      Object.entries(layer.animations).forEach(
        ([
          animationName,
          {holdTime, minimumInterval, words, transitionTime},
        ]) => {
          // Only store gestures that don't have any associated words
          if (!words.length) {
            const options = {
              ...(holdTime && {holdTime}),
              ...(minimumInterval && {minimumInterval}),
              ...(transitionTime && {transitionTime}),
            };
            const key = JSON.stringify({
              feature: this.constructor.name,
              method: 'playGesture',
              args: [layerName, animationName, options],
            });

            if (!genericGestures.includes(key)) {
              genericGestures.push(key);
            }
          }
        }
      );
    });

    return genericGestures;
  }

  /**
   * Play a managed gesture animation.
   *
   * @param {string} layerName - The name of the layer that contains the gesture
   * animation.
   * @param {string} animationName - The name of the gesture animation.
   * @param {Object=} options - Optional gesture options.
   * @param {number=} options.holdTime - This option only applies to {@link QueueState}
   * gestures. When a QueueState gesture progresses to a looping state, this option
   * defines how many seconds should elapse before moving the queue forward. If
   * undefined, it will fall back first to the holdTime defined in the options when
   * the gesture animation was registered and then to the holdTime defined on the
   * feature.
   * @param {number=} options.minimumInterval - The minimum amount of time that
   * must have elapsed since the last time a gesture was played.
   */
  playGesture(
    layerName,
    animationName,
    {holdTime, minimumInterval, transitionTime, force = false} = {}
  ) {
    // Make sure the animation is registered
    if (
      this._managedLayers[layerName] === undefined ||
      this._managedLayers[layerName].animations[animationName] === undefined
    ) {
      this.registerAnimation(layerName, animationName, {
        holdTime,
        minimumInterval,
        transitionTime,
      });
    }

    const layer = this._managedLayers[layerName];
    const animation = layer.animations[animationName];

    // Make sure the animation is active
    if (!animation.isActive) {
      // Create warning message based on which object doesn't exist yet
      const typeName = layer.isActive ? 'animation' : 'layer';
      const message = `Skipping gesture ${animationName} on layer ${layerName} for host ${this._host.id}. No ${typeName} exists with this name yet.`;

      console.warn(message);
      return Deferred.cancel({reason: 'inactive', value: typeName});
    }

    // Check if the gesture is already playing
    const {currentGesture} = layer;
    if (currentGesture === animationName && !force) {
      const message = `Skipping gesture ${animationName} on layer ${layerName} for host ${this._host.id}. The gesture is already playing. Use options.force to force the gesture replay, which may result in a hard transition.`;

      console.warn(message);
      return Deferred.cancel({reason: 'playing', value: animationName});
    }

    // Update animation options
    if (holdTime !== undefined) {
      animation.holdTime = holdTime;
    }

    if (minimumInterval !== undefined) {
      animation.minimumInterval = minimumInterval;
    } else {
      minimumInterval = this._getMinimumInterval(layer, animation);
    }

    // Check the interval
    if (
      !force &&
      layer.playTimer !== null &&
      layer.playTimer < minimumInterval
    ) {
      console.warn(
        `Skipping gesture ${animationName} on layer ${layerName} for host ${this._host.id}. Minimum interval ${minimumInterval} has not been met.`
      );
      return Deferred.cancel({
        reason: 'minimumInterval',
        value: minimumInterval - layer.playTimer,
      });
    }

    // Play the animation
    layer.currentGesture = animationName;
    layer.playTimer = 0;
    layer.holdTimer.cancel();
    if (layer.autoDisable) {
      this.setLayerWeights(name => name === layerName, 1);
    }

    return this._host.AnimationFeature.playAnimation(
      layerName,
      animationName,
      transitionTime
    );
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Increment the timers
    Object.entries(this._managedLayers).forEach(([name, options]) => {
      if (options.isActive && !this._host.AnimationFeature.getPaused(name)) {
        options.holdTimer.execute(deltaTime);

        if (options.playTimer !== null) {
          options.playTimer += deltaTime / 1000;
        }
      }
    });
  }

  installApi() {
    /**
     * @inner
     * @namespace GestureFeature
     */
    const api = super.installApi();

    Object.assign(api, {
      /**
       * @memberof GestureFeature
       * @instance
       * @method
       * @see GestureFeature#createGestureMap
       */
      createGestureMap: this.createGestureMap.bind(this),
      /**
       * @memberof GestureFeature
       * @instance
       * @method
       * @see GestureFeature#createGenericGestureArray
       */
      createGenericGestureArray: this.createGenericGestureArray.bind(this),
      /**
       * @memberof GestureFeature
       * @instance
       * @method
       * @see GestureFeature#playGesture
       */
      playGesture: this.playGesture.bind(this),
    });
  }
}

Object.defineProperties(GestureFeature, {
  DEFAULT_LAYER_OPTIONS: {
    value: {
      ...GestureFeature.DEFAULT_LAYER_OPTIONS,
      autoDisable: true,
    },
    writable: false,
  },
  EVENT_DEPENDENCIES: {
    value: {
      ...GestureFeature.EVENT_DEPENDENCIES,
      AnimationFeature: {
        ...GestureFeature.EVENT_DEPENDENCIES.AnimationFeature,
        playNextAnimation: '_onNext',
        stopAnimation: '_onStop',
        interruptAnimation: '_onStop',
      },
    },
  },
});

export default GestureFeature;
export {DefaultGestureWords};
