// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module babylonjs/HOST
 */

import {
  Utils,
  MathUtils,
  Deferred,
  LipsyncFeature,
  DefaultVisemeMap,
  GestureFeature,
  DefaultGestureWords,
  Messenger,
} from '@amazon-sumerian-hosts/core';

import PointOfInterestFeature, {AxisMap} from './PointOfInterestFeature.js';
import {env} from './HostEnvironment.js';
import HostObject from './HostObject.js';

import aws from './awspack/index.js';
import anim from './animpack/index.js';

export {
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
   * @see env
   */
  env,
  /**
   * @see AxisMap
   */
  AxisMap,
  /**
   * @see babylonjs/PointOfInterestFeature
   */
  PointOfInterestFeature,
  /**
   * @see module:core/Messenger
   */
  Messenger,
  /**
   * @see babylonjs/HostObject
   */
  HostObject,
  /**
   * @see module:babylonjs/awspack
   */
  aws,
  /**
   * @see module:babylonjs/animpack
   */
  anim,
};
