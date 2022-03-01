// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import AbstractHostFeature from '../AbstractHostFeature';
import Utils from '../Utils';
import QueueState from './state/QueueState';
import FreeBlendState from './state/FreeBlendState';
import Blend1dState from './state/Blend1dState';
import Blend2dState from './state/Blend2dState';
import SingleState from './state/SingleState';
import RandomAnimationState from './state/RandomAnimationState';
import AnimationLayer, {LayerBlendModes} from './AnimationLayer';
import Deferred from '../Deferred';

/**
 * Enum for animation state classes.
 *
 * @readonly
 * @enum {Class}
 */
export const AnimationTypes = {
  single: SingleState,
  freeBlend: FreeBlendState,
  queue: QueueState,
  randomAnimation: RandomAnimationState,
  blend1d: Blend1dState,
  blend2d: Blend2dState,
};

/**
 * Feature for managing animations on an object.
 *
 * @extends AbstractHostFeature
 * @alias core/AnimationFeature
 *
 * @property {Object} EVENTS - Built-in messages that the feature emits. When the
 * feature is added to a {@link core/HostObject}, event names will be prefixed by the
 * name of the feature class + '.'.
 * @property {string} [EVENTS.addLayer=onAddLayerEvent] - Message that is emitted after
 * [addLayer]{@link core/AnimationFeature#addLayer} has been successfully executed.
 * An object representing the name of the layer that was added and its index in
 * the layer stack with the signature {name: string, index: number} is supplied
 * as an argument to listener functions.
 * @property {string} [EVENTS.removeLayer=onRemoveLayerEvent] - Message that is
 * emitted after [removeLayer]{@link core/AnimationFeature#removeLayer} has been
 * successfully executed. An object representing the name of the layer that was
 * removed and its index in the layer stack with the signature {name: string, index: number}
 * is supplied as an argument to listener functions.
 * @property {string} [EVENTS.renameLayer=onRenameLayerEvent] - Message that is
 * emitted after [renameLayer]{@link core/AnimationFeature#renameLayer} has been
 * successfully executed. An object representing the original name of the layer
 * that was renamed and its updated name with the signature {oldName: string, newName: string}
 * is supplied as an argument to listener functions.
 * @property {string} [EVENTS.addAnimation=onAddAnimationEvent] - Message that is
 * emitted after [addAnimation]{@link core/AnimationFeature#addAnimation} has been
 * successfully executed. An object representing the name of the layer that the
 * animation was added to and the name of the animation that was added with the
 * signature {layerName: string, animationName: string} is supplied as an argument
 * to listener functions.
 * @property {string} [EVENTS.removeAnimation=onRemovedAnimationEvent] - Message
 * that is emitted after [removeAnimation]{@link core/AnimationFeature#removeAnimation}
 * has been successfully executed. An object representing the name of the layer
 * that the animation was removed from and the name of the animation that was removed
 * with the signature {layerName: string, animationName: string} is supplied as
 * an argument to listener functions.
 * @property {string} [EVENTS.renameAnimation=onRenameAnimationEvent] - Message
 * that is emitted after [renameAnimation]{@link core/AnimationFeature#renameAnimation}
 * has been successfully executed. An object representing the name of the layer
 * that contains the animation that was renamed, the original name of the animation
 * that was renamed and its updated name with the signature {layerName: string, oldName: string, newName: string}
 * is supplied as an argument to listener functions.
 * @property {string} [EVENTS.play=onPlayEvent] - Message that is emitted after
 * each call to [play]{@link core/AnimationFeature#playAnimation}. An object representing
 * the name of the layer contains the animation that was played and the name of
 * the animation that was played with the signature {layerName: string, animationName: string}
 * is supplied as an argument to listener functions.
 * @property {string} [EVENTS.pause=onPauseEvent] - Message that is emitted after
 * each call to [pause]{@link core/AnimationFeature#pauseAnimation}. An object representing
 * the name of the layer contains the animation that was paused and the name of
 * the animation that was paused with the signature {layerName: string, animationName: string}
 * is supplied as an argument to listener functions.
 * @property {string} [EVENTS.resume=onResumeEvent] - Message that is emitted after
 * each call to [resume]{@link core/AnimationFeature#resumeAnimation}. An object representing
 * the name of the layer contains the animation that was resumed and the name of
 * the animation that was resumed with the signature {layerName: string, animationName: string}
 * is supplied as an argument to listener functions.
 * @property {string} [EVENTS.interrupt=onInterruptEvent] - Message that is emitted
 * if there is a current speech in progress and [play]{@link core/AnimationFeature#playAnimation}
 * or [resume]{@link core/AnimationFeature#resumeAnimation} are executed for a new speech.
 * An object representing the name of the layer contains the animation that was
 * interrupted and the name of the animation that was interrupted with the signature
 * {layerName: string, animationName: string} is supplied as an argument to listener
 * functions.
 * @property {string} [EVENTS.stop=onStopEvent] - Message that is emitted after
 * each call to [stop]{@link core/AnimationFeature#stopAnimation} and when a speech reaches
 * the end of playback. An object representing
 * the name of the layer contains the animation that was stopped and the name of
 * the animation that was stopped with the signature {layerName: string, animationName: string}
 * is supplied as an argument to listener functions.
 */
