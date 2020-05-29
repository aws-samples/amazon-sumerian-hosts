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
} from './Easing';
import AnimationFeature, {AnimationTypes} from './AnimationFeature';
import AnimationLayer, {
  LayerBlendModes,
  DefaultLayerBlendMode,
} from './AnimationLayer';
import SingleState from './state/SingleState';
import TransitionState from './state/TransitionState';
import AnimationUtils from './AnimationUtils';

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
