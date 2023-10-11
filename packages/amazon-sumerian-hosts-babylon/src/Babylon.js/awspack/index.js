// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {TextToSpeechUtils, LexUtils} from '@amazon-sumerian-hosts/core';
import TextToSpeechFeature from './TextToSpeechFeature.js';
import LexFeature from './LexFeature.js';
import Speech from './Speech.js';

/**
 * @module babylonjs/awspack
 */

export default {
  /**
   * @see babylonjs/TextToSpeechFeature
   */
  TextToSpeechFeature,
  /**
   * @see module:core/HOST.TextToSpeechUtils
   */
  TextToSpeechUtils,
  /**
   * @see babylonjs/Speech
   */
  Speech,
  /**
   * @see babylonjs/LexFeature
   */
  LexFeature,
  /**
   * @see module:core/LexUtils
   */
  LexUtils,
};
