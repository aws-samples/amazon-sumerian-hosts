// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import TextToSpeechUtils from './TextToSpeechUtils';
import AbstractSpeech from './AbstractSpeech';
import Speech from './Speech';
import AbstractTextToSpeechFeature from './AbstractTextToSpeechFeature';
import TextToSpeechFeature from './TextToSpeechFeature';
import LexFeature from './LexFeature';
import LexUtils from './LexUtils';
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
