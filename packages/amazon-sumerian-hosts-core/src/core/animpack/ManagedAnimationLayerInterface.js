// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import AnimationFeatureDependentInterface from './AnimationFeatureDependentInterface';

/**
 * Class factory interface for that keeps track of layers and animations on a host.
 * Tracked assets are marked as inactive until layers and animations with matching
 * names are detected as present on the host.
 *
 * @interface
 * @extends AnimationFeatureDependentInterface
 *
 * @property {Object} DEFAULT_LAYER_OPTIONS - Default options to use when executing
 * {@link AnimationLayer} methods.
 * @property {number} [DEFAULT_LAYER_OPTIONS.blendTime=0.5] - Default time in seconds
 * to use when executing {@link AnimationLayer.setBlendWeight}.
 * @property {Object} [DEFAULT_LAYER_OPTIONS.animations={}] - Maps animation names
 * to default options objects to use for managed animations.
 */
class ManagedAnimationLayerInterface extends AnimationFeatureDependentInterface {
  /**
   * Start tracking keeping track of whether a layer with the given name is present
   * on the host.
   *
   * @param {string} name - Name of the layer to keep track of.
   * @param {Object=} options - Options for the layer.
   * @param {number=} options.blendTime - Default amount of time to use when
   * manipulating layer weights on this layer.
   * @param {Function=} options.easingFn - Default easing function to use when
   * manipulating layer weights on this layer.
   * @param {Object=} options.animations - Animations to keep track of on the layer.
   * Animations are represented as key/value pairs of animation names and their
   * options.
   */
  registerLayer(name, options = {}) {}

  /**
   * Start tracking keeping track of whether an animation with the given name is
   * present on the host.
   *
   * @param {string} layerName - Name of the layer that will own the animation.
   * @param {string} animationName - Name of the animation to keep track of.
   * @param {Object=} options - Options for the animation.
   */
  registerAnimation(layerName, animationName, options = {}) {}

  /**
   * Set layer weights on tracked layers.
   *
   * @param {Function=} nameFilter - Predicate function to test each tracked layer
   * with. By default all layers will pass.
   * @param {number} weight - Weight value to set on layers.
   * @param {number=} seconds - Number of seconds it will take to reach the weight
   * on each layer. If undefined, each layers' blendTime option is used.
   * @param {Function=} easingFn - Easing function to use when setting weight
   * on each layer. If undefined, each layers' easingFn option is used.
   */
  setLayerWeights(nameFilter = () => true, weight, seconds, easingFn) {}

  /**
   * Set all tracked layers' weights to 1.
   *
   * @param {number=} seconds - Number of seconds it will take to reach the weight
   * on each layer. If undefined, each layers' blendTime option is used.
   * @param {Function=} easingFn - Easing function to use when setting weight
   * on each layer. If undefined, each layers' easingFn option is used.
   */
  enable(seconds, easingFn) {}

  /**
   * Set all tracked layers' weights to 0.
   *
   * @param {number=} seconds - Number of seconds it will take to reach the weight
   * on each layer. If undefined, each layers' blendTime option is used.
   * @param {Function=} easingFn - Easing function to use when setting weight
   * on each layer. If undefined, each layers' easingFn option is used.
   */
  disable(seconds, easingFn) {}

