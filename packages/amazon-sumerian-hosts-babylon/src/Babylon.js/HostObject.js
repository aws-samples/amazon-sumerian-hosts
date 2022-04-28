// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {
  HostObject as CoreHostObject,
  LipsyncFeature,
  GestureFeature,
} from '@amazon-sumerian-hosts/core';
import {SceneLoader} from '@babylonjs/core/Loading/sceneLoader';
import {PrecisionDate} from '@babylonjs/core/Misc/precisionDate';
import {Observable} from '@babylonjs/core/Misc/observable';
import {AnimationGroup} from '@babylonjs/core/Animations/animationGroup';
// eslint-disable-next-line no-unused-vars
import {RawTexture} from '@babylonjs/core/Materials/Textures/rawTexture';
import '@babylonjs/loaders';
import AWS from 'aws-sdk';
import anim from './animpack';
import aws from './awspack';
import PointOfInterestFeature from './PointOfInterestFeature';

/**
 * @extends core/HostObject
 * @alias babylonjs/HostObject
 */
class HostObject extends CoreHostObject {
  /**
   * @constructor
   *
   * @param {Object=} options - Options for the host.
   * @param {Object=} options.owner - Optional engine-specific owner of the host.
   */
  constructor(options = {}) {
    super(options);

    if (this._owner) {
      Object.defineProperty(this, 'deltaTime', {
        get: () => {
          return this._owner.getEngine().getDeltaTime();
        },
      });
    }
    this._events = {};
  }

  get now() {
    return PrecisionDate.Now;
  }

  _createListener(callback) {
    return value => {
      callback(value);
    };
  }

  _addListener(message, listener) {
    this._events[message].add(listener);
  }

  _removeListener(message, listener) {
    this._events[message].removeCallback(listener);
  }

  listenTo(message, callback) {
    if (this._events[message] === undefined) {
      this._events[message] = new Observable();
    }

    try {
      super.listenTo(message, callback);
    } catch (e) {
      // Clean up the observable if nothing is listening to it
      if (!this._events[message].hasObservers()) {
        delete this._events[message];

        throw e;
      }
    }
  }

  stopListening(message, callback) {
    const event = this._events[message];

    if (event === undefined) {
      return;
    }

    super.stopListening(message, callback);

    if (!event.hasObservers()) {
      delete this._events[message];
    }
  }

  emit(message, value) {
    const event = this._events[message];

    if (event === undefined) {
      return;
    }

    event.notifyObservers(value);
  }

  /**
   *
   * @param {AWS.Polly=} polly An AWS Polly service client, assumed to have the proper
   *     credentials and configuration.
   * @param {AWS.Polly.presigner=} presigner The presigner used for Polly calls
   */
  static async initTextToSpeech(polly, presigner) {
    // Ensure services get initialized only once per session.
    if (aws.TextToSpeechFeature.isReady) return;

    // Enable Polly service functionality if necessary.
    if (typeof polly === 'undefined') {
      polly = new AWS.Polly();
    }
    if (typeof presigner === 'undefined') {
      presigner = new AWS.Polly.Presigner();
    }

    await aws.TextToSpeechFeature.initializeService(
      polly,
      presigner,
      AWS.VERSION
    );
  }

  /**
   * @typedef {Object} SumerianLoadedAnimations
   * @property {AnimationGroup[]} idleClips
   * @property {AnimationGroup[]} lipSyncClips
   * @property {AnimationGroup[]} gestureClips
   * @property {AnimationGroup[]} emoteClips
   * @property {AnimationGroup[]} faceClips
   * @property {AnimationGroup[]} blinkClips
   * @property {AnimationGroup[]} poiClips
   */

  /**
   * @typedef {Object} SumerianHostLoadedAssets
   * @property {Mesh} characterMesh - The loaded character mesh
   * @property {SumerianLoadedAnimations} animClips - The loaded animations
   * @property {AnimationGroup} bindPoseOffset
   * @property {Object} gestureConfig - see "3d-assets/animations/adult_female/gesture.json" for reference
   * @property {Object} poiConfig - see "3d-assets/animations/adult_female/poi.json" for reference
   */

  /**
   * @typedef {Object} SumerianAnimationsConfig
   * @property {string} animStandIdleUrl
   * @property {string} animLipSyncUrl
   * @property {string} animGestureUrl
   * @property {string} animEmoteUrl
   * @property {string} animFaceIdleUrl
   * @property {string} animBlinkUrl
   * @property {string} animPointOfInterestUrl
   */

