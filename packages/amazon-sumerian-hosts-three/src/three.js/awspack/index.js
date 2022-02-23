// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {TextToSpeechUtils, LexUtils} from '@amazon-sumerian-hosts/core';
import TextToSpeechFeature from './TextToSpeechFeature';
import LexFeature from './LexFeature';
import Speech from './Speech';

/**
 * @module three/awspack
 */

export default {
  /**
   * @see three.js/TextToSpeechFeature
   */
  TextToSpeechFeature,
  /**
   * @see core/TextToSpeechUtils
   */
  TextToSpeechUtils,
  /**
   * @see three.js/Speech
   */
  Speech,
  /**
   * @see three.js/LexFeature
   */
  LexFeature,
  /**
   * @see core/LexUtils
   */
  LexUtils
};