  /**
   * Creates a class that implements {@link ManagedAnimationLayerInterface}
   * and extends a specified base class.
   *
   * @param {Class} BaseClass - The class to extend.
   *
   * @return {Class} A class that extends `BaseClass` and implements {@link ManagedAnimationLayerInterface}.
   */
  static Mixin(BaseClass) {
    const ParentClass = AnimationFeatureDependentInterface.Mixin(BaseClass);
    const ManagedAnimationLayerMixin = class extends ParentClass {
      constructor(...args) {
        super(...args);

        this._managedLayers = {};
      }

      _onFeatureAdded(typeName) {
        super._onFeatureAdded(typeName);

        if (typeName !== 'AnimationFeature') {
          return;
        }

        this._managedLayers = this._managedLayers || {};

        // Detect new layers
        this._host.AnimationFeature.layers.forEach(name => {
          this._onLayerAdded({name});
        });
      }

      _onFeatureRemoved(typeName) {
        super._onFeatureRemoved(typeName);

        if (typeName !== 'AnimationFeature') {
          return;
        }

        this._managedLayers = this._managedLayers || {};

        // Deactivate the layers
        Object.keys(this._managedLayers).forEach(name => {
          this._onLayerRemoved({name});
        });
      }

      _onLayerAdded({name}) {
        // Mark the layer as active if it is managed
        if (this._managedLayers[name] !== undefined) {
          this._managedLayers[name].isActive = true;

          // Detect new animations
          this._host.AnimationFeature.getAnimations(name).forEach(animName => {
            this._onAnimationAdded({layerName: name, animationName: animName});
          });
        }
      }

      _onLayerRemoved({name}) {
        // Deactivate the layer if it is managed
        if (this._managedLayers[name] !== undefined) {
          this._managedLayers[name].isActive = false;

          // Deactivate the animations
          Object.keys(this._managedLayers[name].animations).forEach(
            animName => {
              this._onAnimationRemoved({
                layerName: name,
                animationName: animName,
              });
            }
          );
        }
      }

      _onLayerRenamed({oldName, newName}) {
        const layerOptions = this._managedLayers[oldName];

        // Replace the layer key with the new name
        if (layerOptions !== undefined) {
          delete this._managedLayers[oldName];
          this._managedLayers[newName] = layerOptions;
        }
      }

      _onAnimationAdded({layerName, animationName}) {
        // Mark the animation as active if it is managed
        if (
          this._managedLayers[layerName] !== undefined &&
          this._managedLayers[layerName].animations[animationName] !== undefined
        ) {
          this._managedLayers[layerName].animations[
            animationName
          ].isActive = true;
        }
      }

      _onAnimationRemoved({layerName, animationName}) {
        // Deactivate the animation if it is managed
        if (
          this._managedLayers[layerName] !== undefined &&
          this._managedLayers[layerName].animations[animationName] !== undefined
        ) {
          this._managedLayers[layerName].animations[
            animationName
          ].isActive = false;
        }
      }

      _onAnimationRenamed({layerName, oldName, newName}) {
        if (
          this._managedLayers[layerName] !== undefined &&
          this._managedLayers[layerName].animations[oldName] !== undefined
        ) {
          // Replace the animation key with the new name
          const animOptions = this._managedLayers[layerName].animations[
            oldName
          ];
          delete this._managedLayers[layerName].animations[oldName];
          this._managedLayers[layerName].animations[newName] = animOptions;
        }
      }

      registerLayer(name, options = {}) {
        // Start with default options for each new layer
        if (this._managedLayers[name] === undefined) {
          this._managedLayers[name] = {
            ...this.constructor.DEFAULT_LAYER_OPTIONS,
            animations: {},
          };
        }

        // Update all options except animations
        const layerOptions = this._managedLayers[name];
        options = {...options};
        const animationOptions = options.animations || {};
        delete options.animations;
        Object.assign(layerOptions, options);

        // Check whether the layer can be manipulated now
        layerOptions.isActive =
          this._host.AnimationFeature !== undefined &&
          this._host.AnimationFeature.layers.includes(name);

        // Register the animations
        Object.entries(animationOptions).forEach(([animName, animOptions]) => {
          this.registerAnimation(name, animName, animOptions);
        });
      }

      registerAnimation(layerName, animationName, options = {}) {
        // Register the layer if it hasn't been registered yet
        if (this._managedLayers[layerName] === undefined) {
          this.registerLayer(layerName);
        }

        // Update animation options
        const animOptions =
          this._managedLayers[layerName].animations[animationName] || {};
        Object.assign(animOptions, options);
        this._managedLayers[layerName].animations[animationName] = animOptions;

        // Check whether the animation can be manipulated now
        this._managedLayers[layerName].animations[animationName].isActive =
          this._managedLayers[layerName].isActive &&
          this._host.AnimationFeature.getAnimations(layerName).includes(
            animationName
          );
      }

      setLayerWeights(nameFilter = () => true, weight, seconds, easingFn) {
        const layerNames = Object.keys(this._managedLayers).filter(nameFilter);

        layerNames.forEach(name => {
          const layerOptions = this._managedLayers[name];

          if (layerOptions.isActive) {
            this._host.AnimationFeature.setLayerWeight(
              name,
              weight,
              seconds !== undefined ? seconds : layerOptions.blendTime,
              easingFn || layerOptions.easingFn
            );
          }
        });
      }

      enable(seconds, easingFn) {
        this.setLayerWeights(undefined, 1, seconds, easingFn);
      }

      disable(seconds, easingFn) {
        this.setLayerWeights(undefined, 0, seconds, easingFn);
      }

      installApi() {
        const api = super.installApi();

        Object.assign(api, {
          registerLayer: this.registerLayer.bind(this),
          registerAnimation: this.registerAnimation.bind(this),
          setLayerWeights: this.setLayerWeights.bind(this),
          enable: this.enable.bind(this),
          disable: this.disable.bind(this),
        });

        return api;
      }
    };

    Object.defineProperties(ManagedAnimationLayerMixin, {
      DEFAULT_LAYER_OPTIONS: {
        value: ManagedAnimationLayerInterface.DEFAULT_LAYER_OPTIONS,
        writable: false,
      },
    });

    return ManagedAnimationLayerMixin;
  }
}

Object.defineProperties(ManagedAnimationLayerInterface, {
  DEFAULT_LAYER_OPTIONS: {
    value: {blendTime: 0.5, animations: {}},
    writable: false,
  },
});

export default ManagedAnimationLayerInterface;