class AnimationFeature extends AbstractHostFeature {
  /**
   * @constructor
   *
   * @param {core/HostObject} host - Host object that owns the feature.
   */
  constructor(host) {
    super(host);

    this._layers = [];
    this._layerMap = {};
    this._paused = false;
  }

  /**
   * Make sure a supplied layer index is within the range of layers.
   *
   * @private
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
   * Re-evaluate internal weight values of layers starting from the top of the
   * stack. Override layers' weights affect the values of all layers lower in the
   * stack.
   *
   * @private
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
   * Return a new instance of a SingleState.
   *
   * @private
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
   * @returns {core/SingleState}
   */
  _createSingleState(options) {
    return new SingleState(options);
  }

  /**
   * Return a new instance of a FreeBlendState.
   *
   * @private
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
   * Return a new instance of a QueueState.
   *
   * @private
   *
   * @param {Object} options - Options to pass to the QueueState constructor.
   * @param {string=} options.name - Name for the animation state. Names must be
   * unique for the layer the state is applied to.
   * @param {number} [options.weight=0] - The 0-1 amount of influence the state will have.
   * @param {number=} options.transitionTime - The amount of time it takes to transition
   * between queued states.
   * @param {string} [options.blendMode=LayerBlendModes[DefaultLayerBlendMode]] - Type of
   * blending the animation should use.
   * @param {Array.<Object>} [options.queueOptions] - Array of options used to create the
   * queue states for this container.
   *
   * @returns {QueueState}
   */
  _createQueueState(options) {
    const {queueOptions = []} = options;

    const queueStates = queueOptions.map(queueOption =>
      this._createSingleState({
        transitionTime: options.transitionTime,
        ...queueOption,
        blendMode: options.blendMode,
      })
    );

    return new QueueState(options, queueStates);
  }

  /**
   * Return a new instance of a Blend1dState.
   *
   * @private
   *
   * @param {Object} options - Options to pass to the Blend1dState constructor.
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
   * @param {Array.<number>} [options.blendThresholds] - Array of numbers used to set the
   * thresholds for each blend state in this container.
   * @param {Array.<boolean>} [options.blendMatchPhases=[]] - Optional array of booleans used to
   * set whether or not each blend state in this container will match phases.
   *
   * @returns {Blend1dState}
   */
  _createBlend1dState(options) {
    const {blendStateOptions = []} = options;
    const {blendThresholds = []} = options;
    const {blendMatchPhases = []} = options;

    const blendStates = [];
    blendStateOptions.forEach(blendOptions => {
      blendStates.push(
        this._createSingleState({...blendOptions, blendMode: options.blendMode})
      );
    });

    return new Blend1dState(
      options,
      blendStates,
      blendThresholds,
      blendMatchPhases
    );
  }