  /**
   * @typedef {Object} SumerianCharacterConfig
   * @property {string} modelUrl - The path to the .gltf file
   * @property {string} gestureConfigUrl
   * @property {string} pointOfInterestConfigUrl
   * @property {SumerianAnimationsConfig} animUrls
   */

  /**
   * @typedef {Object} SumerianPollyConfig
   * @property {AWS.Polly=} pollyClient - The reference to the Polly service client to use.
   * @property {AWS.Polly.presigner=} pollyPresigner - The reference to the Polly presigner to use.
   * @property {string} pollyVoice - The Polly voice to use. See
   *   {@link https://docs.aws.amazon.com/polly/latest/dg/voicelist.html}
   * @property {string} pollyEngine - The Polly engine you would like to
   *   use. Either "standard" or "neural". Note that the neural engine incurs a
   *   higher cost and is not compatible with all voices or regions. See
   *   {@link https://docs.aws.amazon.com/polly/latest/dg/NTTS-main.html}
   */

  /**
   * @typedef {Object} SumerianLoadedAnimation
   * @property {string} clipGroupId
   * @property {AnimationGroup[]} clips
   */

  /**
   * Loads the assets that comprise a host character.
   *
   * @private
   *
   * @param {Scene} scene
   * @param {SumerianCharacterConfig} characterConfig
   * @return {SumerianHostLoadedAssets}
   */
  static async loadAssets(
    scene,
    {modelUrl, animUrls, gestureConfigUrl, pointOfInterestConfigUrl}
  ) {
    const characterAsset = await this.loadCharacterMesh(scene, modelUrl);
    const characterMesh = characterAsset.meshes[0];
    const bindPoseOffset = characterAsset.animationGroups[0];

    const animClips = await this.loadCharacterAnimations(
      scene,
      characterMesh,
      bindPoseOffset,
      animUrls
    );

    // Load the gesture config file. This file contains options for splitting up
    // each animation in gestures.glb into 3 sub-animations and initializing them
    // as a QueueState animation.
    const gestureConfig = await this.loadJson(gestureConfigUrl);

    // Read the point of interest config file. This file contains options for
    // creating Blend2dStates from look pose clips and initializing look layers
    // on the PointOfInterestFeature.
    const poiConfig = await this.loadJson(pointOfInterestConfigUrl);

    return {characterMesh, animClips, bindPoseOffset, gestureConfig, poiConfig};
  }

  /**
   * Loads the gltf file that comprises a character model,
   * and adds it to the scene to be rendered.
   *
   * @param {Scene} scene
   * @param {string} modelUrl The absolute path to the gltf file that contains the model
   * @return {AssetContainer} A BabylonJS asset container that contains the loaded meshes
   */
  static async loadCharacterMesh(scene, modelUrl) {
    // Load character model
    const characterAsset = await SceneLoader.LoadAssetContainerAsync(
      modelUrl,
      undefined,
      scene
    );
    characterAsset.addAllToScene();

    return characterAsset;
  }

  /**
   * Loads the animations for a host character
   *
   * @param {Scene} scene
   * @param {Mesh} characterMesh The root mesh of the character model
   * @param {AnimationGroup} bindPoseOffset
   * @param {SumerianAnimationsConfig} animClipUrls
   * @return {SumerianLoadedAnimations}
   */
  static async loadCharacterAnimations(
    scene,
    characterMesh,
    bindPoseOffset,
    {
      animStandIdleUrl,
      animLipSyncUrl,
      animGestureUrl,
      animEmoteUrl,
      animFaceIdleUrl,
      animBlinkUrl,
      animPointOfInterestUrl,
    }
  ) {
    // Make the offset pose additive
    if (bindPoseOffset) {
      AnimationGroup.MakeAnimationAdditive(bindPoseOffset);
    }

    const childMeshes = characterMesh.getDescendants(false);

    const animationLoadingPromises = [
      this.loadAnimation(scene, childMeshes, animStandIdleUrl, 'idleClips'),
      this.loadAnimation(scene, childMeshes, animLipSyncUrl, 'lipSyncClips'),
      this.loadAnimation(scene, childMeshes, animGestureUrl, 'gestureClips'),
      this.loadAnimation(scene, childMeshes, animEmoteUrl, 'emoteClips'),
      this.loadAnimation(scene, childMeshes, animFaceIdleUrl, 'faceClips'),
      this.loadAnimation(scene, childMeshes, animBlinkUrl, 'blinkClips'),
      this.loadAnimation(
        scene,
        childMeshes,
        animPointOfInterestUrl,
        'poiClips'
      ),
    ];

    const animLoadingResults = await Promise.all(animationLoadingPromises);

    const animClips = {};
    animLoadingResults.forEach(result => {
      animClips[result.clipGroupId] = result.clips;
    });

    return animClips;
  }

