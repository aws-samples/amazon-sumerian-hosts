import HOST from '@amazon-sumerian-hosts/babylon';
import DemoUtils from './common/demo-utils';
import cognitoIdentityPoolId from './common/demo-credentials';

let host;
let scene;

async function createScene() {
  // Create an empty scene. IMPORTANT: Sumerian Hosts require use of the
  // right-hand coordinate system!
  scene = new BABYLON.Scene();
  scene.useRightHandedSystem = true; // IMPORTANT for Sumerian Hosts!

  const { shadowGenerator } = DemoUtils.setupSceneEnvironment(scene);

  // Adjust the camera's target.
  scene.activeCamera.setTarget(new BABYLON.Vector3(0, 0.5, 0));

  initUi();

  // ===== Configure the AWS SDK =====

  AWS.config.region = cognitoIdentityPoolId.split(':')[0];
  AWS.config.credentials = new AWS.CognitoIdentityCredentials(
    { IdentityPoolId: cognitoIdentityPoolId },
  );

  // ===== Instantiate the Sumerian Host =====

  const pollyConfig = { pollyVoice: 'Ivy', pollyEngine: 'neural' };

  // Create a characterConfig object describing the custom character and its
  // assets.
  const characterConfig = {
    modelUrl: './character-assets/characters/alien/alien.gltf',
    gestureConfigUrl: './character-assets/animations/alien/gesture.json',
    pointOfInterestConfigUrl: './character-assets/animations/alien/poi.json',
    animStandIdleUrl: './character-assets/animations/alien/stand_idle.glb',
    animLipSyncUrl: './character-assets/animations/alien/lipsync.glb',
    animGestureUrl: './character-assets/animations/alien/gesture.glb',
    animEmoteUrl: './character-assets/animations/alien/emote.glb',
    animFaceIdleUrl: './character-assets/animations/alien/face_idle.glb',
    animBlinkUrl: './character-assets/animations/alien/blink.glb',
    animPointOfInterestUrl: './character-assets/animations/alien/poi.glb',
    lookJoint: 'char:gaze',
  }

  host = await HOST.HostObject.createHost(scene, characterConfig, pollyConfig);

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