// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module core/HOST
 */

import Utils from './Utils';
import MathUtils from './MathUtils';
import Deferred from './Deferred';
import {env} from './HostEnvironment';
import Messenger from './Messenger';
import AbstractHostFeature from './AbstractHostFeature';
import HostObject from './HostObject';
import LipsyncFeature, {DefaultVisemeMap} from './LipsyncFeature';
import GestureFeature, {DefaultGestureWords} from './GestureFeature';
import PointOfInterestFeature, {AxisMap} from './PointOfInterestFeature';

import animpack from './animpack';

import aws from './awspack';

const {
  Easing,
  AnimationFeature,
  AnimationTypes,
  AnimationLayer,
  LayerBlendModes,
  DefaultLayerBlendMode,
  SingleState,
  TransitionState,
  FreeBlendState,
  QueueState,
  RandomAnimationState,
  Blend1dState,
  Blend2dState,
  AnimationUtils,
} = animpack;
const {
  LexFeature,
  LexUtils,
  AbstractTextToSpeechFeature,
  TextToSpeechFeature,
  TextToSpeechUtils,
  AbstractSpeech,
  Speech,
} = aws;

export {
  /**
   * @see env
   */
  env,
  /**
   * @see Utils
   */
  Utils,
  /**
   * @see MathUtils
   */
  MathUtils,
  /**
   * @see Deferred
   */
  Deferred,
  /**
   * @see core/Messenger
   */
  Messenger,
  /**
   * @see core/HostObject
   */
  HostObject,
  /**
   * @see core/LipsyncFeature
   */
  LipsyncFeature,
  /**
   * @see core/GestureFeature
   */
  GestureFeature,
  /**
   * @see core/PointOfInterestFeature
   */
  PointOfInterestFeature,
  /**
   * @see module:core/AbstractHostFeature
   */
  AbstractHostFeature,
  /**
   * @see DefaultVisemeMap
   */
  DefaultVisemeMap,
  /**
   * @see DefaultGestureWords
   */
  DefaultGestureWords,
  /**
   * @see AxisMap
   */
  AxisMap,

  // Animpack
  /**
   * @see module:core/animpack.Easing
   */
  Easing,
  /**
   * @see module:core/animpack.AnimationFeature
   */
  AnimationFeature,
  /**
   * @see module:core/animpack.AnimationLayer
   */
  AnimationLayer,
  /**
   * @see module:core/animpack.SingleState
   */
  SingleState,
  /**
   * @see module:core/animpack.TransitionState
   */
  TransitionState,
  /**
   * @see module:core/animpack.FreeBlendState
   */
  FreeBlendState,
  /**
   * @see module:core/animpack.QueueState
   */
  QueueState,
  /**
   * @see module:core/animpack.RandomAnimationState
   */
  RandomAnimationState,
  /**
   * @see module:core/animpack.Blend1dState
   */
  Blend1dState,
  /**
   * @see module:core/animpack.Blend2dState
   */
  Blend2dState,
  /**
   * @see module:core/animpack.AnimationUtils
   */
  AnimationUtils,
  /**
   * @see module:core/animpack.LayerBlendModes
   */
  LayerBlendModes,
  /**
   * @see module:core/animpack.DefaultLayerBlendMode
   */
  DefaultLayerBlendMode,
  /**
   * @see module:core/animpack.AnimationTypes
   */
  AnimationTypes,

  // AWS Pack
  /**
   * @see module:core/awspack.LexFeature
   */
  LexFeature,
  /**
   * @see module:core/awspack.LexUtils
   */
  LexUtils,
  /**
   * @see module:core/awspack.AbstractTextToSpeechFeature
   */
  AbstractTextToSpeechFeature,
  /**
   * @see module:core/awspack.TextToSpeechFeature
   */
  TextToSpeechFeature,
  /**
   * @see module:core/awspack.TextToSpeechUtils
   */
  TextToSpeechUtils,
  /**
   * @see module:core/awspack.AbstractSpeech
   */
  AbstractSpeech,
  /**
   * @see module:core/awspack.Speech
   */
  Speech,
};
