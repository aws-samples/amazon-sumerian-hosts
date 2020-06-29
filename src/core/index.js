// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * @module core/HOST
 */

import Utils from './Utils';
import Deferred from './Deferred';
import {env} from './HostEnvironment';
import Messenger from './Messenger';
import HostObject from './HostObject';
import LipsyncFeature, {DefaultVisemeMap} from './LipsyncFeature';
import GestureFeature, {DefaultGestureWords} from './GestureFeature';

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
   * @see DefaultVisemeMap
   */
  DefaultVisemeMap,
  /**
   * @see DefaultGestureWords
   */
  DefaultGestureWords,
  /**
   * @see module:core/awspack
   */
  aws,
  /**
   * @see module:core/animpack
   */
  anim,
};
