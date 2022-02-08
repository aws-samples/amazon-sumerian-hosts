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
import HostObject from './HostObject';
import LipsyncFeature, { DefaultVisemeMap } from './LipsyncFeature';
import GestureFeature, { DefaultGestureWords } from './GestureFeature';
import PointOfInterestFeature, { AxisMap } from './PointOfInterestFeature';

import animpack from './animpack';
const { Easing,
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
  AnimationUtils } = animpack

import aws from './awspack';
const {
  AbstractTextToSpeechFeature,
  TextToSpeechFeature,
  TextToSpeechUtils,
  Speech, 
  AbstractSpeech } = aws

export default {
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
   * @see GestureFeature
   */
  GestureFeature,
  /**
   * @see core/PointOfInterestFeature
   */
  PointOfInterestFeature,
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
  /**
   * @see core/AnimationFeature
   */
   AnimationFeature,
   /**
    * @see AnimationLayer
    */
   AnimationLayer,
   /**
    * @see core/SingleState
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

   // AWS Pack
   /**
   * @see core/AbstractTextToSpeechFeature
   */
  AbstractTextToSpeechFeature,
  /**
   * @see core/TextToSpeechFeature
   */
  TextToSpeechFeature,
  /**
   * @see core/TextToSpeechUtils
   */
  TextToSpeechUtils,
  /**
   * @see core/Speech
   */
  Speech,
  /**
   * @see core/AbstractSpeech
   */
  AbstractSpeech
};
