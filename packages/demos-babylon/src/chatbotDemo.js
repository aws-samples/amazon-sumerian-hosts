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

  lex.enableMicInput()
    .catch((e) => {
      console.log('mic check failed');
      console.log(e);
    });

  return scene;
}

function initUi() {
  const startButton = document.getElementById('startButton');
  startButton.onclick = () => startMainExperience();
}

function startMainExperience() {
  document.getElementById('startScreen').classList.add('hide');
  document.getElementById('chatbotUiScreen').classList.remove('hide');

  host.TextToSpeechFeature.play(
    `Hello. How can I help?  You can say things like, "I'd like to rent a car," or, "Help me book a hotel".`
  );
}

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
  }

  _handleLexResponse(response) {
    const { inputTranscript, message } = response;

    // Have the host speak the response from Lex.
    this.host.TextToSpeechFeature.play(message);

    // Display the user's speech input transcript.
    this._displayTranscript(inputTranscript);
  }

  _displayTranscript(text) {
    document.getElementById('transcriptText').innerText = `“${text}”`;
    this._showUserMessageElement('transcriptDisplay');
  }

  _displayProcessingMessage() {
    this._showUserMessageElement('processingMessage');
  }

  _hideUserMessages() {
    document.getElementById('userMessageContainer').classList.add('hide');
  }

  _showUserMessageElement(id) {
    // Display only the message element whose ID matches. Hide the rest.
    document.querySelectorAll('#userMessageContainer .message').forEach((element) => {
      if (element.id === id) {
        element.classList.remove('hide');
      } else {
        element.classList.add('hide');
      }
    });

    // Ensure the message container is not hidden.
    document.getElementById('userMessageContainer').classList.remove('hide');
  }

}

DemoUtils.loadDemo(createScene);
