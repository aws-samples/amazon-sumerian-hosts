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
} from '@amazon-sumerian-hosts/core';
import AnimationUtils from '@amazon-sumerian-hosts/core';
import TransitionState from '@amazon-sumerian-hosts/core';
import RandomAnimationState from '@amazon-sumerian-hosts/core';
import AnimationLayer, {
  LayerBlendModes,
  DefaultLayerBlendMode,
} from '@amazon-sumerian-hosts/core';
import FreeBlendState from '@amazon-sumerian-hosts/core';
import QueueState from '@amazon-sumerian-hosts/core';
import Blend1dState from '@amazon-sumerian-hosts/core';
import Blend2dState from '@amazon-sumerian-hosts/core';
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
