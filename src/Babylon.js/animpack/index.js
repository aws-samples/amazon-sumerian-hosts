// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
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
import AnimationFeature, {AnimationTypes} from './AnimationFeature';
import SingleState from './state/SingleState';

const Easing = {
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
};
export {
  AnimationFeature,
  AnimationLayer,
  SingleState,
  TransitionState,
  AnimationUtils,
  Easing,
  LayerBlendModes,
  DefaultLayerBlendMode,
  AnimationTypes
};
