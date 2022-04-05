// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {TextToSpeechUtils, LexUtils} from '@amazon-sumerian-hosts/core';
import TextToSpeechFeature from './TextToSpeechFeature';
import LexFeature from './LexFeature';
import Speech from './Speech';

/**
 * @module threejs/awspack
 */

export default {
  /**
   * @see threejs/TextToSpeechFeature
   */
  TextToSpeechFeature,
  /**
   * @see threejs/Speech
   */
  Speech,
  /**
   * @see module:core/HOST.TextToSpeechUtils
   */
  TextToSpeechUtils,
  /**
   * @see threejs/LexFeature
   */
  LexFeature,
  /**
   * @see module:core/HOST.LexUtils
   */
  LexUtils,
};