  /**
   * Loads animations into the provided scene.
   *
   * @param {Scene} scene
   * @param {Mesh[]} childMeshes
   * @param {string} url
   *   URL of a 3D file containing animations (.gltf or .glb)
   * @param {string} clipGroupId
   *   An ID of your choosing for labeling the group.
   * @returns {Promise<SumerianLoadedAnimation>}
   */
  static async loadAnimation(scene, childMeshes, url, clipGroupId) {
    const container = await SceneLoader.LoadAssetContainerAsync(
      url,
      undefined,
      scene
    );

    const startingIndex = scene.animatables.length;
    const firstIndex = scene.animationGroups.length;

    // Apply animation to character
    container.mergeAnimationsTo(
      scene,
      scene.animatables.slice(startingIndex),
      target => childMeshes.find(mesh => mesh.name === target.name) || null
    );

    // Find the new animations and destroy the container
    const clips = scene.animationGroups.slice(firstIndex);
    container.dispose();
    scene.onAnimationFileImportedObservable.notifyObservers(scene);

    return {clipGroupId, clips};
  }

  /**
   * Set up animations on a host - gestures, lipsync, etc - and start rendering them in the scene
   * @param {SumerianHostLoadedAssets} assets
   * @param {Scene} scene
   */
  static assembleHost(assets, scene) {
    const {characterMesh} = assets;

    // Add the host to the render loop
    const host = new HostObject({owner: assets.characterMesh});
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
      {clip: idleClip}
    );
    host.AnimationFeature.playAnimation('Base', idleClip.name);

    // Face idle
    const faceIdleClip = faceClips[0];
    host.AnimationFeature.addLayer('Face', {
      blendMode: anim.LayerBlendModes.Additive,
    });
    AnimationGroup.MakeAnimationAdditive(faceIdleClip);
    host.AnimationFeature.addAnimation(
      'Face',
      faceIdleClip.name,
      anim.AnimationTypes.single,
      {
        clip: faceIdleClip,
        from: 1 / 30,
        to: faceIdleClip.to,
      }
    );
    host.AnimationFeature.playAnimation('Face', faceIdleClip.name);

    // Blink
    host.AnimationFeature.addLayer('Blink', {
      blendMode: anim.LayerBlendModes.Additive,
      transitionTime: 0.075,
    });
    blinkClips.forEach(clip => {
      AnimationGroup.MakeAnimationAdditive(clip);
    });
    host.AnimationFeature.addAnimation(
      'Blink',
      'blink',
      anim.AnimationTypes.randomAnimation,
      {
        playInterval: 3,
        subStateOptions: blinkClips.map(clip => ({
          name: clip.name,
          loopCount: 1,
          clip,
        })),
      }
    );
    host.AnimationFeature.playAnimation('Blink', 'blink');

    // Talking idle
    host.AnimationFeature.addLayer('Talk', {
      transitionTime: 0.75,
      blendMode: anim.LayerBlendModes.Additive,
    });
    host.AnimationFeature.setLayerWeight('Talk', 0);
    const talkClip = lipSyncClips.find(c => c.name === 'stand_talk');
    AnimationGroup.MakeAnimationAdditive(talkClip);
    lipSyncClips.splice(lipSyncClips.indexOf(talkClip), 1);
    host.AnimationFeature.addAnimation(
      'Talk',
      talkClip.name,
      anim.AnimationTypes.single,
      {clip: talkClip}
    );
    host.AnimationFeature.playAnimation('Talk', talkClip.name);

    // Gesture animations
    host.AnimationFeature.addLayer('Gesture', {
      transitionTime: 0.5,
      blendMode: anim.LayerBlendModes.Additive,
    });

    gestureClips.forEach(clip => {
      const {name} = clip;
      const config = assets.gestureConfig[name];
      AnimationGroup.MakeAnimationAdditive(clip);

      if (config !== undefined) {
        // Add the clip to each queueOption so it can be split up
        config.queueOptions.forEach(option => {
          option.clip = clip;
          option.to /= 30.0;
          option.from /= 30.0;
        });
        host.AnimationFeature.addAnimation(
          'Gesture',
          name,
          anim.AnimationTypes.queue,
          config
        );
      } else {
        host.AnimationFeature.addAnimation(
          'Gesture',
          name,
          anim.AnimationTypes.single,

          {clip}
        );
      }
    });

