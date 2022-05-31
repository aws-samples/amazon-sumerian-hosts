import {HostObject} from '@amazon-sumerian-hosts/babylon';
import {Scene} from '@babylonjs/core/scene';
import {Vector3} from '@babylonjs/core';
import DemoUtils from './common/demo-utils';

let host;
let scene;

async function createScene() {
  // Create an empty scene. Note: Sumerian Hosts work with both
  // right-hand or left-hand coordinate system for babylon scene
  scene = new Scene();
  scene.useRightHandedSystem = true;

  const {shadowGenerator} = DemoUtils.setupSceneEnvironment(scene);

  // Adjust the camera's target.
  scene.activeCamera.setTarget(new Vector3(0, 0.5, 0));

  initUi();

  // ===== Configure the AWS SDK =====

  // This is served by webpack-dev-server and comes from demo-credentials.js in the repo root
  // If you copy this example, you will substitute in your own cognito Pool ID
  const config = await (await fetch('/devConfig.json')).json();
  const cognitoIdentityPoolId = config.cognitoIdentityPoolId;

  AWS.config.region = cognitoIdentityPoolId.split(':')[0];
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: cognitoIdentityPoolId,
  });

  // ===== Instantiate the Sumerian Host =====

  const pollyConfig = {pollyVoice: 'Ivy', pollyEngine: 'neural'};

  // Create a characterConfig object describing the custom character and its
  // assets.
  const characterConfig = {
    modelUrl: './character-assets/characters/alien/alien.gltf',
    gestureConfigUrl: './character-assets/animations/alien/gesture.json',
    pointOfInterestConfigUrl: './character-assets/animations/alien/poi.json',
    animUrls: {
      animStandIdleUrl: './character-assets/animations/alien/stand_idle.glb',
      animLipSyncUrl: './character-assets/animations/alien/lipsync.glb',
      animGestureUrl: './character-assets/animations/alien/gesture.glb',
      animEmoteUrl: './character-assets/animations/alien/emote.glb',
      animFaceIdleUrl: './character-assets/animations/alien/face_idle.glb',
      animBlinkUrl: './character-assets/animations/alien/blink.glb',
      animPointOfInterestUrl: './character-assets/animations/alien/poi.glb',
    },
    lookJoint: 'char:gaze',
  };

  host = await HostObject.createHost(scene, characterConfig, pollyConfig);

  // Tell the host to always look at the camera.
  host.PointOfInterestFeature.setTarget(scene.activeCamera);

  // Enable shadows.
  scene.meshes.forEach(mesh => {
    shadowGenerator.addShadowCaster(mesh);
  });

  return scene;
}

function initUi() {
  document.getElementById('speakButton').onclick = speak.bind(this);
}

function speak() {
  const speech = document.getElementById('speechText').value;
  host.TextToSpeechFeature.play(speech);
}

DemoUtils.loadDemo(createScene);
