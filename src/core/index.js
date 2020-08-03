// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module core/HOST
 */

import Utils from './Utils';
import MathUtils from './MathUtils';
import Deferred from './Deferred';
import {env} from './HostEnvironment';
import Messenger from './Messenger';
import HostObject from './HostObject';
import LipsyncFeature, {DefaultVisemeMap} from './LipsyncFeature';
import GestureFeature, { DefaultGestureWords } from './GestureFeature';
import PointOfInterestFeature, { AxisMap } from './PointOfInterestFeature';

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
   * @see core/Messenger
   */
  Messenger,
  /**
   * @see core/HostObject
   */
  HostObject,
  /**
   * @see core/LipsyncFeature
   */
  LipsyncFeature,
  /**
   * @see GestureFeature
   */
  GestureFeature,
  /**
   * @see core/PointOfInterestFeature
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
   * @see module:core/awspack
   */
  aws,
  /**
   * @see module:core/animpack
   */
  anim,
};
