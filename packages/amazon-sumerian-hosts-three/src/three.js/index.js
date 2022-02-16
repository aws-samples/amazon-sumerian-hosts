// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module threejs/HOST
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
   * @see module:core/HOST.Utils
   */
  Utils,
  /**
   * @see module:core/HOST.MathUtils
   */
  MathUtils,
  /**
   * @see module:core/HOST.Deferred
   */
  Deferred,
  /**
   * @see module:core/HOST.LipsyncFeature
   */
  LipsyncFeature,
  /**
   * @see module:core/HOST.GestureFeature
   */
  GestureFeature,
  /**
   * @see module:core/HOST.DefaultVisemeMap
   */
  DefaultVisemeMap,
  /**
   * @see module:core/HOST.DefaultGestureWords
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
