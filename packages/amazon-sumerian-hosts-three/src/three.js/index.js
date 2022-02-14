// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module three/HOST
 */

import Utils from '@amazon-sumerian-hosts/core';
import MathUtils from '@amazon-sumerian-hosts/core';
import Deferred from '@amazon-sumerian-hosts/core';
import LipsyncFeature, {DefaultVisemeMap} from '@amazon-sumerian-hosts/core';
import GestureFeature, {DefaultGestureWords} from '@amazon-sumerian-hosts/core';
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
   * @see three.js/Messenger
   */
  Messenger,
  /**
   * @see three.js/HostObject
   */
  HostObject,
  /**
   * @see @amazon-sumerian-hosts/core/index/LipsyncFeature
   */
  LipsyncFeature,
  /**
   * @see GestureFeature
   */
  GestureFeature,
  /**
   * @see three.js/PointOfInterestFeature
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
   * @see module:three/awspack
   */
  aws,
  /**
   * @see module:three/animpack
   */
  anim,
};
