import {HostObject, aws as AwsFeatures} from '@amazon-sumerian-hosts/babylon';
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
  const characterId = 'Luke';
  const pollyConfig = {pollyVoice: 'Matthew', pollyEngine: 'neural'};
  const characterConfig = HostObject.getCharacterConfig(
    './character-assets',
    characterId
  );
  host = await HostObject.createHost(scene, characterConfig, pollyConfig);

  // Tell the host to always look at the camera.
  host.PointOfInterestFeature.setTarget(scene.activeCamera);

  // Enable shadows.
  scene.meshes.forEach(mesh => {
    shadowGenerator.addShadowCaster(mesh);
  });

  // Initialize chatbot access. If you'd like to use this demo with a different chatbot, just change the
  // botName and botAlias values below.
  const lexClient = new AWS.LexRuntime();
  const botConfig = {
    botName: 'BookTrip',
    botAlias: 'Dev',
  };
  lex = new AwsFeatures.LexFeature(lexClient, botConfig);

  initUi();
  initConversationManagement();
  acquireMicrophoneAccess();

  return scene;
}

function initUi() {
  // Set up interactions for UI buttons.
  document.getElementById('startButton').onclick = () => startMainExperience();
  document.getElementById('enableMicButton').onclick = () =>
    acquireMicrophoneAccess();
}

/**
 * Triggered when the user clicks the initial "start" button.
 */
function startMainExperience() {
  showUiScreen('chatbotUiScreen');

  // Speak a greeting to the user.
  host.TextToSpeechFeature.play(
    `Hello. How can I help?  You can say things like, "I'd like to rent a car," or, "Help me book a hotel".`
  );
}

// ===== Chatbot functions =====

let messageContainerEl;
let transcriptTextEl;
let lex;

function initConversationManagement() {
  // Use talk button events to start and stop recording.
  const talkButton = document.getElementById('talkButton');
  talkButton.onmousedown = () => lex.beginVoiceRecording();
  talkButton.onmouseup = () => lex.endVoiceRecording();

  // Use events dispatched by the LexFeature to present helpful user messages.
  const {EVENTS} = AwsFeatures.LexFeature;
  lex.listenTo(EVENTS.lexResponseReady, response =>
    handleLexResponse(response)
  );
  lex.listenTo(EVENTS.recordBegin, () => hideUserMessages());
  lex.listenTo(EVENTS.recordEnd, () => displayProcessingMessage());

  // Create convenience references to DOM elements.
  messageContainerEl = document.getElementById('userMessageContainer');
  transcriptTextEl = document.getElementById('transcriptText');
}

/**
 * Triggered whenever a response is received from the Lex chatbot.
 * @param {object} response An object representing the Lex response. For a
 * detailed description of this object's shape, see the documentation for the
 * "data" callback argument described here:
 * {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/LexRuntime.html#postContent-property}
 */
function handleLexResponse(response) {
  // Remove "processing" CSS class from message container.
  messageContainerEl.classList.remove('processing');

  // Display the user's speech input transcript.
  displaySpeechInputTranscript(response.inputTranscript);

  // Have the host speak the response from Lex.
  host.TextToSpeechFeature.play(response.message);
}

function displaySpeechInputTranscript(text) {
  transcriptTextEl.innerText = `“${text}”`;
  messageContainerEl.classList.add('showingMessage');
}

function displayProcessingMessage() {
  messageContainerEl.classList.add('processing');
}

function hideUserMessages() {
  messageContainerEl.classList.remove('showingMessage');
}

/**
 * Attempts to enable microphone access for Lex, triggering a browser permissions
 * prompt if necessary.
 * @returns {Promise} A Promise which resolves once mic access is allowed or
 * denied by the user or browser.
 */
async function acquireMicrophoneAccess() {
  showUiScreen('micInitScreen');

  try {
    await lex.enableMicInput();
    showUiScreen('startScreen');
  } catch (e) {
    // The user or browser denied mic access. Display appropriate messaging
    // to the user.
    if (e.message === 'Permission dismissed') {
      showUiScreen('micPermissionDismissedScreen');
    } else {
      showUiScreen('micDisabledScreen');
    }
  }
}

// ===== Utility functions =====

/**
 * Makes the specified UI screen visible and hides all other UI screens.
 * @param {string} id HTMLElement id of the screen to display.
 */
function showUiScreen(id) {
  document.querySelectorAll('#uiScreens .screen').forEach(element => {
    const isTargetScreen = element.id === id;
    setElementVisibility(element.id, isTargetScreen);
  });
}

/**
 * Shows or hides an HTML element.
 * @param {string} id HTMLElement id
 * @param {boolean} visible `true` shows the element. `false` hides it.
 */
function setElementVisibility(id, visible) {
  const element = document.getElementById(id);
  if (visible) {
    element.classList.remove('hide');
  } else {
    element.classList.add('hide');
  }
}

DemoUtils.loadDemo(createScene);
