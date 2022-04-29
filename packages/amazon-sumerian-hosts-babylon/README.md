# Amazon Sumerian Hosts

For a general introduction to Amazon Sumerian Hosts as well as other example implementations of utilizing the core package, refer to the [primary repository](https://github.com/aws-samples/amazon-sumerian-hosts)

Amazon Sumerian Hosts is an experimental open source project that aims to make it easy to create interactive animated 3D characters that can be rendered on the Web and leverage AWS Services such as [Amazon Polly](https://aws.amazon.com/polly/) and [Amazon Lex](https://aws.amazon.com/lex/). This integration of the core library with [Babylon.js](https://www.babylonjs.com/) includes everything you need to get started with Amazon Sumerian Hosts utilizing Babylon.js. 

See the [Getting Started](#Getting-Started) guide for the usage instructions and the [API Documentation](https://aws-samples.github.io/amazon-sumerian-hosts/) for more detailed information on the classes and methods available. Amazon Sumerian Hosts is a published [npm](https://www.npmjs.com/) package, so alternatively you can install in an existing Node.js project by running `npm install --save-dev @amazon-sumerian-hosts/babylon`. If you'd like to pull the gitub repository and create your own build, see [Building the Repository](https://github.com/aws-samples/amazon-sumerian-hosts/blob/mainline/README.md#building-the-repository) for prerequisites and instructions on how to do that.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.

# [Getting Started](#Getting-Started)

The easiest way to get started using the hosts is by using Babylon.JS Editor with open-source-host plugin for importing Amazon Sumerian Hosts into Babylon.js project and aws-amplify-publisher plugin for publishing to the web. More details can be found in [aws-tools-for-babylonjs-editor](https://github.com/aws-samples/aws-tools-for-babylonjs-editor/blob/main/README.md) repo.

If you do not wish to use the Babylon.JS Editor, the following guide steps you through minimum code required to use hosts in Babylon.js.

More details can be found in [demos-babylon](https://github.com/aws-samples/amazon-sumerian-hosts/tree/mainline/packages/demos-babylon), an example package demonstrating the features, such as animation and speaking user-entered text, of the Sumerian Host characters running in Babylon.js.

## [Prerequisites](#Prerequisites)

- Complete steps 1 & 2 of the [AWS SDK for Javascript Getting Started in a Browser Script](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-browser.html) tutorial to generate an Amazon Cognito Identity Pool with an Amazon Polly policy to enable browser script access to Amazon Polly.
- Be familiar with how to create a scene in [Babylon.js](https://www.babylonjs.com/) Web rendering engine. 
  - [Creating a scene in Babylon.js](https://doc.babylonjs.com/babylon101/first#your-own-html)

## [Getting started in Babylon.js](#Getting-started-in-Babylon.js) 

### Configurating the AWS SDK
## Configuring Webpack

We recommend using a module bundler such as [Webpack](https://webpack.js.org/) to package and distribute your code. As BabylonJS relies on static singletons for certain features, it may be necessary to configure Webpack so that all modules and submodules use the same instance of BabylonJS. Add the following to `module.exports.resolve`:

```
		resolve: {
			...
			modules: ['node_modules'],
			alias: {
			    // configure all modules to point at the same instance of BabylonJS
			    '@babylonjs/core': path.resolve('./node_modules/@babylonjs/core')
			}
		},

```

### Step 1. Adding Script Dependencies

One way to configure AWS SDK is to include dependency script:

- ```html
  <!--Text to speech dependency-->
  <script
      type="text/javascript"
      src="https://sdk.amazonaws.com/js/aws-sdk-2.645.0.min.js"
  ></script>
  ```

  The hosts will need to connect to Amazon Polly to convert text into audio assets. https://sdk.amazonaws.com/js/aws-sdk-2.645.0.min.js is a minified build of the AWS SDK for Javascript. For the latest version, see the [AWS SDK for JavaScript API Reference](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/).

And then configure the AWS SDK with our region and credentials:

- ```javascript
  // Initialize AWS and create Polly service objects
  window.AWS.config.region = 'us-west-2';
  window.AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: '<Enter Cognito Identity Pool ID here>',
  });
  ```

  Replace `<Enter Cognito Identity Pool ID here>` with the id you created in the [Prerequisites](#Prerequisites) section. Make sure to set the region to the one you created your Cognito Identity Pool in. Using CognitoIdentityCredentials is just one example of how you can authenticate your host to access Polly. See the [AWS SDK documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html) to see other credentials classes you can use.

### Instantiating the Host

Amazon Sumerian Host exports to publish both ESM modules and a bundled CommonJS module for broad compatibility, we will use ESM module as the example here. To import `HostObject` do:

- ```javascript
  import {HostObject} from '@amazon-sumerian-hosts/babylon';
  ```

And then you can instantite a Sumerian Host using helper functions:

- ```javascript
  const characterId = 'Maya';
  const characterConfig = HostObject.getCharacterConfig(
    './character-assets',
    characterId
  );
  const pollyConfig = {pollyVoice: 'Joanna', pollyEngine: 'neural'};
  host = await HostObject.createHost(scene, characterConfig, pollyConfig);  
  ```
  This first retrieves the appropriate character config using `getCharacterConfig` and then create one of the built-in hosts or your own custom host in the Babylon.js scene with the character and polly config passed in. See [createHost](https://aws-samples.github.io/amazon-sumerian-hosts/babylonjs_HostObject.html#.createHost) and [getCharacterConfig](https://aws-samples.github.io/amazon-sumerian-hosts/babylonjs_HostObject.html#.getCharacterConfig) for more details about host asset paths and custom hosts.

### Interacting with the Host

PointOfInterest controls the gaze direction of the host. You can set a target for host to look at:

- ```javascript
  host.PointOfInterestFeature.setTarget(scene.activeCamera);
  ```
  This will make host look at the current active camera in your Babylon.js scene. See [PointOfInterest](https://aws-samples.github.io/amazon-sumerian-hosts/core_PointOfInterestFeature.html) for more details.

Host can turn text input into playable audio and speak out. One way to achieve this interactively is to create html text input and speak button elements:

- ```html
  <textarea id="speechText">Hello. I'm a Sumerian host. It's nice to meet you.</textarea>
  <button id="speakButton">Speak</button>
  ```

And use host TextToSpeechFeature to make host speak:

- ```javascript
  document.getElementById('speakButton').onclick = () => {
    const speech = document.getElementById('speechText').value;
    host.TextToSpeechFeature.play(speech);
  };
  ```
  You can also configure the voice, volume and speech marks of speech host's playing. See [TextToSpeechFeature](https://aws-samples.github.io/amazon-sumerian-hosts/core_PointOfInterestFeature.html) for more details.

Gesture allows you to play animations on demand from script or triggered from ssml speechmarks emitted. For example, you can play a wave animation from Gesture animation layer like this:

- ```javascript
  const gestureOptions = {
    holdTime: 1.5, // how long the gesture should last
    minimumInterval: 0, // how soon another gesture can be triggered
  };
  host.GestureFeature.playGesture('Gesture', 'wave', gestureOptions);
  ```
  See [GestureFeature](https://aws-samples.github.io/amazon-sumerian-hosts/core_GestureFeature.html) for more details.

### Utilizing the Host Lex Feature

You can also use the Host Lex Feature to interact with the Lex Bot and furthermore play the Lex response as speech via Host. First, you have to set up a Lex v1 bot. See [Create an Amazon Lex Bot](https://docs.aws.amazon.com/lex/latest/dg/gs-bp-create-bot.html) for more details.

You will then need to instantiate a LexFeature object with corresponding config from your created Lex bot.

- ```javascript
  import {aws as AwsFeatures} from '@amazon-sumerian-hosts/babylon';

  const lexClient = new AWS.LexRuntime();
  const botConfig = {
    botName: 'BookTrip',
    botAlias: 'Dev',
  };
  lex = new AwsFeatures.LexFeature(lexClient, botConfig);
  ```
  You can replace botName and botAlias with your own bot name and alias.

LexFeature supports both audio input as well as text input. And we will use audio/microphone input as an example. First, you need to get microphone input access from user:

- ```javascript
  try {
    await lex.enableMicInput();
  } catch (e) {
    // The user or browser denied mic access. Display appropriate messaging to the user.
  }
  ```

Then, you can setup a simple button used for recording microphone input purpose and hook up lex response callback to let the host play lex response message as speech:

- ```html
  <button id="talkButton">Push To Talk</button>
  ```

- ```javascript
  const talkButton = document.getElementById('talkButton');
  talkButton.onmousedown = () => lex.beginVoiceRecording();
  talkButton.onmouseup = () => lex.endVoiceRecording();

  // Use events dispatched by the LexFeature to present helpful user messages.
  const {EVENTS} = AwsFeatures.LexFeature;
  lex.listenTo(EVENTS.lexResponseReady, response =>
    host.TextToSpeechFeature.play(response.message);
  );
  ```
  LexFeature also supports text input as well as a list of other events for tracking recording state for instance. See [LexFeature](https://aws-samples.github.io/amazon-sumerian-hosts/core_LexFeature.html) for more details.

### Next Steps
Now that you've demonstrated your hosts running locally, consider publishing them to the web via one of these related tutorials:
- [Publishing a Web Application Using AWS Amplify](https://docs.sumerian.amazonaws.com/tutorials/create/solutions/gltf-viewer-amplify-public/)
- [Privately Publish a Web Application Using AWS Amplify](https://docs.sumerian.amazonaws.com/tutorials/create/solutions/gltf-viewer-amplify-private/)
