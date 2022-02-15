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
   * @see module:hosts/core.AnimationLayer
   */
  AnimationLayer,
  /**
   * @see module:hosts/core.TransitionState
   */
  TransitionState,
  /**
   * @see module:hosts/core.FreeBlendState
   */
  FreeBlendState,
  /**
   * @see module:hosts/core.QueueState
   */
  QueueState,
  /**
   * @see module:hosts/core.RandomAnimationState
   */
  RandomAnimationState,
  /**
   * @see module:hosts/core.Blend1dState
   */
  Blend1dState,
  /**
   * @see module:hosts/core.Blend2dState
   */
  Blend2dState,
  /**
   * @see module:hosts/core.AnimationUtils
   */
  AnimationUtils,
  /**
   * @see module:hosts/core.Easing
   */
  Easing,
  /**
   * @see module:hosts/core.LayerBlendModes
   */
  LayerBlendModes,
  /**
   * @see module:hosts/core.DefaultLayerBlendMode
   */
  DefaultLayerBlendMode,
  /**
   * @see module:hosts/core.AnimationTypes
   */
  AnimationTypes,
};
