// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractHostFeature from 'core/AbstractHostFeature';
import Utils from 'core/Utils';
import FreeBlendState from './state/FreeBlendState';
import SingleState from './state/SingleState';
import AnimationLayer, {LayerBlendModes} from './AnimationLayer';
import Deferred from '../Deferred';

export const AnimationTypes = {
  single: SingleState,
  freeBlend: FreeBlendState,
};

/**
 * Base class for managing animations on an object.
 */
export default class AnimationFeature extends AbstractHostFeature {
  /**
   * @private
   *
   * @param {HostObject} host - Host object that owns the feature.
   * @param {...any} args - Arguments to send to the super class constructor.
   */
  constructor(host) {
    super(host);

    this._layers = [];
    this._layerMap = {};
    this._paused = false;
  }

  /**
   * @private
   *
   * Make sure a supplied layer index is within the range of layers.
   *
   * @param {number} index
   * @param {boolean} [existing=true] - Whether the index represents and existing
   * layer or a new layer to be added.
   *
   * @returns {number=}
   */
  _validateIndex(index, existing = true) {
    // Index is invalid if there are no layers and we're checking for an existing layer index
    if (this._layers.length === 0 && existing) {
      return undefined;
    }

    const lastIndex = existing ? this._layers.length - 1 : this._layers.length;

    // Count from the end of the array for negative indices
    if (index < 0) {
      index = lastIndex + index + 1;
    }

    if (index < 0 || index > lastIndex) {
      return undefined;
    } else {
      return index;
    }
  }

  /**
   * @private
   *
   * Re-evaluate internal weight values of layers starting from the top of the
   * stack. Override layers' weights affect the values of all layers lower in the
   * stack.
   */
  _updateInternalWeights() {
    const numLayers = this._layers.length;
    let weightMultiplier = 1;

    // Update internal weight values on layers in reverse order
    for (let i = numLayers - 1; i >= 0; i--) {
      const layer = this._layers[i];
      layer.updateInternalWeight(weightMultiplier);

      // If the layer is override, update the multiplier with the remainder of the full weight
      if (layer.blendMode === LayerBlendModes.Override && layer.currentState) {
        weightMultiplier *= 1 - layer.currentState.internalWeight;
      }
    }
  }

  /**
   * @private
   *
   * Return a new instance of a SingleState.
   *
   * @param {Object} options - Options to pass to the SingleState constructor.
   * @param {string=} options.name - Name for the animation state. Names must be
   * unique for the layer the state is applied to.
   * @param {weight} [options.weight=0] - The 0-1 amount of influence the state will have.
   * @param {timeScale} [options.timeScale=1] - Factor to scale the playback speed of the
   * animation.
   * @param {number} [options.loopCount=Infinity] - Number of times the animation should
   * repeat before finishing.
   * @param {string} [options.blendMode=LayerBlendModes[DefaultLayerBlendMode]] - Type of
   * blending the animation should use.
   *
   * @returns {SingleState}
   */
  _createSingleState(options) {
    return new SingleState(options);
  }

  /**
   * @private
   *
   * Return a new instance of a FreeBlendState.
   *
   * @param {Object} options - Options to pass to the FreeBlendState constructor.
   * @param {string=} options.name - Name for the animation state. Names must be
   * unique for the layer the state is applied to.
   * @param {weight} [options.weight=0] - The 0-1 amount of influence the state will have.
   * @param {timeScale} [options.timeScale=1] - Factor to scale the playback speed of the
   * animation.
   * @param {number} [options.loopCount=Infinity] - Number of times the animation should
   * repeat before finishing.
   * @param {string} [options.blendMode=LayerBlendModes[DefaultLayerBlendMode]] - Type of
   * blending the animation should use.
   * @param {Array.<Object>} [options.blendStateOptions] - Array of options used to create the
   * blend states for this container.
   *
   * @returns {FreeBlendState}
   */
  _createFreeBlendState(options) {
    const {blendStateOptions = []} = options;

    const blendStates = [];
    blendStateOptions.forEach(blendOptions => {
      blendStates.push(
        this._createSingleState({...blendOptions, blendMode: options.blendMode})
      );
    });

    return new FreeBlendState(options, blendStates);
  }

