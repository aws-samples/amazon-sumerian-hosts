// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module babylon/animpack
 */

import { Easing,
  AnimationUtils,
  TransitionState,
  FreeBlendState,
  QueueState,
  RandomAnimationState,
  Blend1dState,
  Blend2dState,
  AnimationLayer,
  LayerBlendModes,
  DefaultLayerBlendMode } from '@amazon-sumerian-hosts/core';
import AnimationFeature, {AnimationTypes} from './AnimationFeature';
import SingleState from './state/SingleState';

// /**
//  * @namespace
//  */
// const Easing = {
//   /**
//    * @see Linear
//    */
//   Linear,
//   /**
//    * @see Quadratic
//    */
//   Quadratic,
//   /**
//    * @see Cubic
//    */
//   Cubic,
//   /**
//    * @see Quartic
//    */
//   Quartic,
//   /**
//    * @see Quintic
//    */
//   Quintic,
//   /**
//    * @see Sinusoidal
//    */
//   Sinusoidal,
//   /**
//    * @see Exponential
//    */
//   Exponential,
//   /**
//    * @see Circular
//    */
//   Circular,
//   /**
//    * @see Elastic
//    */
//   Elastic,
//   /**
//    * @see Back
//    */
//   Back,
//   /**
//    * @see Bounce
//    */
//   Bounce,
// };
export default {
  /**
   * @see Babylon.js/AnimationFeature
   */
  AnimationFeature,
  /**
   * @see AnimationLayer
   */
  AnimationLayer,
  /**
   * @see Babylon.js/SingleState
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
   * @see QueueState
   */
  QueueState,
  /**
   * @see RandomAnimationState
   */
  RandomAnimationState,
  /**
   * @see Blend1dState
   */
  Blend1dState,
  /**
   * @see Blend2dState
   */
  Blend2dState,
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
