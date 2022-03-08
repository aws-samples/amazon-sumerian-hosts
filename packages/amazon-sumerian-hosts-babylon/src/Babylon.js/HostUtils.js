// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * The HOST.HostUtils module provides helper functions for instantiating Sumerian Hosts.
 * @namespace babylonjs/HostUtils
 *
 * @example
const characterId = 'Cristine';
const characterConfig = HOST.HostUtils.getCharacterConfig('./assets/character-assets', characterId);
const pollyConfig = { pollyVoice: 'Joanna', pollyEngine: 'neural' };
const host = await HOST.HostUtils.createHost(scene, characterConfig, pollyConfig);
 */

/* eslint-disable no-param-reassign */

import { LipsyncFeature, GestureFeature } from '@amazon-sumerian-hosts/core';
import anim from './animpack';
import aws from './awspack';
import HostObject from './HostObject';
import PointOfInterestFeature from './PointOfInterestFeature';

let isTextToSpeechInitialized = false;

/**
 * Creates a new Sumerian Host from the assets listed in the characterConfig
 * parameter. This can be used to create one of the built-in hosts or your own
 * custom host.
 *
 * When creating a custom host, use SumerianHostUtils.getCharacterConfig() to
 * retrieve the appropriate config for that character.
 *
 * @memberof babylonjs/HostUtils
 * @param {BABYLON.Scene} scene The scene to add the host to.
 * @param {Object} characterConfig
 * @param {String} characterConfig.modelUrl
 * @param {String} characterConfig.animStandIdleUrl
 * @param {String} characterConfig.animLipSyncUrl
 * @param {String} characterConfig.animGestureUrl
 * @param {String} characterConfig.animEmoteUrl
 * @param {String} characterConfig.animFaceIdleUrl
 * @param {String} characterConfig.animBlinkUrl
 * @param {String} characterConfig.animPointOfInterestUrl
 * @param {Object} pollyConfig
 * @param {string} pollyConfig.pollyVoice The Polly voice to use. See
 *   {@link https://docs.aws.amazon.com/polly/latest/dg/voicelist.html}
 * @param {string} pollyConfig.pollyEngine The Polly engine you would like to
 *   use. Either "standard" or "neural". Note that the neural engine incurs a
 *   higher cost and is not compatible with all voices or regions. See
 *   {@link https://docs.aws.amazon.com/polly/latest/dg/NTTS-main.html}
 *
 * @returns {babylonjs/HostObject} A functioning Sumerian Host
 */
async function createHost(scene, characterConfig, pollyConfig) {
  await initTextToSpeech();
  const assets = await loadAssets(scene, characterConfig);
  const host = assembleHost(assets, scene);
  addTextToSpeech(host, scene, pollyConfig.pollyVoice, pollyConfig.pollyEngine);
  addPointOfInterestTracking(host, scene, assets.poiConfig);

  return host;
}

/**
 * @private
 */
async function initTextToSpeech() {
  // Ensure services get initialized only once per session.
  if (isTextToSpeechInitialized) return;
  isTextToSpeechInitialized = true;

  // Enable Polly service functionality.
  const polly = new AWS.Polly();
  const presigner = new AWS.Polly.Presigner();
  await aws.TextToSpeechFeature.initializeService(polly, presigner, AWS.VERSION);
}

/**
 * Loads the assets that comprise a host character.
 *
 * @private
 *
 * @param {*} scene
 * @param {*} characterConfig See the createHost() function docs above.
 * @return {Object} An object containing the loaded assets organized as follows:
 ```
{
  characterMesh: BABYLON.Mesh,
  animClips: {
    idleClips: BABYLON.AnimationGroup[],
    lipSyncClips: BABYLON.AnimationGroup[],
    gestureClips: BABYLON.AnimationGroup[],
    emoteClips: BABYLON.AnimationGroup[],
    faceClips: BABYLON.AnimationGroup[],
    blinkClips: BABYLON.AnimationGroup[],
    poiClips: BABYLON.AnimationGroup[],
  }
  bindPoseOffset: BABYLON.AnimationGroup,
  gestureConfig: Object,  // see "3d-assets/animations/adult_female/gesture.json" for reference
  poiConfig: Object  // see "3d-assets/animations/adult_female/poi.json" for reference
}
 ```
 */
