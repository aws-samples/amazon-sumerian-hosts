// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module hosts/threejs
 */

import {
  Utils,
  MathUtils,
  Deferred,
  LipsyncFeature,
  DefaultVisemeMap,
  GestureFeature,
  DefaultGestureWords,
} from '@amazon-sumerian-hosts/core';
import PointOfInterestFeature, {AxisMap} from './PointOfInterestFeature';
import {env} from './HostEnvironment';
import Messenger from './Messenger';
import HostObject from './HostObject';

import aws from './awspack';
import anim from './animpack';

export default {
  /**
   * @see module:hosts/core.Utils
   */
  Utils,
  /**
   * @see module:hosts/core.MathUtils
   */
  MathUtils,
  /**
   * @see module:hosts/core.Deferred
   */
  Deferred,
  /**
   * @see module:hosts/core.LipsyncFeature
   */
  LipsyncFeature,
  /**
   * @see module:hosts/core.GestureFeature
   */
  GestureFeature,
  /**
   * @see module:hosts/core.DefaultVisemeMap
   */
  DefaultVisemeMap,
  /**
   * @see module:hosts/core.DefaultGestureWords
   */
  DefaultGestureWords,
  /**
   * @see threejs/PointOfInterestFeature
   */
  PointOfInterestFeature,
  /**
   * @see env
   */
  env,
  /**
   * @see threejs/Messenger
   */
  Messenger,
  /**
   * @see threejs/HostObject
   */
  HostObject,
  /**
   * @see AxisMap
   */
  AxisMap,
  /**
   * @see module:threejs/awspack
   */
  aws,
  /**
   * @see module:threejs/animpack
   */
  anim,
};