    // Emote animations
    host.AnimationFeature.addLayer('Emote', {transitionTime: 0.5});

    emoteClips.forEach(clip => {
      const {name} = clip;
      host.AnimationFeature.addAnimation(
        'Emote',
        name,
        anim.AnimationTypes.single,

        {
          clip,
          loopCount: 1,
        }
      );
    });

    // Viseme poses
    host.AnimationFeature.addLayer('Viseme', {
      transitionTime: 0.12,
      blendMode: anim.LayerBlendModes.Additive,
    });
    host.AnimationFeature.setLayerWeight('Viseme', 0);
    const blendStateOptions = lipSyncClips.map(clip => {
      AnimationGroup.MakeAnimationAdditive(clip);
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

      {blendStateOptions}
    );
    host.AnimationFeature.playAnimation('Viseme', 'visemes');

    // POI poses
    const children = characterMesh.getDescendants(false);
    assets.poiConfig.forEach(config => {
      host.AnimationFeature.addLayer(config.name, {
        blendMode: anim.LayerBlendModes.Additive,
      });

      // Find each pose clip and make it additive
      config.blendStateOptions.forEach(clipConfig => {
        const clip = poiClips.find(poiClip => poiClip.name === clipConfig.clip);
        AnimationGroup.MakeAnimationAdditive(clip);
        clipConfig.clip = clip;
        clipConfig.from = 1 / 30;
        clipConfig.to = 2 / 30;
      });

      host.AnimationFeature.addAnimation(
        config.name,
        config.animation,
        anim.AnimationTypes.blend2d,

        {...config}
      );

      host.AnimationFeature.playAnimation(config.name, config.animation);

      // Find and store the reference object
      config.reference = children.find(
        child => child.name === config.reference
      );
    });

    // Apply bindPoseOffset clip if it exists
    const {bindPoseOffset} = assets;
    if (bindPoseOffset !== undefined) {
      host.AnimationFeature.addLayer('BindPoseOffset', {
        blendMode: anim.LayerBlendModes.Additive,
      });
      host.AnimationFeature.addAnimation(
        'BindPoseOffset',
        bindPoseOffset.name,
        anim.AnimationTypes.single,

        {
          clip: bindPoseOffset,
          from: 1 / 30,
          to: 2 / 30,
        }
      );
      host.AnimationFeature.playAnimation(
        'BindPoseOffset',
        bindPoseOffset.name
      );
    }

    // Set up Lipsync
    const visemeOptions = {
      layers: [
        {
          name: 'Viseme',
          animation: 'visemes',
        },
      ],
    };
    const talkingOptions = {
      layers: [
        {
          name: 'Talk',
          animation: 'stand_talk',
          blendTime: 0.75,
          easingFn: anim.Easing.Quadratic.InOut,
        },
      ],
    };
    host.addFeature(LipsyncFeature, false, visemeOptions, talkingOptions);

    // Set up Gestures
    host.addFeature(GestureFeature, false, {
      layers: {
        Gesture: {minimumInterval: 3},
        Emote: {
          blendTime: 0.5,
          easingFn: anim.Easing.Quadratic.InOut,
        },
      },
    });

    return host;
  }

  /**
   *
   * @param {HostObject} host
   * @param {Scene} scene
   * @param {string} voice
   * @param {string} engine
   * @param {string} language Default: 'en-US'
   * @param {string} audioJointName The identifier of the joint to attach the audio to. Default: 'char:def_c_neckB'
   */
  static addTextToSpeech(
    host,
    scene,
    voice,
    engine,
    language = 'en-US',
    audioJointName = 'char:def_c_neckB'
  ) {
    const joints = host.owner.getDescendants(false);
    const audioJoint = joints.find(joint => joint.name === audioJointName);

    host.addFeature(aws.TextToSpeechFeature, false, {
      scene,
      attachTo: audioJoint,
      voice,
      engine,
      language,
    });
  }

