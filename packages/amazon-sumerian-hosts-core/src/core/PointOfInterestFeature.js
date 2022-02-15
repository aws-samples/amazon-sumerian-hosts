// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-unused-vars */
import ManagedAnimationLayerInterface from './animpack/ManagedAnimationLayerInterface';
import {AnimationTypes} from './animpack/AnimationFeature';
import SSMLSpeechmarkInterface from './awspack/SSMLSpeechmarkInterface';
import AbstractHostFeature from './AbstractHostFeature';
import {Quadratic} from './animpack/Easing';
import MathUtils from './MathUtils';
import Utils from './Utils';

/**
 * Enum for axis directions.
 *
 * @readonly
 * @enum {Class}
 */
const AxisMap = {
  PositiveX: [1, 0, 0],
  NegativeX: [-1, 0, 0],
  PositiveY: [0, 1, 0],
  NegativeY: [0, -1, 0],
  PositiveZ: [0, 0, 1],
  NegativeZ: [0, 0, -1],
};

const FaceTargetTypes = {
  EyeCenter: 0,
  EyeLeft: 1,
  EyeRight: 2,
  Mouth: 3,
};

// Average distance between pupils is .064m, golden ratio says that the distance
// from center of the pupils to the center of the mouth should be about the same.
const FaceVectors = [
  [0, 0, 0],
  [-0.032, 0, 0],
  [0.032, 0, 0],
  [0, -0.064, 0],
];

// Time ranges to use when choosing a new random wait time between saccades
const MicroSaccadeWaitRanges = {
  default: [0.8, 1.75],
  postMacro: [0.6, 1.3125],
};

const MacroSaccadeWaitRanges = {
  default: [5.0, 8.0],
  mouthTarget: [0.2, 0.75], // Look away from a mouth target the fastest
  eyeTarget: [1.5, 4.0],
};

// Minimum angle in degrees the eye direction must change to trigger a blink animation
const BlinkThreshold = 35;

// Maximum number of milliseconds to use for calculating look speed
const MaxDelta = 100 / 3;

/**
 * PointOfInterest controls the gaze direction of the host. Given one or more
 * animations of type Blend2dState, it calculates the angles between the lookTracker
 * object (generally a joint in the host's skeleton) and the lookTarget (the object
 * the host should look at) and drives the managed Blend2dStates' X and Y blend
 * values using the result. You can optionally add saccadic movement to any managed
 * animation to help make the host's eyes appear alive when focused on the same
 * point for exteded periods of time. If blink animations are specified, a blink
 * will be played during large changes in gaze direction.
 *
 * @extends AbstractHostFeature
 * @alias core/PointOfInterestFeature
 * @implements SSMLSpeechmarkInterface
 * @implements ManagedAnimationLayerInterface
 */
