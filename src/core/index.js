// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Utils from './Utils';
import Deferred from './Deferred';
import {env} from './HostEnvironment';
import Messenger from './Messenger';
import HostObject from './HostObject';
import LipsyncFeature, {DefaultVisemeMap} from './LipsyncFeature';

import {TextToSpeechFeature, Speech} from './awspack';
import {
  AnimationFeature,
  AnimationLayer,
  SingleState,
  TransitionState,
  AnimationUtils,
  Easing,
  LayerBlendModes,
  DefaultLayerBlendMode,
  AnimationTypes,
} from './animpack';

const aws = {TextToSpeechFeature, Speech};
const anim = {
  AnimationFeature,
  AnimationLayer,
  SingleState,
  TransitionState,
  AnimationUtils,
  Easing,
  LayerBlendModes,
  DefaultLayerBlendMode,
  AnimationTypes,
};

export default {
  env,
  Utils,
  Deferred,
  Messenger,
  HostObject,
  LipsyncFeature,
  DefaultVisemeMap,
  aws,
  anim,
};