  /**
   * @private
   *
   * Make sure the layer with the given name exists and return a unique version
   * of the animation name supplied for that layer.
   *
   * @param {string} layerName - Name of the layer to check against.
   * @param {string} animationName - Name of the animation to validate.
   *
   * @returns {string} Validated animation name.
   */
  _validateNewAnimation(layerName, animationName) {
    // Make sure the layerName is valid
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Cannot add animation to layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    // Make sure the animationName is unique
    const name = Utils.getUniqueName(animationName, layer.animations);

    if (name !== animationName) {
      console.warn(
        `Animation name ${animationName} is not unique for layer ${layer.name}. Animation will be renamed to ${name}.`
      );
    }

    return name;
  }

  /**
   * Gets whether or not all animations are paused.
   */
  get paused() {
    return this._paused;
  }

  /**
   * Gets an array of names of animation layers.
   */
  get layers() {
    return this._layers.map(layer => layer.name);
  }

  /**
   * Create and store a new animation layer.
   *
   * @param {string=} name - Name for the layer.
   * @param {index=} index - Index to insert the new layer at. If none is provided
   * it will be added to the end of the stack.
   *
   * @returns {number} Index of the new layer.
   */
  addLayer(name = 'NewLayer', options = {}, index) {
    const numLayers = this._layers.length;
    let layerIndex = index;

    // Make sure the given index is within the range of layers
    if (index === undefined || index === -1) {
      layerIndex = this._layers.length;
    } else {
      layerIndex = this._validateIndex(index, false);

      if (layerIndex === undefined) {
        // Insert at the beginning if the user passed in a negative index
        if (index < 0) {
          layerIndex = 0;
        }
        // Otherwise append to the end
        else {
          layerIndex = this._layers.length;
        }

        console.warn(
          `Index ${index} is invalid for host ${this._host.id}. New layer will be added at the closest valid index: ${layerIndex}.`
        );
      }
    }

    // Make sure the layer name is unique
    const layerName = Utils.getUniqueName(name, Object.keys(this._layerMap));

    if (name !== layerName) {
      console.warn(
        `Layer name ${name} is not unique. New layer will be added with the name ${layerName}.`
      );
    }

    const layer = new AnimationLayer({...options, name: layerName});
    this._layerMap[layerName] = layer;

    if (layerIndex === numLayers) {
      this._layers.push(layer);
    } else {
      this._layers.splice(layerIndex, 0, layer);
    }

    // Notify that a layer has been added to the feature
    const eventData = {name: layerName, index: layerIndex};
    this.emit(this.constructor.EVENTS.addLayer, eventData);

    return eventData;
  }

  /**
   * Remove an animation layer from the stack. Animations on this layer will no
   * longer be evaluated.
   *
   * @param {string} name - Name for the layer to remove.
   *
   * @returns {boolean} Whether or not removal was successful.
   */
  removeLayer(name) {
    const layer = this._layerMap[name];

    if (layer === undefined) {
      console.warn(
        `Did not remove layer ${name} from host ${this._host.id}. No layer exists with this name.`
      );
      return false;
    }

    layer.discard();

    const index = this._layers.indexOf(layer);
    this._layers.splice(index, 1);
    delete this._layerMap[name];

    // Notify that a layer has been removed from the feature
    this.emit(this.constructor.EVENTS.removeLayer, {name, index});

    return true;
  }