  /**
   * Return a new instance of a Blend2dState.
   *
   * @private
   *
   * @param {Object} options - Options to pass to the Blend1dState constructor.
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
   * @param {Array.<Array.<number>>} [options.blendThresholds] - Array of Array of numbers used to set the
   * thresholds for each blend state in this container.
   * @param {Array.<boolean>} [options.blendMatchPhases=[]] - Optional array of booleans used to
   * set whether or not each blend state in this container will match phases.
   *
   * @returns {Blend1dState}
   */
  _createBlend2dState(options) {
    const {blendStateOptions = []} = options;
    const {blendThresholds = []} = options;
    const {blendMatchPhases = []} = options;

    const blendStates = [];
    blendStateOptions.forEach(blendOptions => {
      blendStates.push(
        this._createSingleState({...blendOptions, blendMode: options.blendMode})
      );
    });

    return new Blend2dState(
      options,
      blendStates,
      blendThresholds,
      blendMatchPhases
    );
  }

  /**
   * Return a new instance of a RandomAnimationState.
   *
   * @private
   *
   * @param {Object} options - Options to pass to the RandomAnimationState constructor.
   * @param {string=} options.name - Name for the animation state. Names must be
   * unique for the layer the state is applied to.
   * @param {number} [options.playInterval=3] - The base animation playback interval.
   * @param {Array.<Object>} [options.subStateOptions] - Array of options used to create the
   * sub states for this container.
   *
   * @returns {RandomAnimationState}
   */
  _createRandomAnimationState(options) {
    const {subStateOptions = []} = options;

    const subStates = [];
    subStateOptions.forEach(subStateOptions => {
      subStates.push(
        this._createSingleState({
          ...subStateOptions,
          blendMode: options.blendMode,
        })
      );
    });

    return new RandomAnimationState(options, subStates);
  }

  /**
   * Make sure the layer with the given name exists and return a unique version
   * of the animation name supplied for that layer.
   *
   * @private
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
    const name = Utils.getUniqueName(animationName, layer.getStateNames());

    if (name !== animationName) {
      console.warn(
        `Animation name ${animationName} is not unique for layer ${layer.name}. Animation will be renamed to ${name}.`
      );
    }

    return name;
  }

  /**
   * Gets whether or not all animations are paused.
   *
   * @readonly
   * @type {boolean}
   */
  get paused() {
    return this._paused;
  }

  /**
   * Gets an array of names of animation layers.
   *
   * @readonly
   * @type {Array.<string>}
   */
  get layers() {
    return this._layers.map(layer => layer.name);
  }