class PointOfInterestFeature extends AbstractHostFeature.mix(
  SSMLSpeechmarkInterface.Mixin,
  ManagedAnimationLayerInterface.Mixin
) {
  /**
   * @constructor
   *
   * @param {core/HostObject} host - Host that owns the feature.
   * @param {Object=} options - Options for the feature.
   * @param {Object=} target - 3D transformation node that the host should try to
   * look at.
   * @param {Object} options.lookTracker - 3D transformation node that represents
   * the direction the host is currently looking during animation.
   * @param {Object=} options.scene - Engine-specific scene object that contains
   * the host. This object must be defined if using 'setTargetByName' or 'SetTargetById'
   * methods.
   * @param {Object=} lookOptions - Options for the look animation layers.
   * @param {number} [lookOptions.blendTime=0.1] - Default amount of time it will
   * take to manipulate the weights of the look layers.
   * @param {number} [lookOptions.easingFn=Quadratic.InOut] - Default easing function
   * to use when manipulating look layer weights.
   * @param {Array.<Object>} [lookOptions.layers=[]] - An array of layer options
   * objects to register as look layers.
   * @param {Object=} blinkOptions - Options for the blink animation layers.
   * @param {number} [blinkOptions.blendTime=0.075] - Default amount of time it
   * will take to manipulate the weights of the blink layers.
   * @param {number} [blinkOptions.easingFn=Quadratic.InOut] - Default easing function
   * to use when manipulating blink layer weights.
   * @param {Array.<Object>} [blinkOptions.layers=[]] - An array of layer options
   * objects to register as blink layers.
   */
  constructor(
    host,
    {target, lookTracker, scene} = {},
    {
      blendTime: lookBlendTime = 0.1,
      easingFn: lookEasingFn = Quadratic.InOut,
      layers: lookLayers = [],
    } = {},
    {
      blendTime: blinkBlendTime = 0.075,
      easingFn: blinkEasingFn = Quadratic.InOut,
      layers: blinkLayers = [],
    } = {}
  ) {
    super(host);

    if (!this.constructor._validateTransformObject(lookTracker)) {
      throw new Error(
        `Cannot initialize PointOfInterestFeature on host ${this._host.id}. LookTracker must be defined as a valid transformation object.`
      );
    }
    this._lookTracker = lookTracker;

    this._scene = scene;
    this._target = target || null;
    this._prevTargetPos = [0, 0, 0];
    this._isTargetMoving = false;
    this._lookLayers = this._lookLayers || {};
    this._trackingConfigs = this._trackingConfigs || [];
    this._blinkLayers = this._blinkLayers || {};

    // Register the look layers
    lookLayers.forEach(
      ({
        name,
        animation,
        maxSpeed,
        reference,
        forwardAxis,
        hasSaccade,
        blendTime,
        easingFn,
      }) => {
        this.registerLookLayer(name, {
          animation,
          maxSpeed,
          reference,
          forwardAxis,
          hasSaccade,
          blendTime: blendTime !== undefined ? blendTime : lookBlendTime,
          easingFn: easingFn !== undefined ? easingFn : lookEasingFn,
        });
      }
    );

    // Register the blink layers
    blinkLayers.forEach(({name, animation, blendTime, easingFn}) => {
      this.registerBlinkLayer(name, {
        animation,
        blendTime: blendTime !== undefined ? blendTime : blinkBlendTime,
        easingFn: easingFn !== undefined ? easingFn : blinkEasingFn,
      });
    });
  }

  /**
   * Gets and sets the target object the host should look at.
   *
   * @type {Object|null}
   */
  get target() {
    return this._target;
  }

  set target(target) {
    this._target = target || null;
  }

  /**
   * Return a vector representing the global position of an object. Should be
   * overloaded for each rendering engine implementation.
   *
   * @private
   *
   * @param {any} _obj - Engine-specific 3D transform object.
   *
   * @returns {Array.<number>} - An array consisting of three numbers representing
   * x, y and z coordinates.
   */
  static _getWorldPosition(obj) {
    return [0, 0, 0];
  }

  /**
   * Return a matrix representing the global transformation matrix of an object.
   * Should be overloaded for each rendering engine implementation.
   *
   * @private
   *
   * @param {any} obj - Engine-specific 3D transform object.
   *
   * @returns {Array.<number>} - An array consisting of 16 numbers representing
   * the 3d transformation.
   */
  static _getWorldMatrix(obj) {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  /**
   * Rotate the given local direction vector by the object's world rotation matrix.
   *
   * @private
   *
   * @param {any} obj - Engine-specific 3D transform object.
   * @param {Array.<number>} forwardVector - Unit vector representing the local
   * forward direction of the object.
   *
   * @returns {Array.<number>}
   */
  static _getObjectDirection(obj, forwardVector = AxisMap.PositiveZ) {
    const rotation = MathUtils.getRotationMatrix(this._getWorldMatrix(obj));

    return MathUtils.rotateVector(forwardVector, rotation);
  }

  /**
   * Calculate horizontal and vertical look angles in degrees given spherical theta
   * and phi angles in radians.
   *
   * @param {number} theta - Vertical/polar angle in radians where 0 points directly
   * along positive Y axis.
   * @param {number} phi - Horizontal/azimuthal angle in radians.
   *
   * @returns {Object} - An object with the signature {h: number, v: number} where
   * h represents horizontal rotation in degrees and v represents vertical rotation
   * in degrees.
   */
  static _sphericalToBlendValue(theta, phi) {
    const h = MathUtils.toDegrees(phi);

    // Offset the vertical angle so 0 is pointing forward instead of up
    const v = MathUtils.toDegrees(theta) - 90;

    // Convert vertical angle to -180, 180 range
    return {h, v};
  }

  _onLayerAdded({name}) {
    this._lookLayers = this._lookLayers || {};
    this._blinkLayers = this._blinkLayers || {};

    super._onLayerAdded({name});

    // Validate the look animation
    if (this._lookLayers[name] !== undefined) {
      this._registerLookAnimation(name, this._lookLayers[name]);
    }
  }

  _onAnimationAdded({layerName, animationName}) {
    this._lookLayers = this._lookLayers || {};
    this._blinkLayers = this._blinkLayers || {};

    super._onAnimationAdded({layerName});

    // Validate the look animation
    if (this._lookLayers[layerName] === animationName) {
      this._registerLookAnimation(layerName, animationName);
    }
  }

  /**
   * Ensure that registered look animations are Blend2dStates.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that contains the look animation.
   * @param {string} animationName - Name of the animation.
   */
  _registerLookAnimation(layerName, animationName) {
    if (this._managedLayers[layerName].animations[animationName].isActive) {
      if (
        AnimationTypes[
          this._host.AnimationFeature.getAnimationType(layerName, animationName)
        ] !== AnimationTypes.blend2d
      ) {
        // Warn and deactivate if the registered state is not blend2d
        console.warn(
          `Cannot register Point of Interest look animation ${animationName} on layer ${layerName} for host ${this._host.id}. Look animations must be of type 'blend2d'.`
        );
        this._managedLayers[layerName].animations[
          animationName
        ].isActive = false;
      }
    }
  }

  /**
   * Check if the given object is not of an engine-specific type. Should
   * be overloaded for each rendering engine implementation.
   *
   * @private
   *
   * @param {any} obj - Object to validate.
   *
   * @returns {boolean}
   */
  static _validateTransformObject(obj) {
    return obj instanceof Object;
  }

  /**
   * Check if the given configuration object has already been stored as a tracking
   * config. If it has, return the stored configuration. Otherwise, store and
   * return it.
   *
   * @private
   *
   * @param {Object} config - Object containing tracker, reference and forwardAxis
   * properties.
   *
   * @returns {Object}
   */
  _addTrackingConfig(config) {
    const trackingConfig = this._trackingConfigs.find(
      c =>
        c.reference === config.reference && c.forwardAxis === config.forwardAxis
    );

    if (trackingConfig) {
      return trackingConfig;
    } else {
      config.angles = {h: 0, v: 0};
      config.prevAngles = {h: 0, v: 0};
      this._trackingConfigs.push(config);
      return config;
    }
  }

  /**
   * Return the distance between the look tracker and the look target.
   *
   * @private
   *
   * @returns {number}
   */
  _getTargetDistance() {
    // Find the vector between the global positions of tracker and target
    const sourcePosition = this.constructor._getWorldPosition(
      this._lookTracker
    );
    const targetPosition = this.constructor._getWorldPosition(this._target);
    const lookVector = [
      targetPosition[0] - sourcePosition[0],
      targetPosition[1] - sourcePosition[1],
      targetPosition[2] - sourcePosition[2],
    ];

    return MathUtils.getVectorMagnitude(lookVector);
  }

  /**
   * Reset all stored tracking angles to 0.
   *
   * @private
   */
  _resetLookAngles() {
    this._trackingConfigs.forEach(({angles}) => {
      angles.h = 0;
      angles.v = 0;
    });
  }

  /**
   * Store the difference in horizontal and vertical rotation for the tracker's
   * reference rotation and the direction of the target from the tracker.
   *
   * @private
   */
  _setLookAngles() {
    // Get the current positions of the tracker and target objects
    const targetPos = this.constructor._getWorldPosition(this._target);
    const trackerPos = this.constructor._getWorldPosition(this._lookTracker);

    // Check if the target has moved
    this._isTargetMoving =
      MathUtils.getVectorMagnitude([
        targetPos[0] - this._prevTargetPos[0],
        targetPos[1] - this._prevTargetPos[1],
        targetPos[2] - this._prevTargetPos[2],
      ]) > 0;
    Object.assign(this._prevTargetPos, targetPos);

    // Calculate the horizontal and vertical angles to rotate to the target
    const targetSpherical = MathUtils.cartesianToSpherical(
      targetPos[0] - trackerPos[0],
      targetPos[1] - trackerPos[1],
      targetPos[2] - trackerPos[2]
    );
    const targetAngles = this.constructor._sphericalToBlendValue(
      targetSpherical[1],
      targetSpherical[2]
    );

    // Calculate angles relative to the reference objects
    this._trackingConfigs.forEach(({reference, forwardAxis, angles}) => {
      // Calculate the horizontal and vertical angles to rotate to the direction of the tracker
      const refDirection = this.constructor._getObjectDirection(
        reference,
        forwardAxis
      );
      const refSpherical = MathUtils.cartesianToSpherical(...refDirection);
      const refAngles = this.constructor._sphericalToBlendValue(
        refSpherical[1],
        refSpherical[2]
      );

      // Store the difference
      angles.h = targetAngles.h - refAngles.h;
      angles.v = targetAngles.v - refAngles.v;
    });
  }

  /**
   * Return the horizontal and vertical angles it would require to simulate looking
   * at the given type of face target
   *
   * @private
   *
   * @param {number} targetType - Integer representing the FaceTargetType.
   *
   * @returns {Object}- An object with signature {r: number, h: number, v: number}
   * where 'r' represents radius, h represents the horizontal/azimuthal angle and
   * v represents the vertical/polar angle.
   */
  _getFaceTargetAngles(targetType) {
    // No offset when the target is the center of the eyes
    if (targetType === 0) {
      return {h: 0, v: 0};
    }

    // Build a vector to the face target type using the current distance to the target
    const distance = this._getTargetDistance(this._lookTracker);
    const faceVector = [...FaceVectors[targetType]];
    faceVector[2] = distance;
    const spherical = MathUtils.cartesianToSpherical(...faceVector);

    // Make sure values are clamped within the range of motion of the human eye, in case the target is very close
    const blendValues = this.constructor._sphericalToBlendValue(
      spherical[1],
      spherical[2]
    );
    blendValues.h = MathUtils.clamp(blendValues.h, -35, 35);
    blendValues.v = MathUtils.clamp(blendValues.v, -25, 30);

    return blendValues;
  }

  /**
   * Updated the stored speed and duration variables for a layer based on the
   * change in horizontal and vertical angles of the tracker.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer to store values on.
   * @param {number} h - Change in horizontal angle, in degrees.
   * @param {number} v - Change in vertical angle, in degrees.
   */
  _updateLayerSpeed(layerName, h, v) {
    const layer = this._managedLayers[layerName];

    // From "Realistic Avatar and head Animation Using a Neurobiological Model of Visual Attention", Itti, Dhavale, Pighin
    layer.maxHSpeed = 473 * (1 - Math.exp(-h / 7.8));
    layer.maxVSpeed = 473 * (1 - Math.exp(-v / 7.8));

    // From "Eyes Alive", Lee, Badler
    const D0 = 0.025;
    const d = 0.00235;
    layer.hDuration = D0 + d * h;
    layer.vDuration = D0 + d * v;
  }

  /**
   * Set the microSaccade object with new randomized values.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that owns the saccade motion.
   */
  _setMicroSaccade(layerName) {
    const layer = this._managedLayers[layerName];
    const {microSaccade} = layer;

    if (this._target) {
      // Micro movements should be smaller when focused on a target
      microSaccade.h = Utils.getRandomFloat(0.01, 0.15);
      microSaccade.v = Utils.getRandomFloat(0.01, 0.15);
    } else {
      // Microsaccades. Encyclopedia of Neuroscience. (2009) Springer, Berlin, Heidelberg. https://doi.org/10.1007/978-3-540-29678-2_3492
      microSaccade.h = Utils.getRandomFloat(0.01, 0.3);
      microSaccade.v = Utils.getRandomFloat(0.01, 0.3);
    }

    this._updateLayerSpeed(layerName, microSaccade.h, microSaccade.v);

    // Restart the timer
    this._initializeMicroTimer(layerName, ...MicroSaccadeWaitRanges.default);
  }

  /**
   * Set the macroSaccade object with new randomized values.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that owns the saccade motion.
   */
  _setMacroSaccade(layerName) {
    const layer = this._managedLayers[layerName];
    const {macroSaccade} = layer;
    let macroSaccadeWaitRange;

    // Increase random value range when not focused on a target
    if (!this._target) {
      macroSaccadeWaitRange = MacroSaccadeWaitRanges.default;

      // Normal human horizontal eye rotation limit is about 35 degrees
      const hLimit = Utils.getRandomFloat(0.143, 0.286);
      const hFactor = Utils.getRandomFloat(-hLimit, hLimit);
      macroSaccade.h = hFactor * 35;

      // Normal human vertical eye rotation limit is about 25 degrees upward and 30 degrees downward
      const vLimit = Utils.getRandomFloat(0.093, 0.186);
      const vFactor = Utils.getRandomFloat(-vLimit, vLimit);
      macroSaccade.v = vFactor > 0 ? vFactor * 25 : vFactor * 30;
    }

    // Pick a new face target
    else {
      // Social triangle - saccade between eyes and mouth, weighted to look at eyes more often
      switch (layer.saccadeTarget) {
        case 1:
          macroSaccadeWaitRange = MacroSaccadeWaitRanges.eyeTarget;
          layer.saccadeTarget =
            Math.random() < 0.75
              ? FaceTargetTypes.EyeRight
              : FaceTargetTypes.Mouth;
          break;
        case 2:
          macroSaccadeWaitRange = MacroSaccadeWaitRanges.eyeTarget;
          layer.saccadeTarget =
            Math.random() < 0.75
              ? FaceTargetTypes.EyeLeft
              : FaceTargetTypes.Mouth;
          break;
        case 3:
          macroSaccadeWaitRange = MacroSaccadeWaitRanges.mouthTarget;
          layer.saccadeTarget =
            Math.random() < 0.5
              ? FaceTargetTypes.EyeLeft
              : FaceTargetTypes.EyeRight;
          break;
        case 0:
        default:
          macroSaccadeWaitRange = MacroSaccadeWaitRanges.eyeTarget;
          layer.saccadeTarget =
            Math.random() < 0.5
              ? FaceTargetTypes.EyeLeft
              : FaceTargetTypes.EyeRight;
          break;
      }

      const {h, v} = this._getFaceTargetAngles(layer.saccadeTarget);
      macroSaccade.h = h;
      macroSaccade.v = v;
    }

    this._updateLayerSpeed(layerName, macroSaccade.h, macroSaccade.v);

    // Restart the timers
    this._initializeMicroTimer(layerName, ...MicroSaccadeWaitRanges.postMacro);
    this._initializeMacroTimer(layerName, ...macroSaccadeWaitRange);
  }

  /**
   * Start a new wait timer that will set a new micro saccade movement when it
   * resolves.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that owns the saccade motion.
   * @param {number} minWaitTime - Minimum number of seconds before a new saccade
   * will be triggered.
   * @param {number} maxWaitTime - Maximum number of seconds before a new saccade
   * will be triggered.
   */
  _initializeMicroTimer(layerName, minWaitTime, maxWaitTime) {
    const layer = this._managedLayers[layerName];
    const waitTime = Utils.getRandomFloat(minWaitTime, maxWaitTime);

    if (layer.microSaccadeTimer) {
      layer.microSaccadeTimer.cancel();
    }
    layer.microSaccadeTimer = Utils.wait(waitTime, {
      onFinish: () => {
        this._setMicroSaccade(layerName);
      },
    });
  }

  /**
   * Start a new wait timer that will set a new macro saccade movement when it
   * resolves.
   *
   * @private
   *
   * @param {string} layerName - Name of the layer that owns the saccade motion.
   * @param {number} minWaitTime - Minimum number of seconds before a new saccade
   * will be triggered.
   * @param {number} maxWaitTime - Maximum number of seconds before a new saccade
   * will be triggered.
   */
  _initializeMacroTimer(layerName, minWaitTime, maxWaitTime) {
    const layer = this._managedLayers[layerName];
    const waitTime = Utils.getRandomFloat(minWaitTime, maxWaitTime);

    if (layer.macroSaccadeTimer) {
      layer.macroSaccadeTimer.cancel();
    }
    layer.macroSaccadeTimer = Utils.wait(waitTime, {
      onFinish: () => {
        this._setMacroSaccade(layerName);
      },
    });
  }

  /**
   * Sets a new target to look at.
   *
   * @param {Object|null} target - The new target to look at.
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * Finds an object given its name and sets it as the new target to look at.
   * Should be overloaded for each rendering engine implementation.
   *
   * @param {string} target - Name to search for.
   */
  setTargetByName(name) {
    if (!name) {
      this._target = null;
    }

    if (!this._scene) {
      throw new Error(
        `Cannot set PointOfInterestFeature target using name ${name} on host ${this._host.id}. Scene must be defined.`
      );
    }
  }

  /**
   * Finds an object given its id and sets it as the new target to look at.
   * Should be overloaded for each rendering engine implementation.
   *
   * @param {string|number} target - Id to search for.
   */
  setTargetById(id) {
    if (!id) {
      this._target = null;
    }

    if (!this._scene) {
      throw new Error(
        `Cannot set PointOfInterestFeature target using id ${id} on host ${this._host.id}. Scene must be defined.`
      );
    }
  }

  /**
   * Start keeping track of an animation layer that owns a blend2d animation with
   * blendWeights corresponding to horizontal and vertical look angles.
   *
   * @param {string} layerName - Name of the layer to keep track of.
   * @param {Object=} options - Options for the layer.
   * @param {string} [options.animation = 'look'] - Name of the animation on the
   * layer whose blendWeights will be driven based on the angle between the lookTracker
   * and the lookTarget. This animation must be of type blend2d.
   * @param {number} [options.maxSpeed = 25] - The maximum speed at which the blend2d
   * blendWeights can be manipulated.
   * @param {string} [options.forwardAxis = 'PositiveZ'] - Axis pointing from the
   * front of the lookReference object. Valid options are 'PositiveX', 'NegativeX',
   * 'PositiveY', 'NegativeY', 'PositiveZ', 'NegativeZ'.
   * @param {Object=} options.lookReference - 3D transformation node that the lookTracker
   * rotation limits should be calculated relative to. Defaults to the host owner.
   * @param {number} [options.hasSaccade = false] - Whether or not to include
   * saccadic motion onto the blendWeight animation. This should only be set to
   * true for blend2d animations representing eye animation.
   * @param {number=} [options.blendTime=[PointOfInterestFeature.DEFAULT_LAYER_OPTIONS.blendTime]{@link PointOfInterestFeature#DEFAULT_LAYER_OPTIONS#blendTime}] -
   * Default amount of time to use when manipulating layer weight.
   * @param {Function=} options.easingFn - Default easing function to use when
   * manipulating layer weight.
   */
  registerLookLayer(
    layerName,
    {
      animation = 'look',
      maxSpeed = 25,
      reference,
      forwardAxis = 'PositiveZ',
      hasSaccade = false,
      blendTime = PointOfInterestFeature.DEFAULT_LAYER_OPTIONS.blendTime,
      easingFn,
    } = {}
  ) {
    // Validate reference object
    reference = reference || this._host.owner;

    if (!this.constructor._validateTransformObject(reference)) {
      throw new Error(
        `Cannot initialize register look layer ${layerName} for PointOfInterestFeature on host ${this._host.id}. Reference must be defined as a valid transformation object.`
      );
    }

    // Find vector associated with axis string
    forwardAxis =
      AxisMap[forwardAxis] !== undefined
        ? AxisMap[forwardAxis]
        : AxisMap.PositiveZ;

    // Store tracking configuration
    const trackingConfig = this._addTrackingConfig({
      reference,
      forwardAxis,
    });

    // Register the layer and animation
    this.registerLayer(layerName, {
      trackingConfig,
      maxSpeed,
      maxHSpeed: undefined,
      maxVSpeed: undefined,
      hDuration: undefined,
      vDuration: undefined,
      hVelocity: [0, 0],
      vVelocity: [0, 0],
      hasSaccade,
      blendTime,
      easingFn,
      microSaccade: {h: 0, v: 0},
      macroSaccade: {h: 0, v: 0},
      saccadeTarget: FaceTargetTypes.EyeCenter,
      animations: {[animation]: {}},
    });
    this._lookLayers[layerName] = animation;

    // Validate the look animation
    this._registerLookAnimation(layerName, animation);

    // Initialize saccade timers
    if (hasSaccade) {
      const macroSaccadeWaitRange = this._target
        ? MacroSaccadeWaitRanges.eyeTarget
        : MacroSaccadeWaitRanges.default;
      this._initializeMicroTimer(layerName, ...MicroSaccadeWaitRanges.default);
      this._initializeMacroTimer(layerName, ...macroSaccadeWaitRange);
    }
  }

  /**
   * Start keeping track of an animation layer that owns a blink animation. Blink
   * animations can be of any type, but if it is of type randomAnimation then a
   * it will be randomized each time a blink is called.
   *
   * @param {string} layerName - Name of the layer to keep track of.
   * @param {Object=} options - Options for the layer.
   * @param {string} [options.animation = 'blink'] - Name of the blink animation
   * on the layer.
   * @param {number} [options.blendTime=[PointOfInterestFeature.DEFAULT_LAYER_OPTIONS.blendTime]{@link PointOfInterestFeature#DEFAULT_LAYER_OPTIONS#blendTime}] -
   * Default amount of time to use when manipulating the layer's weight.
   * @param {Function=} options.easingFn - Default easing function to use when
   * manipulating the layer's weight.
   */
  registerBlinkLayer(
    layerName,
    {
      animation = 'blink',
      blendTime = PointOfInterestFeature.DEFAULT_LAYER_OPTIONS.blendTime,
      easingFn,
    } = {}
  ) {
    // Register the layer and animation
    this.registerLayer(layerName, {
      blendTime,
      easingFn,
      animations: {[animation]: {}},
    });
    this._blinkLayers[layerName] = animation;
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Update the look angles
    if (this._target) {
      this._setLookAngles();
    } else {
      this._resetLookAngles();
    }

    const deltaSeconds = Math.min(deltaTime, MaxDelta) / 1000;
    let triggerBlink = false;

    // Set look blend values
    Object.entries(this._lookLayers).forEach(([layerName, animName]) => {
      const options = this._managedLayers[layerName];

      // Increment the saccade timers
      if (options.isActive && options.hasSaccade) {
        options.microSaccadeTimer.execute(deltaTime);
        options.macroSaccadeTimer.execute(deltaTime);
      }

      // Set the blend values
      if (options.animations[animName].isActive) {
        const currentH = this._host.AnimationFeature.getAnimationBlendWeight(
          layerName,
          animName,
          'X'
        );
        const currentV = this._host.AnimationFeature.getAnimationBlendWeight(
          layerName,
          animName,
          'Y'
        );

        let targetH = options.trackingConfig.angles.h;
        let targetV = options.trackingConfig.angles.v;

        // Check if the look angle has changed enough to trigger a blink
        if (this._isTargetMoving && !triggerBlink) {
          const prevTargetH = options.trackingConfig.prevAngles.h;
          const prevTargetV = options.trackingConfig.prevAngles.v;
          const changeAmount = MathUtils.toDegrees(
            MathUtils.getAngleBetween(
              [prevTargetH, prevTargetV],
              [targetH, targetV]
            )
          );

          if (changeAmount >= BlinkThreshold) {
            triggerBlink = true;
          }
        }

        options.trackingConfig.prevAngles.h = targetH;
        options.trackingConfig.prevAngles.v = targetV;

        // Add in the saccade movement
        if (options.hasSaccade) {
          MathUtils.dampValue(
            0,
            options.macroSaccade.h + options.macroSaccade.h,
            options.hVelocity,
            options.hDuration,
            options.maxHSpeed
          );
          targetH += options.hVelocity[0];
          MathUtils.dampValue(
            0,
            options.macroSaccade.v + options.macroSaccade.v,
            options.vVelocity,
            options.vDuration,
            options.maxVSpeed
          );
          targetV += options.vVelocity[0];
        }

        // Clamp to max speed
        const factor = MathUtils.clamp(deltaSeconds * options.maxSpeed, 0, 1);
        targetH = MathUtils.lerp(currentH, targetH, factor);
        targetV = MathUtils.lerp(currentV, targetV, factor);

        // Update the blend values
        this._host.AnimationFeature.setAnimationBlendWeight(
          layerName,
          animName,
          'X',
          targetH
        );
        this._host.AnimationFeature.setAnimationBlendWeight(
          layerName,
          animName,
          'Y',
          targetV
        );
      }
    });

    if (!triggerBlink || !this._isTargetMoving) {
      return;
    }

    // Execute blink
    Object.entries(this._blinkLayers).forEach(([layerName, animName]) => {
      const animation = this._managedLayers[layerName].animations[animName];

      if (animation.isActive) {
        this._host.AnimationFeature.playAnimation(layerName, animName);
      }
    });
  }

  installApi() {
    /**
     * @inner
     * @namespace PointOfInterestFeature
     */
    const api = super.installApi();

    Object.defineProperties(api, {
      /**
       * @memberof PointOfInterestFeature
       * @instance
       * @see core/PointOfInterestFeature#target
       */
      target: {
        get: () => this.target,
        set: target => {
          this.target = target;
        },
      },
    });

    Object.assign(api, {
      /**
       * @memberof PointOfInterestFeature
       * @instance
       * @method
       * @see core/PointOfInterestFeature#registerLookLayer
       */
      registerLookLayer: this.registerLookLayer.bind(this),
      /**
       * @memberof PointOfInterestFeature
       * @instance
       * @method
       * @see core/PointOfInterestFeature#registerBlinkLayer
       */
      registerBlinkLayer: this.registerBlinkLayer.bind(this),
      /**
       * @memberof PointOfInterestFeature
       * @instance
       * @method
       * @see core/PointOfInterestFeature#setTarget
       */
      setTarget: this.setTarget.bind(this),
      /**
       * @memberof PointOfInterestFeature
       * @instance
       * @method
       * @see core/PointOfInterestFeature#setTargetByName
       */
      setTargetByName: this.setTargetByName.bind(this),
      /**
       * @memberof PointOfInterestFeature
       * @instance
       * @method
       * @see core/PointOfInterestFeature#setTargetById
       */
      setTargetById: this.setTargetById.bind(this),
    });

    return api;
  }
}

export default PointOfInterestFeature;
export {AxisMap};
