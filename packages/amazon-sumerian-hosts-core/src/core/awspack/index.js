// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import TextToSpeechUtils from './TextToSpeechUtils.js';
import AbstractSpeech from './AbstractSpeech.js';
import Speech from './Speech.js';
import AbstractTextToSpeechFeature from './AbstractTextToSpeechFeature.js';
import TextToSpeechFeature from './TextToSpeechFeature.js';
import LexFeature from './LexFeature.js';
import LexUtils from './LexUtils.js';
/**
 * @module core/awspack
 */

export default {
  /**
   * @see LexFeature
   */
  LexFeature,
  /**
   * @see LexUtils
   */
  LexUtils,
  /**
   * @see AbstractTextToSpeechFeature
   */
  AbstractTextToSpeechFeature,
  /**
   * @see core/TextToSpeechFeature
   */
  TextToSpeechFeature,
  /**
   * @see TextToSpeechUtils
   */
  TextToSpeechUtils,
  /**
   * @see AbstractSpeech
   */
  AbstractSpeech,
  /**
   * @see core/Speech
   */
  Speech,
};