async function loadAssets(
  scene,
  {
    modelUrl,
    animStandIdleUrl,
    animLipSyncUrl,
    animGestureUrl,
    animEmoteUrl,
    animFaceIdleUrl,
    animBlinkUrl,
    animPointOfInterestUrl,
    gestureConfigUrl,
    pointOfInterestConfigUrl,
  },
) {
  // Load character model
  const characterAsset = await BABYLON.SceneLoader.LoadAssetContainerAsync(modelUrl);
  const characterMesh = characterAsset.meshes[0];
  const bindPoseOffset = characterAsset.animationGroups[0];

  // Make the offset pose additive
  if (bindPoseOffset) {
    BABYLON.AnimationGroup.MakeAnimationAdditive(bindPoseOffset);
  }

  characterAsset.addAllToScene();

  const childMeshes = characterMesh.getDescendants(false);

  const animationLoadingPromises = [
    loadAnimation(scene, childMeshes, animStandIdleUrl, 'idleClips'),
    loadAnimation(scene, childMeshes, animLipSyncUrl, 'lipSyncClips'),
    loadAnimation(scene, childMeshes, animGestureUrl, 'gestureClips'),
    loadAnimation(scene, childMeshes, animEmoteUrl, 'emoteClips'),
    loadAnimation(scene, childMeshes, animFaceIdleUrl, 'faceClips'),
    loadAnimation(scene, childMeshes, animBlinkUrl, 'blinkClips'),
    loadAnimation(scene, childMeshes, animPointOfInterestUrl, 'poiClips'),
  ];

  const animLoadingResults = await Promise.all(animationLoadingPromises);

  const animClips = {};
  animLoadingResults.forEach((result) => {
    animClips[result.clipGroupId] = result.clips;
  });

  // Load the gesture config file. This file contains options for splitting up
  // each animation in gestures.glb into 3 sub-animations and initializing them
  // as a QueueState animation.
  const gestureConfig = await loadJson(gestureConfigUrl);

  // Read the point of interest config file. This file contains options for
  // creating Blend2dStates from look pose clips and initializing look layers
  // on the PointOfInterestFeature.
  const poiConfig = await loadJson(pointOfInterestConfigUrl);

  return { characterMesh, animClips, bindPoseOffset, gestureConfig, poiConfig };
}

/**
 * Loads animations into the provided scene.
 *
 * @private
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.Mesh[]} childMeshes
 * @param {string} url
 *   URL of a 3D file containing animations (.gltf or .glb)
 * @param {string} clipGroupId
 *   An ID of your choosing for labeling the group.
 * @returns {Promise}
 *   A promise that resolves to an object with this shape:
 ```
{
   clipGroupId: string,
   clips: BABYLON.AnimationGroup[]
}
 ````
 */
async function loadAnimation(scene, childMeshes, url, clipGroupId) {
  const promise = BABYLON.SceneLoader.LoadAssetContainerAsync(url)
    .then(
      (container) => {
        const startingIndex = scene.animatables.length;
        const firstIndex = scene.animationGroups.length;

        // Apply animation to character
        container.mergeAnimationsTo(
          scene,
          scene.animatables.slice(startingIndex),
          (target) => childMeshes.find((mesh) => mesh.name === target.name) || null,
        );

        // Find the new animations and destroy the container
        const clips = scene.animationGroups.slice(firstIndex);
        container.dispose();
        scene.onAnimationFileImportedObservable.notifyObservers(scene);

        return { clipGroupId, clips };
      },
    );

  return promise;
}

/**
 * @private
 */
