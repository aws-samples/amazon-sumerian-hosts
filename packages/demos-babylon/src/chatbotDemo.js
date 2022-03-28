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
  const talkButton = document.getElementById('talkButton');
  conversationController.setTalkButton(talkButton);

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

    const { lexResponseReady } = awsFeatures.LexFeature.EVENTS;

    this.lex.listenTo(lexResponseReady, (response) => this._handleLexResponse(response));
  }

  setTalkButton(talkButton) {
    talkButton.onmousedown = () => this.lex.beginVoiceRecording();
    talkButton.onmouseup = () => this.lex.endVoiceRecording();
  }

  _handleLexResponse(response) {
    const { inputTranscript, message } = response;
    console.log(response);
    this.host.TextToSpeechFeature.play(message);
    this._displayTranscript(inputTranscript);
  }

  _displayTranscript(text) {
    document.getElementById('transcriptText').innerText = `“${text}”`;
    document.getElementById('transcript').classList.remove('hide');
  }

}

DemoUtils.loadDemo(createScene);
