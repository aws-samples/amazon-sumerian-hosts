// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module threejs/animpack
 */

import {
  Easing,
  AnimationUtils,
  TransitionState,
  RandomAnimationState,
  AnimationLayer,
  LayerBlendModes,
  DefaultLayerBlendMode,
  FreeBlendState,
  QueueState,
  Blend1dState,
  Blend2dState,
} from '@amazon-sumerian-hosts/core';
import AnimationFeature, {AnimationTypes} from './AnimationFeature';
import SingleState from './state/SingleState';

export default {
  /**
   * @see threejs/AnimationFeature
   */
  AnimationFeature,
  /**
   * @see threejs/SingleState
   */
  SingleState,
  /**
   * @see module:core/HOST.AnimationLayer
   */
  AnimationLayer,
  /**
   * @see module:core/HOST.TransitionState
   */
  TransitionState,
  /**
   * @see module:core/HOST.FreeBlendState
   */
  FreeBlendState,
  /**
   * @see module:core/HOST.QueueState
   */
  QueueState,
  /**
   * @see module:core/HOST.RandomAnimationState
   */
  RandomAnimationState,
  /**
   * @see module:core/HOST.Blend1dState
   */
  Blend1dState,
  /**
   * @see module:core/HOST.Blend2dState
   */
  Blend2dState,
  /**
   * @see module:core/HOST.AnimationUtils
   */
  AnimationUtils,
  /**
   * @see module:core/HOST.Easing
   */
  Easing,
  /**
   * @see module:core/HOST.LayerBlendModes
   */
  LayerBlendModes,
  /**
   * @see module:core/HOST.DefaultLayerBlendMode
   */
  DefaultLayerBlendMode,
  /**
   * @see module:core/HOST.AnimationTypes
   */
  AnimationTypes,
};