function assembleHost(assets, scene) {
  const {characterMesh} = assets;

  // Add the host to the render loop
  const host = new HostObject({ owner: assets.characterMesh });
  scene.onBeforeAnimationsObservable.add(() => {
    host.update();
  });

  // Set up animation
  host.addFeature(anim.AnimationFeature);

  const {
    idleClips,
    faceClips,
    lipSyncClips,
    gestureClips,
    emoteClips,
    blinkClips,
    poiClips,
  } = assets.animClips;

  // Base idle
  const idleClip = idleClips[0];
  host.AnimationFeature.addLayer('Base');
  host.AnimationFeature.addAnimation(
    'Base',
    idleClip.name,
    anim.AnimationTypes.single,
    { clip: idleClip },
  );
  host.AnimationFeature.playAnimation('Base', idleClip.name);

  // Face idle
  const faceIdleClip = faceClips[0];
  host.AnimationFeature.addLayer('Face', { blendMode: anim.LayerBlendModes.Additive });
  BABYLON.AnimationGroup.MakeAnimationAdditive(faceIdleClip);
  host.AnimationFeature.addAnimation(
    'Face',
    faceIdleClip.name,
    anim.AnimationTypes.single,
    {
      clip: faceIdleClip,
      from: 1 / 30,
      to: faceIdleClip.to,
    },
  );
  host.AnimationFeature.playAnimation('Face', faceIdleClip.name);

  // Blink
  host.AnimationFeature.addLayer('Blink', {
    blendMode: anim.LayerBlendModes.Additive,
    transitionTime: 0.075,
  });
  blinkClips.forEach((clip) => {
    BABYLON.AnimationGroup.MakeAnimationAdditive(clip);
  });
  host.AnimationFeature.addAnimation(
    'Blink',
    'blink',
    anim.AnimationTypes.randomAnimation,
    {
      playInterval: 3,
      subStateOptions: blinkClips.map((clip) => ({
        name: clip.name,
        loopCount: 1,
        clip,
      })),
    },
  );
  host.AnimationFeature.playAnimation('Blink', 'blink');

  // Talking idle
  host.AnimationFeature.addLayer('Talk', {
    transitionTime: 0.75,
    blendMode: anim.LayerBlendModes.Additive,
  });
  host.AnimationFeature.setLayerWeight('Talk', 0);
  const talkClip = lipSyncClips.find((c) => c.name === 'stand_talk');
  BABYLON.AnimationGroup.MakeAnimationAdditive(talkClip);
  lipSyncClips.splice(lipSyncClips.indexOf(talkClip), 1);
  host.AnimationFeature.addAnimation(
    'Talk',
    talkClip.name,
    anim.AnimationTypes.single,
    { clip: talkClip },
  );
  host.AnimationFeature.playAnimation('Talk', talkClip.name);

  // Gesture animations
  host.AnimationFeature.addLayer('Gesture', {
    transitionTime: 0.5,
    blendMode: anim.LayerBlendModes.Additive,
  });

  gestureClips.forEach((clip) => {
    const { name } = clip;
    const config = assets.gestureConfig[name];
    BABYLON.AnimationGroup.MakeAnimationAdditive(clip);

    if (config !== undefined) {
      // Add the clip to each queueOption so it can be split up
      config.queueOptions.forEach((option) => {
        option.clip = clip;
        option.to /= 30.0;
        option.from /= 30.0;
      });
      host.AnimationFeature.addAnimation(
        'Gesture',
        name,
        anim.AnimationTypes.queue,
        config,
      );
    } else {
      host.AnimationFeature.addAnimation(
        'Gesture',
        name,
        anim.AnimationTypes.single,

        { clip },
      );
    }
  });

  // Emote animations
  host.AnimationFeature.addLayer('Emote', { transitionTime: 0.5 });

  emoteClips.forEach((clip) => {
    const { name } = clip;
    host.AnimationFeature.addAnimation(
      'Emote',
      name,
      anim.AnimationTypes.single,

      {
        clip,
        loopCount: 1,
      },
    );
  });

  // Viseme poses
  host.AnimationFeature.addLayer('Viseme', {
    transitionTime: 0.12,
    blendMode: anim.LayerBlendModes.Additive,
  });
  host.AnimationFeature.setLayerWeight('Viseme', 0);
  const blendStateOptions = lipSyncClips.map((clip) => {
    BABYLON.AnimationGroup.MakeAnimationAdditive(clip);
    return {
      name: clip.name,
      clip,
      weight: 0,
      from: 1 / 30,
      to: 2 / 30,
    };
  });
  host.AnimationFeature.addAnimation(
    'Viseme',
    'visemes',
    anim.AnimationTypes.freeBlend,

    { blendStateOptions },
  );
  host.AnimationFeature.playAnimation('Viseme', 'visemes');

  // POI poses
  const children = characterMesh.getDescendants(false);
  assets.poiConfig.forEach((config) => {
    host.AnimationFeature.addLayer(config.name, { blendMode: anim.LayerBlendModes.Additive });

    // Find each pose clip and make it additive
    config.blendStateOptions.forEach((clipConfig) => {
      const clip = poiClips.find((poiClip) => poiClip.name === clipConfig.clip);
      BABYLON.AnimationGroup.MakeAnimationAdditive(clip);
      clipConfig.clip = clip;
      clipConfig.from = 1 / 30;
      clipConfig.to = 2 / 30;
    });

    host.AnimationFeature.addAnimation(
      config.name,
      config.animation,
      anim.AnimationTypes.blend2d,

      { ...config },
    );

    host.AnimationFeature.playAnimation(config.name, config.animation);

    // Find and store the reference object
    config.reference = children.find(
      (child) => child.name === config.reference,
    );
  });

  // Apply bindPoseOffset clip if it exists
  const {bindPoseOffset} = assets;
  if (bindPoseOffset !== undefined) {
    host.AnimationFeature.addLayer('BindPoseOffset', { blendMode: anim.LayerBlendModes.Additive });
    host.AnimationFeature.addAnimation(
      'BindPoseOffset',
      bindPoseOffset.name,
      anim.AnimationTypes.single,

      {
        clip: bindPoseOffset,
        from: 1 / 30,
        to: 2 / 30,
      },
    );
    host.AnimationFeature.playAnimation(
      'BindPoseOffset',
      bindPoseOffset.name,
    );
  }

  // Set up Lipsync
  const visemeOptions = {
    layers: [{
      name: 'Viseme',
      animation: 'visemes',
    }],
  };
  const talkingOptions = {
    layers: [{
      name: 'Talk',
      animation: 'stand_talk',
      blendTime: 0.75,
      easingFn: anim.Easing.Quadratic.InOut,
    }],
  };
  host.addFeature(
    LipsyncFeature,
    false,
    visemeOptions,
    talkingOptions,
  );

  // Set up Gestures
  host.addFeature(GestureFeature, false, {
    layers: {
      Gesture: { minimumInterval: 3 },
      Emote: {
        blendTime: 0.5,
        easingFn: anim.Easing.Quadratic.InOut,
      },
    },
  });

  return host;
}