  /**
   * Create and store a new animation layer.
   *
   * @param {string} [name='NewLayer'] - Name for the layer.
   * @param {Object} [options={}] - Options to pass to {@link AnimationLayer#constructor}
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
   * @returns {boolean} - Whether or not there was an existing interpolation to pause.
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
   * @returns {Deferred} - Resolves once the layer's weight reaches its target value.
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
   * @returns {boolean} - Whether or not there was an existing interpolation or
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
   * @returns {Deferred} - Resolves once the layer's weight reaches its target value
   * and it's current animation finishes playing.
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

    return layer.getStateNames();
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
   * Return whether or not a layer with the given name is currently playing an
   * animation and that animation is paused.
   *
   * @param {string} layerName - Name of the layer.
   *
   * @returns {boolean}
   */
  getPaused(layerName) {
    // Make sure the layerName is valid
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Get paused on layer ${layerName} from host ${this._host.id}. No layer exists with this name.`
      );
    }

    return layer.currentState && layer.currentState.paused;
  }

  /**
   * Return the type name of the given animation. @see AnimationTypes.
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
   * @returns {string} - The name of the animation that was added
   */
  addAnimation(
    layerName,
    animationName,
    animationType = AnimationTypes.single,
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
    options.transitionTime = layer.transitionTime;
    const state = this[`_create${animationType.name}`](options);

    const name = layer.addState(state);

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

    const removed = layer.removeState(animationName);

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
   * @returns {string} - The new name of the animation
   */
  renameAnimation(layerName, currentAnimationName, newAnimationName) {
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      throw new Error(
        `Cannot rename animation ${currentAnimationName} on layer ${layerName} for host ${this._host.id}. No layer exists with this name.`
      );
    }

    const name = layer.renameState(currentAnimationName, newAnimationName);

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
   * @returns {Deferred} - Resolves once the animation reaches the end of its
   * timeline. Looping animations can only resolve if they are interrupted or
   * manually stopped.
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
      },
      ({name, canAdvance, isQueueEnd}) => {
        if (layer.currentAnimation === animationName) {
          // Notify that a new animation has begun
          this.emit(this.constructor.EVENTS.playNextAnimation, {
            layerName,
            animationName,
            nextQueuedAnimation: name,
            canAdvance,
            isQueueEnd,
          });
        }
      }
    );
  }

  /**
   * Play the next animation in the queue of a QueueState animation.
   *
   * @param {string} layerName - Name of the layer that contains the queue animation.
   * @param {string=} animationName - Name of the animation queue animation. Defaults
   * to the name of the current animation for the layer.
   * @param {number=} seconds - The number of seconds it should take to transition
   * to the queue animation if it's not already currently playing. Default is zero
   * and will set immediately.
   * @param {Function=} easingFn - The easing function to use while transitioning
   * to the queue animation if it isn't already playing. Default is Easing.Linear.InOut.
   *
   * @returns {Deferred} - Resolves once the last animation in the queue finishes
   * playing.
   */
  playNextAnimation(layerName, animationName, transitionTime, easingFn) {
    const layer = this._layerMap[layerName];

    if (layer === undefined) {
      const e = `Cannot play next animation on layer ${layerName} for host ${this._host.id}. No layer exists with this name.`;
      return Deferred.reject(e);
    }

    if (animationName === undefined) {
      animationName = layer.currentAnimation;
    }

    const animation = layer.getState(layer.currentAnimation);

    if (animation === null) {
      const e = `Cannot play next animation on layer ${layerName} for host ${this._host.id}. No animation exists with name ${animationName}.`;
      return Deferred.reject(e);
    } else if (this.getAnimationType(layerName, animationName) !== 'queue') {
      const e = `Cannot play next animation on layer ${layerName} for host ${this._host.id}. ${animationName} is not a queue state.`;
      return Deferred.reject(e);
    }

    const onNext = ({name, canAdvance, isQueueEnd}) => {
      if (layer.currentAnimation === animationName) {
        // Notify that a new animation has begun
        this.emit(this.constructor.EVENTS.playNextAnimation, {
          layerName,
          animationName,
          nextQueuedAnimation: name,
          canAdvance,
          isQueueEnd,
        });
      }
    };

    // Make the queue animation current if it wasn't already
    if (layer.currentAnimation === null) {
      layer.resumeAnimation(
        animation.name,
        transitionTime,
        easingFn,
        undefined,
        undefined,
        undefined,
        onNext
      );
    }

    return animation.next(onNext, true);
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
   * @returns {Deferred} - Resolves once the animation reaches the end of its
   * timeline. Looping animations can only resolve if they are interrupted or
   * manually stopped.
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
      },
      ({name, canAdvance, isQueueEnd}) => {
        if (layer.currentAnimation === animationName) {
          // Notify that a new animation has begun
          this.emit(this.constructor.EVENTS.playNextAnimation, {
            layerName,
            animationName,
            nextQueuedAnimation: name,
            canAdvance,
            isQueueEnd,
          });
        }
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

   * @returns {boolean} - Whether or not there was an existing interpolation or
   * current animations to pause.
   */
  pause() {
    this._paused = true;

    let paused = false;
    this._layers.forEach(l => {
      if (l.pause()) {
        paused = true;
      }
    });

    return paused;
  }

  /**
   * Resume current animation and weight interpolation animation on all layers.

   * @returns {boolean} - Whether or not there was an existing interpolation or
   * current animations to resume.
   */
  resume() {
    this._paused = false;

    let resumed = false;
    this._layers.forEach(l => {
      if (l.resume()) {
        resumed = true;
      }
    });

    return resumed;
  }

  /**
   * Adds a namespace to the host with the name of the feature to contain properties
   * and methods from the feature that users of the host need access to.
   *
   * @see AnimationFeature
   */
  installApi() {
    /**
     * @inner
     * @namespace AnimationFeature
     */
    const api = super.installApi();

    Object.defineProperties(api, {
      /**
       * @memberof AnimationFeature
       * @instance
       * @see core/AnimationFeature#paused
       */
      paused: {
        get: () => this.paused,
      },
      /**
       * @memberof AnimationFeature
       * @instance
       * @see core/AnimationFeature#layers
       */
      layers: {
        get: () => this.layers,
      },
    });

    Object.assign(api, {
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#addLayer
       */
      addLayer: this.addLayer.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#removeLayer
       */
      removeLayer: this.removeLayer.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#moveLayer
       */
      moveLayer: this.moveLayer.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#renameLayer
       */
      renameLayer: this.renameLayer.bind(this),

      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#getLayerWeight
       */
      getLayerWeight: this.getLayerWeight.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#setLayerWeight
       */
      setLayerWeight: this.setLayerWeight.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#pauseLayerWeight
       */
      pauseLayerWeight: this.pauseLayerWeight.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#resumeLayerWeight
       */
      resumeLayerWeight: this.resumeLayerWeight.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#pauseLayer
       */
      pauseLayer: this.pauseLayer.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#resumeLayer
       */
      resumeLayer: this.resumeLayer.bind(this),

      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#getTransitioning
       */
      getTransitioning: this.getTransitioning.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#getAnimations
       */
      getAnimations: this.getAnimations.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#getCurrentAnimation
       */
      getCurrentAnimation: this.getCurrentAnimation.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#getPaused
       */
      getPaused: this.getPaused.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#getAnimationType
       */
      getAnimationType: this.getAnimationType.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#addAnimation
       */
      addAnimation: this.addAnimation.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#removeAnimation
       */
      removeAnimation: this.removeAnimation.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#renameAnimation
       */
      renameAnimation: this.renameAnimation.bind(this),

      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#getAnimationBlendNames
       */
      getAnimationBlendNames: this.getAnimationBlendNames.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#getAnimationBlendWeight
       */
      getAnimationBlendWeight: this.getAnimationBlendWeight.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#setAnimationBlendWeight
       */
      setAnimationBlendWeight: this.setAnimationBlendWeight.bind(this),

      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#playAnimation
       */
      playAnimation: this.playAnimation.bind(this),

      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#playNextAnimation
       */
      playNextAnimation: this.playNextAnimation.bind(this),

      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#pauseAnimation
       */
      pauseAnimation: this.pauseAnimation.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#resumeAnimation
       */
      resumeAnimation: this.resumeAnimation.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#stopAnimation
       */
      stopAnimation: this.stopAnimation.bind(this),

      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#pause
       */
      pause: this.pause.bind(this),
      /**
       * @memberof AnimationFeature
       * @instance
       * @method
       * @see core/AnimationFeature#resume
       */
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
    playNextAnimation: 'onNextEvent',
    pauseAnimation: 'onPauseEvent',
    resumeAnimation: 'onResumeEvent',
    interruptAnimation: 'onInterruptEvent',
    stopAnimation: 'onStopEvent',
  },
});

export default AnimationFeature;
