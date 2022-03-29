import { HostObject, aws as awsFeatures } from '@amazon-sumerian-hosts/babylon';
import DemoUtils from './common/demo-utils';
import cognitoIdentityPoolId from '../../../demo-credentials';

let host;
let scene;
let lex;
let conversationController;

async function createScene() {
  // Create an empty scene. IMPORTANT: Sumerian Hosts require use of the
  // right-hand coordinate system!
  scene = new BABYLON.Scene();
  scene.useRightHandedSystem = true; // IMPORTANT for Sumerian Hosts!

  const { shadowGenerator } = DemoUtils.setupSceneEnvironment(scene);

  // ===== Configure the AWS SDK =====

  AWS.config.region = cognitoIdentityPoolId.split(':')[0];
  AWS.config.credentials = new AWS.CognitoIdentityCredentials(
    { IdentityPoolId: cognitoIdentityPoolId },
  );

  // ===== Instantiate the Sumerian Host =====

  // Edit the characterId if you would like to use one of
  // the other pre-built host characters. Available character IDs are:
  // "Cristine", "Fiona", "Grace", "Maya", "Jay", "Luke", "Preston", "Wes"
  const characterId = 'Luke';
  const pollyConfig = { pollyVoice: 'Matthew', pollyEngine: 'neural' };
  const characterConfig = HostObject.getCharacterConfig('./character-assets', characterId);
  host = await HostObject.createHost(scene, characterConfig, pollyConfig);

  // Tell the host to always look at the camera.
  host.PointOfInterestFeature.setTarget(scene.activeCamera);

  // Enable shadows.
  scene.meshes.forEach(mesh => {
    shadowGenerator.addShadowCaster(mesh);
  });

  // ===== Initialize chatbot functionality =====

  // Initialize chatbot access.
  const { LexFeature } = awsFeatures;
  const lexClient = new AWS.LexRuntime();
  const botName = 'BookTrip';
  const botAlias = 'Dev';
  lex = new LexFeature(lexClient, { botName, botAlias });

  conversationController = new ConversationController(host, lex);

  initUi();
  acquireMicrophoneAccess();

  return scene;
}

function acquireMicrophoneAccess() {
  showUiScreen('micInitScreen');

  lex.enableMicInput()
    .then(() => {
      // Microphone access is complete. Display the start screen.
      showUiScreen('startScreen');
    })
    .catch((e) => {
      // The user or browser denied mic access. Display appropriate messaging
      // to the user.
      switch (e.message) {
        case 'Permission dismissed':
          showUiScreen('micPermissionDismissedScreen');
          break;
        default:
          showUiScreen('micDisabledScreen');
          break;
      }
    });
}

function initUi() {
  // Set up interactions for UI buttons.
  document.getElementById('startButton').onclick = () => startMainExperience();
  document.getElementById('enableMicButton').onclick = () => acquireMicrophoneAccess();
}

function startMainExperience() {
  showUiScreen('chatbotUiScreen');

  // Speak a greeting to the user.
  host.TextToSpeechFeature.play(
    `Hello. How can I help?  You can say things like, "I'd like to rent a car," or, "Help me book a hotel".`
  );
}

/**
 * Makes the specified UI screen visible and hides all other UI screens.
 * @param {string} id HTMLElement id of the screen to display.
 */
function showUiScreen(id) {
  document.querySelectorAll('#uiScreens .screen').forEach((element) => {
    const show = element.id === id;
    setElementVisibility(element.id, show);
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

/**
 * The ConversationController manages user interactions with the chatbot.
 */
class ConversationController {
  constructor(host, lexFeature) {
    this.host = host;
    this.lex = lexFeature;

    // Use talk button events to start and stop recording.
    const talkButton = document.getElementById('talkButton');
    talkButton.onmousedown = () => this.lex.beginVoiceRecording();
    talkButton.onmouseup = () => this.lex.endVoiceRecording();

    // Use events dispatched by the LexFeature to present helpful user messages.
    const { EVENTS } = awsFeatures.LexFeature;
    this.lex.listenTo(EVENTS.lexResponseReady, (response) => this._handleLexResponse(response));
    this.lex.listenTo(EVENTS.recordBegin, () => this._hideUserMessages());
    this.lex.listenTo(EVENTS.recordEnd, () => this._displayProcessingMessage());

    // Create convenience references to DOM elements.
    this.messageContainerEl = document.getElementById('userMessageContainer');
    this.transcriptTextEl = document.getElementById('transcriptText');
  }

  _handleLexResponse(response) {
    // Remove "processing" CSS class from message container.
    this.messageContainerEl.classList.remove('processing');

    // Display the user's speech input transcript.
    this._displayTranscript(response.inputTranscript);

    // Have the host speak the response from Lex.
    this.host.TextToSpeechFeature.play(response.message);
  }

  _displayTranscript(text) {
    document.getElementById('transcriptText').innerText = `“${text}”`;
    this.messageContainerEl.classList.add('showingMessage');
  }

  _displayProcessingMessage() {
    this.messageContainerEl.classList.add('processing');
  }

  _hideUserMessages() {
    this.messageContainerEl.classList.remove('showingMessage');
  }
}

DemoUtils.loadDemo(createScene);