/**
 * @private
 */
function addTextToSpeech(host, scene, voice, engine, audioJointName = 'char:def_c_neckB') {
  const joints = host.owner.getDescendants(false);
  const audioJoint = joints.find((joint) => joint.name === audioJointName);

  host.addFeature(
    aws.TextToSpeechFeature,
    false,
    { scene, attachTo: audioJoint, voice, engine },
  );
}

/**
 * @private
 */
function addPointOfInterestTracking(host, scene, poiConfig, lookJointName = 'char:jx_c_look') {
  const joints = host.owner.getDescendants(false);
  const lookJoint = joints.find((joint) => joint.name === lookJointName);

  host.addFeature(
    PointOfInterestFeature,
    false,
    { lookTracker: lookJoint, scene },
    { layers: poiConfig },
    { layers: [{ name: 'Blink' }] },
  );
}

/**
 * @private
 */
async function loadJson(url) {
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

// Map host IDs to a character type (either "adult_female" or "adult_male").
const characterTypeMap = new Map();
// Female characters
characterTypeMap.set('Cristine', 'adult_female');
characterTypeMap.set('Fiona', 'adult_female');
characterTypeMap.set('Grace', 'adult_female');
characterTypeMap.set('Maya', 'adult_female');
// Male characters
characterTypeMap.set('Jay', 'adult_male');
characterTypeMap.set('Luke', 'adult_male');
characterTypeMap.set('Preston', 'adult_male');
characterTypeMap.set('Wes', 'adult_male');

/**
 * Returns a config object describing the assets needed to build one of the
 * eight built-in Sumerian Host characters.
 *
 * Available character IDs are:
 * - "Cristine"
 * - "Fiona"
 * - "Grace"
 * - "Maya"
 * - "Jay"
 * - "Luke"
 * - "Preston"
 * - "Wes"
 *
 * The shape of the returned config object is:
 ```
{
  modelUrl: String,
  gestureConfigUrl: String,
  pointOfInterestConfigUrl: String,
  animStandIdleUrl: String,
  animLipSyncUrl: String,
  animGestureUrl: String,
  animEmoteUrl: String,
  animFaceIdleUrl: String,
  animBlinkUrl: String,
  animPointOfInterestUrl: String,
}
 ```
 * @memberof babylonjs/HostUtils
 * @param {string} assetsPath A relative path from the HTML page to the directory containing the
 * "characters" and "animations" folders for the built-in host characters.
 * @param {string} characterId The ID of the character to be used.
 */
function getCharacterConfig(assetsPath, characterId) {
  const characterConfigs = new Map();

  characterTypeMap.forEach((characterType, characterId) => {
    // Convert char ID to lowercase to match filenames on disk.
    const characterIdLower = characterId.toLowerCase();
    const characterConfig = {
      modelUrl: `${assetsPath}/characters/${characterType}/${characterIdLower}/${characterIdLower}.gltf`,
      gestureConfigUrl: `${assetsPath}/animations/${characterType}/gesture.json`,
      pointOfInterestConfigUrl: `${assetsPath}/animations/${characterType}/poi.json`,
      animStandIdleUrl: `${assetsPath}/animations/${characterType}/stand_idle.glb`,
      animLipSyncUrl: `${assetsPath}/animations/${characterType}/lipsync.glb`,
      animGestureUrl: `${assetsPath}/animations/${characterType}/gesture.glb`,
      animEmoteUrl: `${assetsPath}/animations/${characterType}/emote.glb`,
      animFaceIdleUrl: `${assetsPath}/animations/${characterType}/face_idle.glb`,
      animBlinkUrl: `${assetsPath}/animations/${characterType}/blink.glb`,
      animPointOfInterestUrl: `${assetsPath}/animations/${characterType}/poi.glb`,
    };

    characterConfigs.set(characterId, characterConfig);
  });

  return characterConfigs.get(characterId);
}

export default {
  createHost,
  getCharacterConfig
}