  /**
   * Re-order the layer stack so that the layer with the given name is positioned
   * at the given index.
   *
   * @param {string} name - Name of the layer to move.
   * @param {number} index - New index to position the layer at.
   *
   * @returns {number} The new index of the layer
   */
  moveLayer(name, index) {
    // Make sure the name is valid
    const layer = this._layerMap[name];

    if (layer === undefined) {
      throw new Error(
        `Cannot move layer ${name} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    // Make sure the index falls in the range of existing layers
    const layerIndex = this._validateIndex(index, true);
    const lastIndex = this._layers.length - 1;

    if (layerIndex === undefined) {
      throw new Error(
        `Cannot move layer ${name} from host ${this._host.id} to index ${index}. Index must be in the 0 - ${lastIndex} range.`
      );
    }

    const currentIndex = this._layers.indexOf(layer);
    if (currentIndex === layerIndex) {
      return;
    }

    // Remove from the current position
    this._layers.splice(currentIndex, 1);

    // Insert at the new position
    if (layerIndex === lastIndex) {
      this._layers.push(layer);
    } else {
      this._layers.splice(layerIndex, 0, layer);
    }

    return layerIndex;
  }

  /**
   * Update the name of a layer. Names must be unique, if the new name is not
   * unique it will have trailing numbers appended until it is unique.
   *
   * @param {string} currentName - Current name of the layer.
   * @param {string} newName - New name to set on the layer.
   *
   * @returns {string} The new name of the layer
   */
  renameLayer(currentName, newName) {
    // Make sure the name is valid
    const layer = this._layerMap[currentName];

    if (layer === undefined) {
      throw new Error(
        `Cannot rename layer ${currentName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    // Make sure the layer name is unique
    const name = Utils.getUniqueName(newName, Object.keys(this._layerMap));

    if (name !== newName) {
      console.warn(
        `Layer name ${newName} is not unique. Layer will be renamed to ${name}.`
      );
    }

    delete this._layerMap[currentName];
    this._layerMap[name] = layer;
    layer.name = name;

    // Notify that a layer has been renamed on the feature
    this.emit(this.constructor.EVENTS.renameLayer, {
      oldName: currentName,
      newName: name,
    });

    return name;
  }

  /**
   * Return the weight of an animation layer.
   *
   * @param {string} name - Name of the layer to return weight from.
   *
   * @returns {number}
   */
  getLayerWeight(name) {
    // Make sure the name is valid
    const layer = this._layerMap[name];

    if (layer === undefined) {
      throw new Error(
        `Cannot get weight on layer ${name} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.weight;
  }

  /**
   * Update the weight of an animation layer.
   *
   * @param {string} name - The name of the layer to update.
   * @param {number} weight - The weight value to set on the layer. This number
   * should be in the 0-1 range.
   * @param {number=} seconds - The number of seconds it should take to reach the
   * new weight. Default is zero and will set immediately.
   * @param {Function=} easingFn - The easing function to use while interpolating
   * the weight. Default is Easing.Linear.InOut.
   *
   * @returns {Deferred} A promise that will resolve once the layer's weight reaches
   * the target value.
   */
  setLayerWeight(name, weight, seconds, easingFn) {
    // Make sure the name is valid
    const layer = this._layerMap[name];

    if (layer === undefined) {
      const e = `Cannot set weight on layer ${name} from host ${this._host.id}. No layer exists with this name.`;
      return Deferred.reject(e);
    }

    return layer.setWeight(weight, seconds, easingFn);
  }

  /**
   * Returns the names of blend states in an animation in a layer.
   *
   * @param {string} layerName - Name of the layer containing the animation containing
   * the blend state to update.
   * @param {string} animationName - Name of the animation containing the blend state
   * to update.
   *
   * @returns {Array.<string>} - Names of blend states.
   */
  getAnimationBlendNames(layerName, animationName) {
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Cannot get blend names on layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.getAnimationBlendNames(animationName);
  }

  /**
   * Update the weight for a blend state in an animation in a layer.
   *
   * @param {string} layerName - Name of the layer containing the animation containing
   * the blend state to update.
   * @param {string} animationName - Name of the animation containing the blend state
   * to update.
   * @param {string} blendName - Name of the blend state to update.
   * @param {number} weight - Weight value to set on the animation. This number shoudld be
   * in the 0-1 range.
   * @param {number=} seconds - Number of seconds it should take to reach the new weight.
   * Default is zero and will set immediately.
   * @param {Function=} easingFn - Easing function to use while interpolating the new
   * weight. Default is Easing.Linear.InOut.
   *
   * @returns {Deferred} - Promise that will resolve once the animation's weight reaches
   * the target value.
   */
  setAnimationBlendWeight(
    layerName,
    animationName,
    blendName,
    weight,
    seconds,
    easingFn
  ) {
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      const e = `Cannot set blend weight on layer ${layerName} from host ${this._host.id}. No layer exists with this name.`;
      return Deferred.reject(e);
    }

    return layer.setAnimationBlendWeight(
      animationName,
      blendName,
      weight,
      seconds,
      easingFn
    );
  }

  /**
   * Returns the weight for a blend state in an animation in a layer.
   *
   * @param {string} layerName - Name of the layer containing the animation containing
   * the blend state to update.
   * @param {string} animationName - Name of the animation containing the blend state
   * to update.
   * @param {string} blendName - Name of the blend state to update.
   *
   * @returns {number} - Weight of the blend state.
   */
  getAnimationBlendWeight(layerName, animationName, blendName) {
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Cannot get blend weight on layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.getAnimationBlendWeight(animationName, blendName);
  }

  /**
   * Pause weight interpolation animation on a layer with the given name.
   *
   * @param {string} name - Name of the layer to pause.
   *
   * @returns {boolean} Whether or not there was an existing interpolation to pause.
   */
  pauseLayerWeight(name) {
    // Make sure the name is valid
    const layer = this._layerMap[name];

    if (layer === undefined) {
      throw new Error(
        `Cannot pause weight interpolation on layer ${name} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.pauseWeight();
  }

  /**
   * Resume weight interpolation animation on a layer with the given name.
   *
   * @param {string} name - Name of the layer to resume.
   *
   * @returns {Deferred}
   */
  resumeLayerWeight(name) {
    // Make sure the name is valid
    const layer = this._layerMap[name];

    if (layer === undefined) {
      const e = `Cannot resume weight interpolation on layer ${name} from host ${this._host.id}. No layer exists with this name.`;
      return Deferred.reject(e);
    }

    return layer.resumeWeight();
  }

  /**
   * Pause current animation and weight interpolation animation on a layer with
   * the given name.
   *
   * @param {string} name - Name of the layer to pause.
   *
   * @returns {boolean} Whether or not there was an existing interpolation or
   * current animation to pause.
   */
  pauseLayer(name) {
    // Make sure the name is valid
    const layer = this._layerMap[name];

    if (layer === undefined) {
      throw new Error(
        `Cannot pause layer ${name} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.pause();
  }

  /**
   * Resume current animation and weight interpolation animation on a layer with
   * the given name.
   *
   * @param {string} name - Name of the layer to resume.
   *
   * @returns {Deferred}
   */
  resumeLayer(name) {
    // Make sure the name is valid
    const layer = this._layerMap[name];

    if (layer === undefined) {
      const e = `Cannot resume layer ${name} from host ${this._host.id}. No layer exists with this name.`;
      return Deferred.reject(e);
    }

    return layer.resume();
  }

  /**
   * Return whether or not the animation layer with the given name is currently
   * transitioning between animations.
   *
   * @param {string} layerName - Name of the layer to check.
   *
   * @returns {boolean}
   */
  getTransitioning(layerName) {
    // Make sure the layerName is valid
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Get transitioning on layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.isTransitioning;
  }

  /**
   * Return an array of the names of all states the layer with the given name controls.
   *
   * @param {string} layerName - Name of the layer to search.
   *
   * @returns {Array.<string>}
   */
  getAnimations(layerName) {
    // Make sure the layerName is valid
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Get animations on layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.animations;
  }

  /**
   * Return the name of the state currently active on the layer with the given name.
   * Return null if there is no current animation for the layer.
   *
   * @param {string} layerName - Name of the layer.
   *
   * @returns {(string|null)}
   */
  getCurrentAnimation(layerName) {
    // Make sure the layerName is valid
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Get current animation on layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.currentAnimation;
  }

  /**
   * Return the type name of the given animation.
   *
   * @param {string} layerName - Name of the layer that contains the animation.
   * @param {string} animationName - Name of the animation to check.
   *
   * @returns {string}
   */
  getAnimationType(layerName, animationName) {
    // Make sure the layerName is valid
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Get animation type on layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    const state = layer.getState(animationName);

    if (state === undefined) {
      throw new Error(
        `Get animation type for animation ${animationName} on layer ${layerName} from host ${this._host.id}. No animation exists with this name.`
      );
    }

    const {constructor} = state;

    return Object.keys(AnimationTypes).find(
      typeName => AnimationTypes[typeName] === constructor
    );
  }

  /**
   * Add a new animation to an animation layer.
   *
   * @param {string} layerName - Name of the layer to add the animation to.
   * @param {string} animationName - Name to use when calling the animation.
   * @param {Object=} options - Options to pass to the constructor for the new
   * SingleState animation.
   *
   * @returns {string} The name of the animation that was added
   */
  addAnimation(
    layerName,
    animationName,
    animationType = SingleState,
    options = {}
  ) {
    options.name = this._validateNewAnimation(layerName, animationName);

    // Make sure the animation type is valid
    if (!Object.values(AnimationTypes).includes(animationType)) {
      throw new Error(
        `Cannot add animation ${animationName} to layer ${layerName} on host ${this._host.id}. Invalid animation type.`
      );
    }

    const layer = this._layerMap[layerName];
    options.blendMode = layer.blendMode;
    const state = this[`_create${animationType.name}`](options);

    const name = layer.addAnimation(state);

    // Notify that an animation has been added to the feature
    this.emit(this.constructor.EVENTS.addAnimation, {
      layerName,
      animationName: name,
    });

    return name;
  }

  /**
   * Remove an animation from an animation layer.
   *
   * @param {string} layerName - Name of the layer to remove the animation from.
   * @param {string} name - Name of the animation to remove.
   *
   * @returns {boolean}
   */
  removeAnimation(layerName, animationName) {
    // Make sure the name is valid
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Cannot remove animation from layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    const removed = layer.removeAnimation(animationName);

    // Notify that an animation has been removed from the feature
    if (removed === true) {
      this.emit(this.constructor.EVENTS.removeAnimation, {
        layerName,
        animationName,
      });
    }

    return removed;
  }

  /**
   * Update the name of an animation. Names must be unique on each layer, if the new
   * name is not unique it will have trailing numbers appended until it is unique.
   *
   * @param {string} layerName - Name of the layer that contains the animation that
   * will be renamed,
   * @param {string} currentAnimationName - Current name of the animation.
   * @param {string} newAnimationName - New name to set on the animation.
   *
   * @returns {string} The new name of the animation
   */
  renameAnimation(layerName, currentAnimationName, newAnimationName) {
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Cannot rename animation ${currentAnimationName} on layer ${layerName} for host ${this._host.id}. No layer exists with this name.`
      );
    }

    const name = layer.renameAnimation(currentAnimationName, newAnimationName);

    // Notify that an animation has been renamed on the feature
    this.emit(this.constructor.EVENTS.renameAnimation, {
      layerName,
      oldName: currentAnimationName,
      newName: name,
    });

    return name;
  }

  /**
   * Pause the currently playing animation and play a new animation from the beginning.
   *
   * @param {string} layerName - Name of the layer that contains the animation.
   * @param {string} animationName - Name of the animation state to play.
   * @param {number=} seconds - The number of seconds it should take to transition
   * to the new animation. Default is zero and will set immediately.
   * @param {Function=} easingFn - The easing function to use while transitioning
   * between animations. Default is Easing.Linear.InOut.
   *
   * @returns {Deferred}
   */
  playAnimation(layerName, animationName, seconds, easingFn) {
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      const e = `Cannot play animation ${animationName} on layer ${layerName} for host ${this._host.id}. No layer exists with this name.`;
      return Deferred.reject(e);
    }

    // Notify that a new animation has begun
    this.emit(this.constructor.EVENTS.playAnimation, {
      layerName,
      animationName,
    });

    return layer.playAnimation(
      animationName,
      seconds,
      easingFn,
      () => {
        // Notify that an animation has stopped
        this.emit(this.constructor.EVENTS.stopAnimation, {
          layerName,
          animationName,
        });
      },
      undefined,
      () => {
        // Notify that an animation has been interrupted
        this.emit(this.constructor.EVENTS.interruptAnimation, {
          layerName,
          animationName,
        });
      }
    );
  }

  /**
   * Pause the current animation on a layer.
   *
   * @param {string} name - Name of the layer to pause.
   *
   * @returns {boolean} Whether or not an animation was successfully paused.
   */
  pauseAnimation(name) {
    const layer = this._layerMap[name];

    if (layer === undefined) {
      console.warn(
        `Did not pause animation on layer ${name} for host ${this._host.id}. No layer exists with this name.`
      );
      return false;
    }

    const paused = layer.pauseAnimation();

    // Notify that an animation was paused
    if (paused) {
      const animationName = layer.currentAnimation;
      this.emit(this.constructor.EVENTS.pauseAnimation, {
        layerName: name,
        animationName,
      });
    }

    return paused;
  }

  /**
   * Pause the currently playing animation and play a new animation from where it
   * last left off.
   *
   * @param {string} layerName - Name of the layer that contains the animation.
   * @param {string=} animationName - Name of the animation state to resume. Defaults
   * to the name of the current animation for the layer.
   * @param {number=} seconds - The number of seconds it should take to transition
   * to the new animation. Default is zero and will set immediately.
   * @param {Function=} easingFn - The easing function to use while transitioning
   * between animations. Default is Easing.Linear.InOut.
   *
   * @returns {Deferred}
   */
  resumeAnimation(layerName, animationName, seconds, easingFn) {
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      const e = `Cannot resume animation ${animationName} on layer ${layerName} for host ${this._host.id}. No layer exists with this name.`;
      return Deferred.reject(e);
    }

    // Notify that an animation was resumed
    this.emit(this.constructor.EVENTS.resumeAnimation, {
      layerName,
      animationName,
    });

    return layer.resumeAnimation(
      animationName,
      seconds,
      easingFn,
      () => {
        // Notify that an animation has stopped
        this.emit(this.constructor.EVENTS.stopAnimation, {
          layerName,
          animationName,
        });
      },
      undefined,
      () => {
        // Notify that an animation has been interrupted
        this.emit(this.constructor.EVENTS.interruptAnimation, {
          layerName,
          animationName,
        });
      }
    );
  }

  /**
   * Stop the current animation on a layer. Stop rewinds the animation to the
   * beginning and prevents it from progressing forward.
   *
   * @param {string} name - Name of the layer that contains the animation.
   *
   * @returns {boolean} Whether or not an animation was successfully stopped.
   */
  stopAnimation(name) {
    const layer = this._layerMap[name];

    if (layer === undefined) {
      console.warn(
        `Did not stop animation on layer ${name} for host ${this._host.id}. No layer exists with this name.`
      );
      return false;
    }

    return layer.stopAnimation();
  }

  /**
   * Pause current animation and weight interpolation animation on all layers.

   * @returns {boolean} Whether or not there was an existing interpolation or
   * current animations to pause.
   */
  pause() {
    this._paused = true;

    return this._layers.some(l => l.pause());
  }

  /**
   * Resume current animation and weight interpolation animation on all layers.

   * @returns {boolean} Whether or not there was an existing interpolation or
   * current animations to resume.
   */
  resume() {
    this._paused = false;

    return this._layers.some(l => l.resume());
  }

  /**
   * Add a namespace to the host to contain anything from the feature that users
   * of the host need access to.
   */
  installApi() {
    const api = super.installApi();

    Object.defineProperties(api, {
      paused: {
        get: () => this.paused,
      },

      layers: {
        get: () => this.layers,
      },
    });

    Object.assign(api, {
      addLayer: this.addLayer.bind(this),
      removeLayer: this.removeLayer.bind(this),
      moveLayer: this.moveLayer.bind(this),
      renameLayer: this.renameLayer.bind(this),

      getLayerWeight: this.getLayerWeight.bind(this),
      setLayerWeight: this.setLayerWeight.bind(this),
      pauseLayerWeight: this.pauseLayerWeight.bind(this),
      resumeLayerWeight: this.resumeLayerWeight.bind(this),
      pauseLayer: this.pauseLayer.bind(this),
      resumeLayer: this.resumeLayer.bind(this),

      getTransitioning: this.getTransitioning.bind(this),
      getAnimations: this.getAnimations.bind(this),
      getCurrentAnimation: this.getCurrentAnimation.bind(this),
      getAnimationType: this.getAnimationType.bind(this),
      addAnimation: this.addAnimation.bind(this),
      removeAnimation: this.removeAnimation.bind(this),
      renameAnimation: this.renameAnimation.bind(this),

      getAnimationBlendNames: this.getAnimationBlendNames.bind(this),
      getAnimationBlendWeight: this.getAnimationBlendWeight.bind(this),
      setAnimationBlendWeight: this.setAnimationBlendWeight.bind(this),

      playAnimation: this.playAnimation.bind(this),
      pauseAnimation: this.pauseAnimation.bind(this),
      resumeAnimation: this.resumeAnimation.bind(this),
      stopAnimation: this.stopAnimation.bind(this),

      pause: this.pause.bind(this),
      resume: this.resume.bind(this),
    });
  }

  /**
   * Update each animation layer.
   *
   * @param {number} deltaTime - Time since the last update.
   */
  update(deltaTime) {
    if (!this._layers.length) {
      return;
    }

    if (this._paused) {
      deltaTime = 0;
    }

    // Re-evaluate internal weights for layers
    this._updateInternalWeights();

    // Update layers
    this._layers.forEach(layer => {
      layer.update(deltaTime);
    });

    super.update(deltaTime);
  }

  discard() {
    this._layers.forEach(layer => {
      layer.discard();
    });

    delete this._layers;
    delete this._layerMap;

    super.discard();
  }
}

Object.defineProperty(AnimationFeature, 'EVENTS', {
  value: {
    ...Object.getPrototypeOf(AbstractHostFeature).EVENTS,
    addLayer: 'onAddLayerEvent',
    removeLayer: 'onRemoveLayerEvent',
    renameLayer: 'onRenameLayerEvent',
    addAnimation: 'onAddAnimationEvent',
    removeAnimation: 'onRemovedAnimationEvent',
    renameAnimation: 'onRenameAnimationEvent',
    playAnimation: 'onPlayEvent',
    pauseAnimation: 'onPauseEvent',
    resumeAnimation: 'onResumeEvent',
    interruptAnimation: 'onInterruptEvent',
    stopAnimation: 'onStopEvent',
  },
});
