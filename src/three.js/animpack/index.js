// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module three/animpack
 */

import {
  Linear,
  Quadratic,
  Cubic,
  Quartic,
  Quintic,
  Sinusoidal,
  Exponential,
  Circular,
  Elastic,
  Back,
  Bounce,
} from 'core/animpack/Easing';
import AnimationUtils from 'core/animpack/AnimationUtils';
import TransitionState from 'core/animpack/state/TransitionState';
import AnimationLayer, {
  LayerBlendModes,
  DefaultLayerBlendMode,
} from 'core/animpack/AnimationLayer';
import FreeBlendState from 'core/animpack/state/FreeBlendState';
import AnimationFeature, {AnimationTypes} from './AnimationFeature';
import SingleState from './state/SingleState';

/**
 * @namespace
 */
const Easing = {
  /**
   * @see Linear
   */
  Linear,
  /**
   * @see Quadratic
   */
  Quadratic,
  /**
   * @see Cubic
   */
  Cubic,
  /**
   * @see Quartic
   */
  Quartic,
  /**
   * @see Quintic
   */
  Quintic,
  /**
   * @see Sinusoidal
   */
  Sinusoidal,
  /**
   * @see Exponential
   */
  Exponential,
  /**
   * @see Circular
   */
  Circular,
  /**
   * @see Elastic
   */
  Elastic,
  /**
   * @see Back
   */
  Back,
  /**
   * @see Bounce
   */
  Bounce,
};
export default {
  /**
   * @see three.js/AnimationFeature
   */
  AnimationFeature,
  /**
   * @see AnimationLayer
   */
  AnimationLayer,
  /**
   * @see three.js/SingleState
   */
  SingleState,
  /**
   * @see TransitionState
   */
  TransitionState,
  /**
   * @see FreeBlendState
   */
  FreeBlendState,
  /**
   * @see AnimationUtils
   */
  AnimationUtils,
  /**
   * @see Easing
   */
  Easing,
  /**
   * @see LayerBlendModes
   */
  LayerBlendModes,
  /**
   * @see DefaultLayerBlendMode
   */
  DefaultLayerBlendMode,
  /**
   * @see AnimationTypes
   */
  AnimationTypes,
};