  /**
   * Enable point of interest tracking on the host
   * @param {HostObject} host
   * @param {Scene} scene
   * @param {Object} poiConfig
   * @param {string} lookJointName Default: 'char:jx_c_look'
   */
  static addPointOfInterestTracking(
    host,
    scene,
    poiConfig,
    lookJointName = 'char:jx_c_look'
  ) {
    const joints = host.owner.getDescendants(false);
    const lookJoint = joints.find(joint => joint.name === lookJointName);

    PointOfInterestFeature.useRightHandCoordinateSystem =
      scene.useRightHandedSystem;
    host.addFeature(
      PointOfInterestFeature,
      false,
      {lookTracker: lookJoint, scene},
      {layers: poiConfig},
      {layers: [{name: 'Blink'}]}
    );
  }

  /**
   * Reads JSON file
   * @param {string} url
   * @returns JSON from file
   */
  static async loadJson(url) {
    const response = await fetch(url);
    const json = await response.json();
    return json;
  }

  /**
   * Returns a config object describing the assets that comprise one of the
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
   * @param {string} assetsPath A relative path from the HTML page to the directory containing the
   * "characters" and "animations" folders for the built-in host characters.
   * @param {string} characterId The ID of the character to be used.
   * @returns {SumerianCharacterConfig}
   */
  static getCharacterConfig(assetsPath, characterId) {
    if (characterTypeMap.get(characterId) === undefined) {
      throw new Error(`"${characterId}" is not a supported character ID.`);
    }

    const characterConfigs = new Map();

    characterTypeMap.forEach((characterType, characterId) => {
      // Convert char ID to lowercase to match filenames on disk.
      const characterIdLower = characterId.toLowerCase();
      const characterConfig = {
        modelUrl: `${assetsPath}/characters/${characterType}/${characterIdLower}/${characterIdLower}.gltf`,
        gestureConfigUrl: `${assetsPath}/animations/${characterType}/gesture.json`,
        pointOfInterestConfigUrl: `${assetsPath}/animations/${characterType}/poi.json`,
        animUrls: {
          animStandIdleUrl: `${assetsPath}/animations/${characterType}/stand_idle.glb`,
          animLipSyncUrl: `${assetsPath}/animations/${characterType}/lipsync.glb`,
          animGestureUrl: `${assetsPath}/animations/${characterType}/gesture.glb`,
          animEmoteUrl: `${assetsPath}/animations/${characterType}/emote.glb`,
          animFaceIdleUrl: `${assetsPath}/animations/${characterType}/face_idle.glb`,
          animBlinkUrl: `${assetsPath}/animations/${characterType}/blink.glb`,
          animPointOfInterestUrl: `${assetsPath}/animations/${characterType}/poi.glb`,
        },
        lookJoint: 'char:jx_c_look',
      };

      characterConfigs.set(characterId, characterConfig);
    });

    return characterConfigs.get(characterId);
  }

  /**
   * Creates a new Sumerian Host from the assets listed in the `characterConfig`
   * parameter. This can be used to create one of the built-in hosts or your own
   * custom host.
   *
   * When creating a custom host, use `HOST.HostObject.getCharacterConfig()` to
   * retrieve the appropriate config for that character. (See example below.)
   *
   * **Example**:
```
const characterId = 'Cristine';
const characterConfig = HOST.HostUtils.getCharacterConfig('./assets/character-assets', characterId);
const pollyConfig = { pollyVoice: 'Joanna', pollyEngine: 'neural' };
const host = await HOST.HostUtils.createHost(scene, characterConfig, pollyConfig);
```
   *
   * @param {Scene} scene The scene to add the host to.
   * @param {SumerianCharacterConfig} characterConfig
   * @param {SumerianPollyConfig} pollyConfig
   * @param {string} lookJoint The name of the joint to use for point-of-interest
   * tracking. Defaults to 'char:jx_c_look' which is the appropriate value for
   * the built-in host characters. Custom characters may need to specify a
   * different joint name.
   *
   * @returns {HostObject} A functioning Sumerian Host
   */
  static async createHost(scene, characterConfig, pollyConfig) {
    await this.initTextToSpeech(
      pollyConfig.pollyClient,
      pollyConfig.pollyPresigner
    );
    const assets = await this.loadAssets(scene, characterConfig);
    const host = this.assembleHost(assets, scene);
    this.addTextToSpeech(
      host,
      scene,
      pollyConfig.pollyVoice,
      pollyConfig.pollyEngine
    );
    this.addPointOfInterestTracking(
      host,
      scene,
      assets.poiConfig,
      characterConfig.lookJoint
    );

    return host;
  }

  /**
   *
   * @returns {string[]} An array of characterId's that can be used with getCharacterConfig
   */
  static getAvailableCharacters() {
    return [...characterTypeMap.keys()];
  }
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

export default HostObject;
