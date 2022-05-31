import {HostObject} from '@amazon-sumerian-hosts/babylon';
import {Scene} from '@babylonjs/core/scene';
import DemoUtils from './common/demo-utils';

let host;
let scene;

async function createScene() {
  // Create an empty scene. Note: Sumerian Hosts work with both
  // right-hand or left-hand coordinate system for babylon scene
  scene = new Scene();
  scene.useRightHandedSystem = true;

  const {shadowGenerator} = DemoUtils.setupSceneEnvironment(scene);
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

  // Edit the characterId if you would like to use one of
  // the other pre-built host characters. Available character IDs are:
  // "Cristine", "Fiona", "Grace", "Maya", "Jay", "Luke", "Preston", "Wes"
  const characterId = 'Maya';
  const characterConfig = HostObject.getCharacterConfig(
    './character-assets',
    characterId
  );
  const pollyConfig = {pollyVoice: 'Joanna', pollyEngine: 'neural'};
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
  // Register Gesture menu handlers.
  const gestureSelect = document.getElementById('gestureSelect');
  gestureSelect.addEventListener('change', evt =>
    playGesture(evt.target.value)
  );

  // Register Emote menu handlers.
  const emoteSelect = document.getElementById('emoteSelect');
  emoteSelect.addEventListener('change', evt => playEmote(evt.target.value));

  // Reveal the UI.
  document.getElementById('uiPanel').classList.remove('hide');
}

function playGesture(name) {
  if (!name) return;

  // This options object is optional. It's included here to demonstrate the available options.
  const gestureOptions = {
    holdTime: 1.5, // how long the gesture should last
    minimumInterval: 0, // how soon another gesture can be triggered
  };
  host.GestureFeature.playGesture('Gesture', name, gestureOptions);
}

function playEmote(name) {
  if (!name) return;

  host.GestureFeature.playGesture('Emote', name);
}

DemoUtils.loadDemo(createScene);
