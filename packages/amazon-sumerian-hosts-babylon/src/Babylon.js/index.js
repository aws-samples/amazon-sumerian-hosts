// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module babylon/HOST
 */

import { 
  Utils,
  MathUtils,
  Deferred,
  LipsyncFeature,
  DefaultVisemeMap,
  GestureFeature,
  DefaultGestureWords } from '@amazon-sumerian-hosts/core';

import PointOfInterestFeature, {AxisMap} from './PointOfInterestFeature';
import {env} from './HostEnvironment';
import Messenger from './Messenger';
import HostObject from './HostObject';

import aws from './awspack';
import anim from './animpack';

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
   * @see Babylon.js/Messenger
   */
  Messenger,
  /**
   * @see Babylon.js/HostObject
   */
  HostObject,
  /**
   * @see @amazon-sumerian-hosts/core/LipsyncFeature
   */
  LipsyncFeature,
  /**
   * @see GestureFeature
   */
  GestureFeature,
  /**
   * @see Babylon.js/PointOfInterestFeature
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
   * @see module:babylon/awspack
   */
  aws,
  /**
   * @see module:babylon/animpack
   */
  anim,
};
