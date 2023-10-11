// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module core/HOST
 */

import Utils from './Utils.js';
import MathUtils from './MathUtils.js';
import Deferred from './Deferred.js';
import {env} from './HostEnvironment.js';
import Messenger from './Messenger.js';
import AbstractHostFeature from './AbstractHostFeature.js';
import HostObject from './HostObject.js';
import LipsyncFeature, {DefaultVisemeMap} from './LipsyncFeature.js';
import GestureFeature, {DefaultGestureWords} from './GestureFeature.js';
import PointOfInterestFeature, {AxisMap} from './PointOfInterestFeature.js';

import animpack from './animpack/index.js';
import aws from './awspack/index.js';

const Version = Utils.getVersion();

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
  /**
   * The Version of the Sumerian Hosts library
   */
  Version,
};
