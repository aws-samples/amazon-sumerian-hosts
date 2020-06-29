# Amazon Sumerian Hosts

Amazon Sumerian Hosts is an experimental open source project that aims to make it easy to create interactive animated 3D characters that can be rendered on the Web and leverage AWS Services such as [Amazon Polly](https://aws.amazon.com/polly/). It defines a Javascript API for managing animations, synthesizing and playing speech with Amazon Polly, and generating lipsync animation at runtime in sync with Polly generated audio. The core API can be extended to support the Web rendering engine of your choice. We have included support for both [three.js](https://threejs.org/) and [Babylon.js](https://www.babylonjs.com/) as examples of how to do this.

You can clone the repository to obtain glTF character animation assets tailored to work well with the Host API. You can use them as-is, modify them in DCC software such as [Blender](https://www.blender.org/) or use them as a guide to develop your own 3D assets.

The easiest way to start using the API is to include the build file that corresponds with the rendering engine you are using. See the [Getting Started](#Getting-Started) guide for a walkthrough using this method and the [API Documentation](https://aws-samples.github.io/amazon-sumerian-hosts/) for more detailed information on the classes and methods available. Amazon Sumerian Hosts is a published [npm](https://www.npmjs.com/) package, so alternatively you can install in an existing Node.js project by running `npm install --save-dev amazon-sumerian-hosts`. If you'd like to pull the gitub repository and create your own build, see [Building the Package](#Building-the-Package) for prerequisites and instructions on how to do that.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file. The assets within examples are licensed under the CC-BY-4.0 License. See the [LICENSE](examples/assets/LICENSE) file.
<br/><br/>

# [Getting Started](#Getting-Started)

This guide step through the creation of [examples/three.html](examples/three.html) and [examples/babylon.html](examples/babylon.html), resulting in an interactive 3D character that animates and speaks the text you input into the textarea, rendered in the Web rendering engine of your choice.

## [Prerequisites](#Prerequisites)

- Complete steps 1 & 2 of the [AWS SDK for Javascript Getting Started in a Browser Script](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-browser.html) tutorial to generate an Amazon Cognito Identity Pool with an Amazon Polly policy to enable browser script access to Amazon Polly.
- Be familiar with how to create a scene in either [three.js](https://threejs.org/) or [Babylon.js](https://www.babylonjs.com/) Web rendering engines. - [Creating a scene in three.js](https://threejs.org/docs/index.html#manual/en/introduction/Creating-a-scene)
  - [Creating a scene in Babylon.js](https://doc.babylonjs.com/babylon101/first#your-own-html)

Jump to [Getting started in three.js](#Getting-started-in-three.js) for instructions specific to three.js or [Getting started in Babylon.js](#Getting-started-in-Babylon.js) for instructions specific to Babylon.js.

## [Getting started in three.js](#Getting-started-in-three.js)

### Step 1. Adding Script Dependencies

Here we will take a look at the scripts necessary for the example code to function:

- ```javascript
  <!--Enable drag and drop text files on text to speech input area-->
  <script src="./scriptDependencies/dragDropTextArea.js"></script>
  ```

  Our example will include a [textarea](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement) that you can use to input the text that you'd like your host to recite. [dragDropTextArea.js](examples/scriptDependencies/dragDropTextArea.js) is a local script that copies the contents of a text file into the textarea when you drag and drop a text file onto the textarea. This makes it easy to try out lots of different text.

- ```html
  <!--Text to speech dependency-->
  <script
      type="text/javascript"
      src="https://sdk.amazonaws.com/js/aws-sdk-2.645.0.min.js"
  ></script>
  ```

  The host will need to connect to Amazon Polly to convert text into into audio assets. https://sdk.amazonaws.com/js/aws-sdk-2.645.0.min.js is a minified build of the AWS SDK for Javascript. For the latest version, see the [AWS SDK for JavaScript API Reference](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/).

- ```html
  <!--Three.js dependencies-->
  <script src="./scriptDependencies/three.min.js"></script>
  <script src="./scriptDependencies/three.GLTFLoader.js"></script>
  <script src="./scriptDependencies/three.OrbitControls.js"></script>
  ```

  Our example will need to be able to set up a new three.js scene, load glTF files and allow you to move and rotate the cameras to view the host from different angles. These scripts are three.js build files downloaded from the [three.js github repository](https://github.com/mrdoob/three.js/). Make sure to always include three.min.js first as it is a dependency for the GLTFLoader and OribitControls scripts.

- ```html
  <!--Host build file-->
  <script type="text/javascript" src="../dist/host.three.js"></script>
  ```
  host.three.js is the build file of the Amazon Sumerian Hosts repository that is specific to the three.js rendering engine. It must be included after the three.min.js build file. This will make a module called `HOST` available to any scripts included after this.

  ```javascript
  import HOST from 'amazon-sumerian-hosts/dist/host.three.js'
  ```
  Alternatively, if you are working on a NodeJS project and install the package via `npm install --save-dev amazon-sumerian-hosts`, you can import the HOST library using the above syntax in any of your source files.

Now we'll move on to the body of the html file.

### Step 2. Add a loading screen

Our example is going to load several glTF assets so there will be a short time where there is no host visible in the scene. We will add a [div tag](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement) styled with an image and a loading spinner to show while the assets are being loaded.

- ```html
  <!--Loading screen-->
  <div id="loadScreen">
    <div id="loader"></div>
  </div>
  ```

  The outer div with id "loadScreen" is styled with a background image that fills the screen.

- ```css
  #loadScreen {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-image: url('assets/images/load_screen.png');
    background-color: gray;
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: center;
    background-size: contain;
    z-index: 9999;
  }
  ```

  The inner div with id "loader" is styled with a spin animation that continuously rotates the spinner.

- ```css
  #loader {
    border: 16px solid #3498db38;
    border-radius: 50%;
    border-top: 16px solid #3498db;
    width: 120px;
    height: 120px;
    -webkit-animation: spin 2s linear infinite;
    animation: spin 2s linear infinite;
    position: fixed;
  }

  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  ```

### Step 3. Create the text to speech controls

Our host will need some text input so we can tell it what to say, as well as some controls to play/pause/resume/stop the speech. Take note of the id of each element, we'll be using these later. Note the use of the `<amazon:domain name="conversational">` ssml tag. Use of this tag results in a more natural speaking style in the speech audio, however it is currently only supported by the English language Matthew and Joanna voices.

```html
<!--Text to speech controls-->
<div id="textToSpeech">
  <div>
    <textarea autofocus size="23" type="text" id="textEntry">
<speak>
  <amazon:domain name="conversational">Hello, my name is Jay. I used
    to only be a host inside Amazon Sumerian, but now you can use me in other
    Javascript runtime environments like three<sub alias="">.</sub>js and
    Babylon<sub alias="">.</sub>js. Right now I&apos;m in three<sub alias="">.</sub>js.
  </amazon:domain>
</speak>
    	</textarea>
  </div>
  <button id="play" class="button">Play</button>
  <button id="pause" class="button">Pause</button>
  <button id="resume" class="button">Resume</button>
  <button id="stop" class="button">Stop</button>
  <div>
    <button id="gestures" class="button">Generate Gestures</button>
  </div>
</div>
```

Now we will move onto the contents of the example [script](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement) tag.

### Step 4. Configuring the AWS SDK

Our host will be using the [TextToSpeechFeature](https://aws-samples.github.io/amazon-sumerian-hosts/three.js_TextToSpeechFeature.html), so before we can make the host speak we need to configure the AWS SDK with our region and credentials.

```javascript
// Initialize AWS and create Polly service objects
window.AWS.config.region = 'us-west-2';
window.AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: '<Enter Cognito Identity Pool ID here>',
});
```

Replace `'<Enter Cognito Identity Pool ID here>'` with the id you created in the [Prerequisites](#Prerequisites) section. Make sure to set the region to the one you created your Cognito Identity Pool in. Using CognitoIdentityCredentials is just one example of how you can authenticate your host to access Polly. See the [AWS SDK documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html) to see other credentials classes you can use.

### Step 5. Initializing the Host TextToSpeechFeature

The [TextToSpeechFeature](https://aws-samples.github.io/amazon-sumerian-hosts/three.js_TextToSpeechFeature.html) is the host feature that communicates with Amazon Polly to generate speech audio and speechmarks and plays them back at runtime. Before this feature can be used, it must be initialized with Polly and PollyPresigner instances, as well as the version of the AWS SDK being used.

```javascript
const polly = new AWS.Polly();
const presigner = new AWS.Polly.Presigner();
const speechInit = HOST.aws.TextToSpeechFeature.initializeService(
  polly,
  presigner,
  window.AWS.VERSION
);
```

[`HOST.aws.TextToSpeechFeature.initializeService`](https://aws-samples.github.io/amazon-sumerian-hosts/AbstractTextToSpeechFeature.html#.initializeService) returns a promise that will resolve once the feature has successfully connected to polly and populated its lists of available voices and languages. We'll store this as a variable so we can make sure it has resolved before allowing the user to send text to Polly.

Now we'll start setting up the visuals.

### Step 6. Define asset variables

- ```javascript
  // Define the glTF assets that will represent the host
  const renderFn = [];
  ```

  three.js requires the user to manage the render loop. This variable will be used to collect functions that need to be executed during the render loop.

- ```javascript
  const characterFile = './assets/glTF/characters/adult_male/jay/jay.gltf';
  const animationPath = './assets/glTF/animations/adult_male';
  const animationFiles = ['stand_idle.glb', 'lipsync.glb', 'gesture.glb'];
  const gestureConfigFile = 'gesture.json';
  ```

  For this example we'll be using the character glTF file called `jay.gltf`. Jay uses the adult_male character skeleton, so we'll use animation files from the `adult_male` folder. `stand_idle.glb` and `lipsync.glb` contain all of the animations necessary to generate host lipsync animation at runtime. `gesture.glb` contains gesture animations that can be triggered while the host is speaking to emphasize certain words and give some variety to the performance.

- ```javascript
  const audioAttachJoint = 'chardef_c_neckB'; // Name of the joint to attach audio to
  ```

  The Host TextToSpeechFeature supports passing in an object to attach the speech audio to. We want the speech to appear to come from the host's mouth, so this variable defines the name of a joint in the jay.gltf asset that's located in the area of the character's head geometry.

- ```javascript
  const voice = 'Matthew'; // Polly voice. Full list of available voices at: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
  const voiceEngine = 'neural'; // Neural engine is not available for all voices in all regions: https://docs.aws.amazon.com/polly/latest/dg/NTTS-main.html
  ```
  These variables define the Polly voice and engine we'll use when synthesizing speech audio. The neural engine tends to produce better results than the standard engine, however it is limited to certain voices and regions. See the [Polly Documentation](https://docs.aws.amazon.com/polly/latest/dg/NTTS-main.html#ntts-regions) for more information about region and voice compatibility.

### Step 7. Create a three.js scene and start the render loop

- ```javascript
  // Set up the scene and host
  const {scene, camera, clock} = createScene();
  ```

  Here is where we create the three.js scene and background environment. See the [three.js documentation](https://threejs.org/docs/#manual/en/introduction/Creating-a-scene) for detailed information on the components that make up a scene in three.js.

- ```javascript
  // Render loop
  function render() {
    requestAnimationFrame(render);
    controls.update();

    renderFn.forEach(fn => {
      fn();
    });

    renderer.render(scene, camera);
  }

  render();
  ```

  If we take a look inside the `createScene` function, you'll see how we execute each function in the `renderFn` array from Step 6. Later on we'll add the host's update function to that array so it can be updated each time the three.js renderer is updated.

### Step 8. Load the glTF assets

```javascript
const {character, clips, bindPoseOffset} = await loadCharacter(
  scene,
  characterFile,
  animationPath,
  animationFiles
);

// Read the gesture config file. This file contains options for splitting up
// each animation in gestures.glb into 3 sub-animations and initializing them
// as a QueueState animation.
const gestureConfig = await fetch(
  `${animationPath}/${gestureConfigFile}`
).then(response => response.json());

const [idleClips, lipsyncClips, gestureClips] = clips;
```

Here is where we load the glTF assets we defined in Step 6. `loadCharacter` is an asynchronous function that uses the three.js GLTFLoader to load glTF asset as three.js objects and add them to the scene. See the [three.js documentation](https://threejs.org/docs/#examples/en/loaders/GLTFLoader) for more detailed information on loading glTF assets.  

The `gestureConfigFile` is also being loaded here. This file is a JSON file that contains the information necessary to take each animation in `gesture.glb` and split it into 3 parts: a transition motion from the standing idle pose into the main posture of the gesture, a looping motion in the gesture posture, and a transition motion from the gesture posture back to the standing idle pose. Having a looping motion in the gesture allows us to take advantage of the `holdTime` functionality in the `GestureFeature`.

### Step 9. Initializing the Host

```javascript
const host = createHost(
  character,
  audioAttachJoint,
  voice,
  voiceEngine,
  idleClips[0],
  lipsyncClips,
  gestureClips,
  gestureConfig,
  bindPoseOffset,
  camera,
  clock
);
```

Here we pass all of our assets and variables to the `createHost` function. This function is where we'll create the [HostObject](https://aws-samples.github.io/amazon-sumerian-hosts/three.js_HostObject.html) and add features to it. Next we'll inspect what makes up the `createHost` function.

- ```javascript
  // Add the host to the render loop
  const host = new HOST.HostObject({owner: character, clock});
  renderFn.push(() => {
    host.update();
  });
  ```

  We pass the character asset we loaded earlier and the three.js [clock](https://threejs.org/docs/#api/en/core/Clock) object to the `HostObject` constructor so that the host system can keep track of the asset it's manipulating and can stay in sync with the three.js clock. The clock parameter is optional but it's recommended that you pass a clock for better accuracy. This is also where we add the host's `update` function to the render loop so it will start animating.

- ```javascript
  // Set up text to speech
  const audioListener = new THREE.AudioListener();
  camera.add(audioListener);
  const audioAttach = character.getObjectByName(audioAttachJoint);
  host.addFeature(HOST.aws.TextToSpeechFeature, false, {
    listener: audioListener,
    attachTo: audioAttach,
    voice,
    engine,
  });
  ```

  Here is where we add the [TextToSpeechFeature](https://aws-samples.github.io/amazon-sumerian-hosts/TextToSpeechFeature.html) to allow the host to convert text to audio and play it back. The TextToSpeechFeature will emit messages during playback events like play/pause/resume/stop as well as when speechmarks are encountered during the audio. three.js Hosts use the three.js audio system, so we need to pass it and [AudioListener](https://threejs.org/docs/#api/en/audio/AudioListener). We also search the character asset's child hierarchy for the audioAttach variable we defined in Step 6 to find the three.js node that matches that name. The host will use three.js [PositionalAudio](https://threejs.org/docs/#api/en/audio/PositionalAudio) attached to this node when it synthesizes speech audio.

- ```javascript
  // Set up animation
  host.addFeature(HOST.anim.AnimationFeature);
  ```

  Next we add the [AnimationFeature](https://aws-samples.github.io/amazon-sumerian-hosts/AnimationFeature.html). This is what allows you to manage and play animations on the host character asset. The AnimationFeature is a layered animation system, below we'll take a look at each animation layer and animations we'll add to make the host appear to speak and gesture when speech audio is playing.

  - ```javascript
    // Base idle
	host.AnimationFeature.addLayer('Base');
	host.AnimationFeature.addAnimation(
		'Base',
		idleClip.name,
		HOST.anim.AnimationTypes.single,
		{clip: idleClip}
	);
	host.AnimationFeature.playAnimation('Base', idleClip.name);
    ```
   
    Here we have added a single [AnimationLayer](https://aws-samples.github.io/amazon-sumerian-hosts/AnimationLayer.html) to the host. Animation layers are containers that manage playback of a subset of animations. Each AnimationLayer can only play a single animation at any given time, but a host animation can also be a container for multiple animation assets. Here we are creating an animation of type `HOST.anim.AnimationTypes.single`, which means that the animation can only contain one three.js [AnimationClip](https://threejs.org/docs/#api/en/animation/AnimationClip). The clip we've chosen is the `stand_idle` animation, which contains looping ambient motion in a standing position. This is the animation you'll see by default when the host isn't speaking. `host.AnimationFeature.playAnimation` is telling the host to start playing the idle animation on the `Base` layer we just created.

  - ```javascript
    // Talking idle
	host.AnimationFeature.addLayer('Talk', {
		transitionTime: 0.75,
		blendMode: HOST.anim.LayerBlendModes.Additive,
	});
	host.AnimationFeature.setLayerWeight('Talk', 0);
	const talkClip = lipsyncClips.find(c => c.name === 'stand_talk');
	lipsyncClips.splice(lipsyncClips.indexOf(talkClip), 1);
	host.AnimationFeature.addAnimation(
		'Talk',
		talkClip.name,
		HOST.anim.AnimationTypes.single,
		{clip: talkClip}
	);
	host.AnimationFeature.playAnimation('Talk', talkClip.name);
    ```
   
    The next animation layer we'll add will contain another looping idle that contains a full body motion in the standing position to simulate the type of ambient gestures people make when they talk. You'll notice that we've included some options this time when executing [`AnimationFeature.addLayer`](https://aws-samples.github.io/amazon-sumerian-hosts/AnimationFeature.html#addLayer). The `transitionTime` variable defines the default amount of time it takes to blend to a new animation on the layer. `blendMode` defines the type of blending that will be used when playing animations on this layer in combination with the other layers on the host. The default is `Override`, which means that animation on the layer would cancel out animations on layers underneath, but here we have defined the layer as `Additive`. This means that the animations on this layer will add on top of the animations on the layer named `Base`. [AnimationFeature.setLayerWeight](https://aws-samples.github.io/amazon-sumerian-hosts/AnimationFeature.html#setLayerWeight) tells the host that we don't want animations on this layer to have any influence by default. Layers can have weight values ranging from 0-1.

  - ```javascript
    // Viseme poses
	host.AnimationFeature.addLayer('Viseme', {
		transitionTime: 0.12,
		blendMode: HOST.anim.LayerBlendModes.Additive,
	});
	host.AnimationFeature.setLayerWeight('Viseme', 0);
    
    // Slice off the reference frame
	const blendStateOptions = lipsyncClips.map(clip => {
		return {
			name: clip.name,
			clip: THREE.AnimationUtils.subclip(clip, clip.name, 1, 2, 30),
			weight: 0,
		};
	});
	host.AnimationFeature.addAnimation(
		'Viseme',
		'visemes',
		HOST.anim.AnimationTypes.freeBlend,
		{blendStateOptions}
	);
	host.AnimationFeature.playAnimation('Viseme', 'visemes');
    ```

	Next we create an animation that will control the lipsync animation for the host. Lipsync is achieved by blending a series of poses that correspond to viseme speechmarks that the TextToSpeechFeature emits. See the [Polly documentation](https://docs.aws.amazon.com/polly/latest/dg/viseme.html) to find out more about the visemes that Polly generates.  

	You'll notice a difference here when we add the animation to the layer - we're using a different animation type called [`freeBlend`](https://aws-samples.github.io/amazon-sumerian-hosts/FreeBlendState.html). This type of animation allows you to blend between N-number of three.js [AnimationClips](https://threejs.org/docs/#api/en/animation/AnimationClip) at the same time. Each clip gets its own weight, if the cumulative weight of all of the clips in the animation container exceed 1 then they are normalized. As the host performs lipsync animation, it will manipulate these blend weights behind the scenes as viseme speechmarks are encountered to shape the host's mouth to match the sounds it is making.  

	We're also using `THREE.AnimationUtils.subclip` to remove frame 0 from the clips controlled by the `freeBlend` animation. This is because the initial frame of each viseme pose animation is the reference frame we used inside `loadCharacter` in order to convert the keyframes to be additive, meaning that every keyframe after 0 is relative to the pose at frame 0. We no longer need this part of the animation so it gets sliced off before sending the clip to `host.AnimationFeature.addAnimation`.

  - ```javascript
    // Gesture animations
    host.AnimationFeature.addLayer('Gesture', {
      transitionTime: 0.5,
      blendMode: HOST.anim.LayerBlendModes.Additive,
    });
    gestureClips.forEach(clip => {
      const {name} = clip;
      const config = gestureConfig[name];

      if (config !== undefined) {
        config.queueOptions.forEach((option, index) => {
          // Create a subclip for each range in queueOptions
          option.clip = THREE.AnimationUtils.subclip(
            clip,
            `${name}_${option.name}`,
            option.from,
            option.to,
            30
          );
        });
        host.AnimationFeature.addAnimation(
          'Gesture',
          name,
          HOST.anim.AnimationTypes.queue,
          config
        );
      } else {
        host.AnimationFeature.addAnimation(
          'Gesture',
          name,
          HOST.anim.AnimationTypes.single,
          {clip}
        );
      }
    });
    ```

	Next we create the animations that will allow the host to perform gestures in time with ssml tags emitted from the `TextToSpeechFeature`. This is where the `gestureConfigFile` we loaded earlier becomes useful. The `gestureConfig` object is used to split each gesture into sub-clips using to and from frame ranges defined in the config. Instead of creating a `single` animation for each clip, we will use a [`queue`](https://aws-samples.github.io/amazon-sumerian-hosts/QueueState.html) type animation. This type of animation allows you to define an array of clips to be played in order. The queue will automatically advance once the currently playing clip stops.

  - ```javascript
    // Apply bindPoseOffset clip if it exists
    if (bindPoseOffset !== undefined) {
      host.AnimationFeature.addLayer('BindPoseOffset', {
        blendMode: HOST.anim.LayerBlendModes.Additive,
      });
      host.AnimationFeature.addAnimation(
        'BindPoseOffset',
        bindPoseOffset.name,
        HOST.anim.AnimationTypes.single,
        {
          clip: THREE.AnimationUtils.subclip(
            bindPoseOffset,
            bindPoseOffset.name,
            1,
            2,
            30
          ),
        }
      );
      host.AnimationFeature.playAnimation(
        'BindPoseOffset',
        bindPoseOffset.name
      );
    }
    ```

	The last animation layer we'll add is optional, it is not needed for all of the provided host glTF character assets. All of the host assets in the `assets/glTF/characters/adult_male` folder share a common body skeleton, as do the assets in the `assets/glTF/characters/adult_female` folder. However each host character asset has unique facial joint placement. All of the animations in the `adult_male` folder were exported from the character skeleton in `wes.glTF`, and all of those in the `adult_female` folder were exported from the character skeleton in `fiona.glTF`. To make sharing animations within the same character classification possible, each of the other host glTF character assets include an animation clip containing 2 poses called `bindpose_offset`. The first pose in this animation keyframes the joints in the position the `wes.glTF` or `fiona.glTF` meshes were bound to their skeletons at, depending on which folder the asset is located in. The second pose keyframes the joints in pose character's meshes were bound to its own skeleton at. When the clip is made additive, the first pose is subtracted out of the second one, creating an offset that can be played on top of the other animations to correct the facial joints back to the starting position unique to the character asset.

- ```javascript
  // Set up Lipsync
  const visemeOptions = {
  	layers: [{name: 'Viseme', animation: 'visemes'}],
  };
  const talkingOptions = {
  	layers: [{name: 'Talk', animation: 'stand_talk'}],
  };
  host.addFeature(
	HOST.LipsyncFeature,
	false,
	visemeOptions,
	talkingOptions
  );
  ```
  Next we add the [LipsyncFeature](https://aws-samples.github.io/amazon-sumerian-hosts/LipsyncFeature.html). This is the feature that listens to the TextToSpeechFeature and manipulates animations in the AnimationFeature as speechmark messages are caught from the TextToSpeechFeature. This feature will have no effect until both of the prerequisite features have been added to the host.  

  The `visemeOptions` object tells the LipsyncFeature that we have one layer on the AnimationFeature that contains viseme-related animations, its name is `Viseme` and the freeBlend animation that contains the viseme poses is called `viseme`. The LipsyncFeature requires that the animation defined for `visemeOptions` is of type `freeBlend`, if it is not then lipsync animation will have no effect. Each layer defined in `visemeOptions` can optionally define a `visemeMap` object that maps the names of Polly visemes to options such as the name of the corresponding animation blend weight. In the provided host objects we have named all of the viseme animations to match the Polly visemes so we don't need to provide this object. See [DefaultVisemeMap](https://aws-samples.github.io/amazon-sumerian-hosts/global.html#DefaultVisemeMap) to see the required format if you define your own `visemeMap`. As the LipsyncFeature catches viseme events from the TextToSpeechFeature, it will look for the animation blend weight name defined in the `visemeMap` that corresponds with the name of the viseme speechmark. If it finds one it will blend its weight toward 1 and then back to zero over the duration of the viseme speechmark to simulate speech.

  The `talkingOptions` object tells the LipsyncFeature that we have one layer on the AnimationFeature that contains ambient talking motion, its name is `Talk` and the animation we want to play on that layer while speech audio is playing is called `stand_talk`. 
  
  When the LipsyncFeature catches play and resume speech events from the TextToSpeechFeature, it will blend the weight of any viseme or talking layers defined in `visemeOptions` and `talkingOptions` to 1 and play the animation defined for the layer. When it catches pause or stop events it will blend the weights back to 0.

- ```javascript
  // Set up Gestures
  host.addFeature(HOST.GestureFeature, false, {
    layers: {Gesture: {minimumInterval: 3}},
  });
  ```
  Finally we add the [GestureFeature](https://aws-samples.github.io/amazon-sumerian-hosts/GestureFeature.html). This is the feature that will control the `queue` animations we created earlier. The `layer` input parameter allows you to define the names of animation layers that the feature is able to manipulate. Each layer name is associated with a gesture options object specific to that layer. The `minimumInterval` option allows you to define the minimum amount of time in seconds that must elapse after each call to [GestureFeature.playGesture](https://aws-samples.github.io/amazon-sumerian-hosts/GestureFeature.html#playGesture) before another gesture can be played. Set this option to 0 if you don't want any limitations on playing gestures. Raising this option above 0 will give better looking results when auto-generating ssml markup for gestures. Another option that can be defined is `holdTime`. Remember that we defined our gesture animations as `queue` animations, and that the second animation in each queue was set to loop infinitely. Because of this, the queue can never progress to its final animation on its own. The GestureFeature listens for when the AnimationFeature emits its `playNextAnimation` message. This message is emitted each time a `queue` animation progresses. If the GestureFeature detects that the new current animation in the queue cannot progress, it will start a timer that expires after the number of seconds defined by `holdTime` elapses. Once that happens, it will progress the queue. We'll leave it at the default value of 3 for this example.

We have now added all of the host features necessary to simulate animated speech with body gestures.  

### Step 10. Hide the load screen

```javascript
// Hide the load screen and how the text input
document.getElementById('textToSpeech').style.display = 'inline-block';
document.getElementById('loadScreen').style.display = 'none';
```

All of the visuals for the host have been set up and we have begun playing back animation, so now is a good time to hide the load screen to begin showing the rendered results. We'll find and hide the loadScreen div and show the textToSpeech div.

### Step 11. Initialize the speech controls

```javascript
await speechInit;

// Enable drag/drop text files on the speech text area
enableDragDrop('textEntry');

// Play, pause, resume and stop the contents of the text input as speech
// when buttons are clicked
const speechInput = document.getElementById('textEntry');
['play', 'pause', 'resume', 'stop'].forEach(id => {
	const button = document.getElementById(id);
	button.onclick = () => {
	host.TextToSpeechFeature[id](speechInput.value);
	};
});
```

First we need to wait for the TextToSpeechFeature to finish being initialized. It has likely already finished at this point but we add `await speechInit` just in case the glTF assets were very quick to load.  

`enableDragDrop` is a function from the `dragDropTextArea.js` script dependency we defined in Step 1. We pass it the id from our textarea to enable drag/drop functionality of text files onto the textarea.  

Last we loop through our playback control buttons and add `onclick` callbacks to execute play/pause/resume/stop methods on the TextToSpeechFeature. We'll pass them the value of the textarea so that the host knows what to say.

### Step 12. Add the ability to auto-generate SSML markup to play gestures

```javascript
// Update the text area text with gesture SSML markup when clicked
const gestureButton = document.getElementById('gestures');
const gestureMap = host.GestureFeature.createGestureMap();
gestureButton.onclick = () => {
  speechInput.value = HOST.aws.TextToSpeechUtils.autoGenerateSSMLMarks(
    speechInput.value,
    gestureMap
  );
};
```

[TextToSpeechUtils.autoGenerateSSMLMarks](https://aws-samples.github.io/amazon-sumerian-hosts/TextToSpeechUtils.html#autoGenerateSSMLMarks) is a method that allows you to define a speech string and an object that maps SSML mark strings to arrays of words. If words in the arrays are encountered in the speech string, an SSML mark tag is inserted with the value of the mark string is inserted prior to the word in the string and the resulting string is returned. Gestures can be triggered from mark tags by using the following syntax for the mark string: `{"feature":"GestureFeature", "method":"playGesture", "args":["<name of gesture layer goes here>", "<name of gesture animation goes here>"], {"holdTime":<optional holdTime value goes here>, "minimumInterval":<optional minimumInterval value goes here}}`. When an SSML speechmark is received by the GestureFeature, this syntax tells it that the feature type it applies to is the GestureFeature, the method to be executed is `playGesture` and the arguments that should be passed are in the `args` array. To make it easier to create an object that maps this type of syntax to word arrays, the Gesture feature includes a [createGestureMap](https://aws-samples.github.io/amazon-sumerian-hosts/GestureFeature.html#createGestureMap) method to generate an object based on the gestures animations that have been regisstered. Remember that we passed an options object with a `layers` property when we created the GestureFeature. Each layer object can contain an `animations` property corresponding to an object that maps animation names to animations options objects. Each animation options object can contain a `words` array representing an array of strings that the autoGenerateSSMLMarks will search for when trying to insert markup for that gesture. By default every animation on a layer is registered, even if you don't define options for it. If a gesture animation is registered without options, it will try to use an array defined for its name in the [DefaultGestureWords](https://aws-samples.github.io/amazon-sumerian-hosts/global.html#DefaultGestureWords) object if one exists. Because the animation names used in the sample `gesture.glb` files are present in the `DefaultGestureWords`, we didn't need to define anything extra when we created the feature.

We add an `onclick` callback to the `gestures` to update the text in the textarea with SSML markup to trigger the host gesture animations.

You've now created everything necessary to load host glTF assets into the three.js rendering engine and animate them along with audio generated in Amazon Polly. The finished script (minus the Cognito Identity Pool ID) can be found [here](examples/three.html). Run the script on a web server and give it a try. For information on how to run things locally, see the [three.js documentation](https://threejs.org/docs/#manual/en/introduction/How-to-run-things-locally).

## [Getting started in Babylon.js](#Getting-started-in-Babylon.js)  

Here we will take a look at the scripts necessary for the example code to function:

- ```javascript
  <!--Enable drag and drop text files on text to speech input area-->
  <script src="./scriptDependencies/dragDropTextArea.js"></script>
  ```

  Our example will include a [textarea](https://developer.mozilla.org/en-US/docs/Web/API/HTMLTextAreaElement) that you can use to input the text that you'd like your host to recite. [dragDropTextArea.js](examples/scriptDependencies/dragDropTextArea.js) is a local script that copies the contents of a text file into the textarea when you drag and drop a text file onto the textarea. This makes it easy to try out lots of different text.

- ```html
  <!--Text to speech dependency-->
  <script
      type="text/javascript"
      src="https://sdk.amazonaws.com/js/aws-sdk-2.645.0.min.js"
  ></script>
  ```

  The host will need to connect to Amazon Polly to convert text into into audio assets. https://sdk.amazonaws.com/js/aws-sdk-2.645.0.min.js is a minified build of the AWS SDK for Javascript. For the latest version, see the [AWS SDK for JavaScript API Reference](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/).

- ```html
  <!--Babylon.js dependencies-->
  <script src="./scriptDependencies/babylon.js"></script>
  <script src="./scriptDependencies/babylonjs.loaders.min.js"></script>
  ```

  Our example will need to be able to set up a new Babylon.js scene and load glTF files. These scripts are Babylon.js build files downloaded from the [Babylon.js github repository](https://github.com/BabylonJS/Babylon.js?files=1). Make sure to always include babylon.js first as it is a dependency for the babylonjs.loaders.min.js script.

- ```html
  <!--Host build file-->
  <script type="text/javascript" src="../dist/host.babylon.js"></script>
  ```
  host.babylon.js is the build file of the Amazon Sumerian Hosts repository that is specific to the Babylon.js rendering engine. It must be included after the babylon.js build file. This will make a module called `HOST` available to any scripts included after this.

  ```javascript
  import HOST from 'amazon-sumerian-hosts/dist/host.babylon.js'
  ```
  Alternatively, if you are working on a NodeJS project and install the package via `npm install --save-dev amazon-sumerian-hosts`, you can import the HOST library using the above syntax in any of your source files.

Now we'll move on to the body of the html file.

### Step 2. Add a loading screen

Our example is going to load several glTF assets so there will be a short time where there is no host visible in the scene. We will add a [div tag](https://developer.mozilla.org/en-US/docs/Web/API/HTMLDivElement) styled with an image and a loading spinner to show while the assets are being loaded.

- ```html
  <!--Loading screen-->
  <div id="loadScreen">
    <div id="loader"></div>
  </div>
  ```

  The outer div with id "loadScreen" is styled with a background image that fills the screen.

- ```css
  #loadScreen {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background-image: url('assets/images/load_screen.png');
    background-color: gray;
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-position: center;
    background-size: contain;
    z-index: 9999;
  }
  ```

  The inner div with id "loader" is styled with a spin animation that continuously rotates the spinner.

- ```css
  #loader {
    border: 16px solid #3498db38;
    border-radius: 50%;
    border-top: 16px solid #3498db;
    width: 120px;
    height: 120px;
    -webkit-animation: spin 2s linear infinite;
    animation: spin 2s linear infinite;
    position: fixed;
  }

  @-webkit-keyframes spin {
    0% {
      -webkit-transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(360deg);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  ```

### Step 3. Create the text to speech controls

Our host will need some text input so we can tell it what to say, as well as some controls to play/pause/resume/stop the speech. Take note of the id of each element, we'll be using these later. Note the use of the `<amazon:domain name="conversational">` ssml tag. Use of this tag results in a more natural speaking style in the speech audio, however it is currently only supported by the English language Matthew and Joanna voices.

```html
<!--Text to speech controls-->
<div id="textToSpeech">
  <div>
    <textarea autofocus size="23" type="text" id="textEntry">
<speak>
  <amazon:domain name="conversational">Hi there, my name is Maya. I used
    to only be a host inside Amazon Sumerian, but now you can use me in other
    Javascript runtime environments like three<sub alias="">.</sub>js and
    Babylon<sub alias="">.</sub>js. Right now I&apos;m in Babylon<sub alias="">.</sub>js.
  </amazon:domain>
</speak>
    	</textarea>
  </div>
  <button id="play" class="button">Play</button>
  <button id="pause" class="button">Pause</button>
  <button id="resume" class="button">Resume</button>
  <button id="stop" class="button">Stop</button>
  <div>
    <button id="gestures" class="button">Generate Gestures</button>
  </div>
</div>
```

Now we will move onto the contents of the example [script](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement) tag.

### Step 4. Configuring the AWS SDK

Our host will be using the [TextToSpeechFeature](https://aws-samples.github.io/amazon-sumerian-hosts/Babylon.js_TextToSpeechFeature.html), so before we can make the host speak we need to configure the AWS SDK with our region and credentials.

```javascript
// Initialize AWS and create Polly service objects
window.AWS.config.region = 'us-west-2';
window.AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: '<Enter Cognito Identity Pool ID here>',
});
```

Replace `'<Enter Cognito Identity Pool ID here>'` with the id you created in the [Prerequisites](#Prerequisites) section. Make sure to set the region to the one you created your Cognito Identity Pool in. Using CognitoIdentityCredentials is just one example of how you can authenticate your host to access Polly. See the [AWS SDK documentation](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html) to see other credentials classes you can use.

### Step 5. Initializing the Host TextToSpeechFeature

The [TextToSpeechFeature](https://aws-samples.github.io/amazon-sumerian-hosts/Babylon.js_TextToSpeechFeature.html) is the host feature that communicates with Amazon Polly to generate speech audio and speechmarks and plays them back at runtime. Before this feature can be used, it must be initialized with Polly and PollyPresigner instances, as well as the version of the AWS SDK being used.

```javascript
const polly = new AWS.Polly();
const presigner = new AWS.Polly.Presigner();
const speechInit = HOST.aws.TextToSpeechFeature.initializeService(
  polly,
  presigner,
  window.AWS.VERSION
);
```

[`HOST.aws.TextToSpeechFeature.initializeService`](https://aws-samples.github.io/amazon-sumerian-hosts/AbstractTextToSpeechFeature.html#.initializeService) returns a promise that will resolve once the feature has successfully connected to polly and populated its lists of available voices and languages. We'll store this as a variable so we can make sure it has resolved before allowing the user to send text to Polly.

Now we'll start setting up the visuals.

### Step 6. Define asset variables

- ```javascript
  const characterFile =
	'./assets/glTF/characters/adult_female/maya/maya.gltf';
  const animationPath = './assets/glTF/animations/adult_female';
  const animationFiles = ['stand_idle.glb', 'lipsync.glb', 'gesture.glb'];
  const gestureConfigFile = 'gesture.json';
  ```

  For this example we'll be using the character glTF file called `maya.gltf`. Maya uses the adult_female character skeleton, so we'll use animation files from the `adult_female` folder. `stand_idle.glb` and `lipsync.glb` contain all of the animations necessary to generate host lipsync animation at runtime. `gesture.glb` contains gesture animations that can be triggered while the host is speaking to emphasize certain words and give some variety to the performance.

- ```javascript
  const audioAttachJoint = 'char:def_c_neckB'; // Name of the joint to attach audio to
  ```

  The Host TextToSpeechFeature supports passing in an object to attach the speech audio to. We want the speech to appear to come from the host's mouth, so this variable defines the name of a joint in the maya.gltf asset that's located in the area of the character's head geometry.

- ```javascript
  const voice = 'Joanna'; // Polly voice. Full list of available voices at: https://docs.aws.amazon.com/polly/latest/dg/voicelist.html
  const voiceEngine = 'neural'; // Neural engine is not available for all voices in all regions: https://docs.aws.amazon.com/polly/latest/dg/NTTS-main.html
  ```
  These variables define the Polly voice and engine we'll use when synthesizing speech audio. The neural engine tends to produce better results than the standard engine, however it is limited to certain voices and regions. See the [Polly Documentation](https://docs.aws.amazon.com/polly/latest/dg/NTTS-main.html#ntts-regions) for more information about region and voice compatibility.

### Step 7. Create a Babylon.js scene and start the render loop

```javascript
// Set up the scene and host
const scene = createScene();
```

Here is where we create the Babylon.js scene and background environment. See the [Babylon.js documentation](https://doc.babylonjs.com/babylon101/first) for detailed information on the components that make up a scene in Babylon.js.

### Step 8. Load the glTF assets

```javascript
const {character, clips, bindPoseOffset} = await loadCharacter(
  scene,
  characterFile,
  animationPath,
  animationFiles
);

// Read the gesture config file. This file contains options for splitting up
// each animation in gestures.glb into 3 sub-animations and initializing them
// as a QueueState animation.
const gestureConfig = await fetch(
  `${animationPath}/${gestureConfigFile}`
).then(response => response.json());

const [idleClips, lipsyncClips, gestureClips] = clips;
```

Here is where we load the glTF assets we defined in Step 6. `loadCharacter` is an asynchronous function that uses the Babylon.js SceneLoader to load glTF asset as Babylon.js objects and add them to the scene. See the [Babylon.js documentation](https://doc.babylonjs.com/how_to/load_from_any_file_type) for more detailed information on loading assets.  

The `gestureConfigFile` is also being loaded here. This file is a JSON file that contains the information necessary to take each animation in `gesture.glb` and split it into 3 parts: a transition motion from the standing idle pose into the main posture of the gesture, a looping motion in the gesture posture, and a transition motion from the gesture posture back to the standing idle pose. Having a looping motion in the gesture allows us to take advantage of the `holdTime` functionality in the `GestureFeature`.

### Step 9. Initializing the Host

```javascript
const host = createHost(
  character,
  audioAttachJoint,
  voice,
  voiceEngine,
  idleClips[0],
  lipsyncClips,
  gestureClips,
  gestureConfig,
  bindPoseOffset,
  scene
);
```

Here we pass all of our assets and variables to the `createHost` function. This function is where we'll create the [HostObject](https://aws-samples.github.io/amazon-sumerian-hosts/Babylon.js_HostObject.html) and add features to it. Next we'll inspect what makes up the `createHost` function.

- ```javascript
  // Add the host to the render loop
  const host = new HOST.HostObject({owner: character});
  scene.onBeforeRenderObservable.add(() => {
  	host.update();
  });
  ```

  We pass the character asset we loaded earlier to the `HostObject` constructor so that the host system can keep track of the asset it's manipulating. This is also where we add the host's `update` function to the render loop so it will start animating.

- ```javascript
  // Set up text to speech
  const [audioAttach] = character.getDescendants(
	false,
	node => node.name === audioAttachJoint
  );
  host.addFeature(HOST.aws.TextToSpeechFeature, false, {
    scene,
    attachTo: audioAttach,
    voice,
    engine,
  });
  ```

  Here is where we add the [TextToSpeechFeature](https://aws-samples.github.io/amazon-sumerian-hosts/TextToSpeechFeature.html) to allow the host to convert text to audio and play it back. The TextToSpeechFeature will emit messages during playback events like play/pause/resume/stop as well as when speechmarks are encountered during the audio. We search the character asset's child hierarchy for the audioAttach variable we defined in Step 6 to find the Babylon.js node that matches that name. The host will use Babylon.js [Sound.attachToMesh](https://doc.babylonjs.com/api/classes/babylon.sound#attachtomesh) to attach sound to this node when it synthesizes speech audio.

- ```javascript
  // Set up animation
  host.addFeature(HOST.anim.AnimationFeature);
  ```

  Next we add the [AnimationFeature](https://aws-samples.github.io/amazon-sumerian-hosts/AnimationFeature.html). This is what allows you to manage and play animations on the host character asset. The AnimationFeature is a layered animation system, below we'll take a look at each animation layer and animations we'll add to make the host appear to speak and gesture when speech audio is playing.

  - ```javascript
    // Base idle
	host.AnimationFeature.addLayer('Base');
	host.AnimationFeature.addAnimation(
		'Base',
		idleClip.name,
		HOST.anim.AnimationTypes.single,
		{clip: idleClip}
	);
	host.AnimationFeature.playAnimation('Base', idleClip.name);
    ```
   
    Here we have added a single [AnimationLayer](https://aws-samples.github.io/amazon-sumerian-hosts/AnimationLayer.html) to the host. Animation layers are containers that manage playback of a subset of animations. Each AnimationLayer can only play a single animation at any given time, but a host animation can also be a container for multiple animation assets. Here we are creating an animation of type `HOST.anim.AnimationTypes.single`, which means that the animation can only contain one Babylon.js [AnimationGroup](https://doc.babylonjs.com/api/classes/babylon.animationgroup). The clip we've chosen is the `stand_idle` animation, which contains looping ambient motion in a standing position. This is the animation you'll see by default when the host isn't speaking. `host.AnimationFeature.playAnimation` is telling the host to start playing the idle animation on the `Base` layer we just created.

  - ```javascript
    // Talking idle
	host.AnimationFeature.addLayer('Talk', {
		transitionTime: 0.75,
		blendMode: HOST.anim.LayerBlendModes.Additive,
	});
	host.AnimationFeature.setLayerWeight('Talk', 0);
	const talkClip = lipsyncClips.find(c => c.name === 'stand_talk');
	lipsyncClips.splice(lipsyncClips.indexOf(talkClip), 1);
	host.AnimationFeature.addAnimation(
		'Talk',
		talkClip.name,
		HOST.anim.AnimationTypes.single,
		{clip: talkClip}
	);
	host.AnimationFeature.playAnimation('Talk', talkClip.name);
    ```
   
    The next animation layer we'll add will contain another looping idle that contains a full body motion in the standing position to simulate the type of ambient gestures people make when they talk. You'll notice that we've included some options this time when executing [`AnimationFeature.addLayer`](https://aws-samples.github.io/amazon-sumerian-hosts/AnimationFeature.html#addLayer). The `transitionTime` variable defines the default amount of time it takes to blend to a new animation on the layer. `blendMode` defines the type of blending that will be used when playing animations on this layer in combination with the other layers on the host. The default is `Override`, which means that animation on the layer would cancel out animations on layers underneath, but here we have defined the layer as `Additive`. This means that the animations on this layer will add on top of the animations on the layer named `Base`. [AnimationFeature.setLayerWeight](https://aws-samples.github.io/amazon-sumerian-hosts/AnimationFeature.html#setLayerWeight) tells the host that we don't want animations on this layer to have any influence by default. Layers can have weight values ranging from 0-1.

  - ```javascript
    // Viseme poses
    host.AnimationFeature.addLayer('Viseme', {
      transitionTime: 0.12,
      blendMode: HOST.anim.LayerBlendModes.Additive,
    });
    host.AnimationFeature.setLayerWeight('Viseme', 0);
    const blendStateOptions = lipsyncClips.map(clip => {
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
      HOST.anim.AnimationTypes.freeBlend,
      {blendStateOptions}
    );
    host.AnimationFeature.playAnimation('Viseme', 'visemes');
    ```

	Next we create an animation that will control the lipsync animation for the host. Lipsync is achieved by blending a series of poses that correspond to viseme speechmarks that the TextToSpeechFeature emits. See the [Polly documentation](https://docs.aws.amazon.com/polly/latest/dg/viseme.html) to find out more about the visemes that Polly generates.  

	You'll notice a difference here when we add the animation to the layer - we're using a different animation type called [`freeBlend`](https://aws-samples.github.io/amazon-sumerian-hosts/FreeBlendState.html). This type of animation allows you to control N-number of Babylon.js [AnimationGroups](https://doc.babylonjs.com/api/classes/babylon.animationgroup) at the same time. Each clip gets its own weight, if the cumulative weight of all of the clips in the animation container exceed 1 then they are normalized. As the host performs lipsync animation, it will manipulate these blend weights behind the scenes as viseme speechmarks are encountered to shape the host's mouth to match the sounds it is making.   

	Each blendStateOptions object also contains a `from` and `to` property. The first frame of each viseme pose is the reference pose for additive animation and we don't want that frame to be played back after it has been subtracted from the rest of the keyframes to convert it to additive, so these properties tell the AnimationFeature to only play back keyframes within this range.

  - ```javascript
    // Gesture animations
    host.AnimationFeature.addLayer('Gesture', {
      transitionTime: 0.5,
      blendMode: HOST.anim.LayerBlendModes.Additive,
    });

    gestureClips.forEach(clip => {
      const {name} = clip;
      const config = gestureConfig[name];

      if (config !== undefined) {
        // Add the clip to each queueOption so it can be split up
        config.queueOptions.forEach((option, index) => {
          option.clip = clip;
          option.to /= 30.0;
          option.from /= 30.0;
        });
        host.AnimationFeature.addAnimation(
          'Gesture',
          name,
          HOST.anim.AnimationTypes.queue,
          config
        );
      } else {
        host.AnimationFeature.addAnimation(
          'Gesture',
          name,
          HOST.anim.AnimationTypes.single,
          {clip}
        );
      }
    });
    ```

	Next we create the animations that will allow the host to perform gestures in time with ssml tags emitted from the `TextToSpeechFeature`. This is where the `gestureConfigFile` we loaded earlier becomes useful. The `gestureConfig` object is used to split each gesture into sub-clips using to and from frame ranges defined in the config. Instead of creating a `single` animation for each clip, we will use a [`queue`](https://aws-samples.github.io/amazon-sumerian-hosts/QueueState.html) type animation. This type of animation allows you to define an array of clips to be played in order. The queue will automatically advance once the currently playing clip stops.

  - ```javascript
    // Apply bindPoseOffset clip if it exists
    if (bindPoseOffset !== undefined) {
      host.AnimationFeature.addLayer('BindPoseOffset', {
        blendMode: HOST.anim.LayerBlendModes.Additive,
      });
      host.AnimationFeature.addAnimation(
        'BindPoseOffset',
        bindPoseOffset.name,
        HOST.anim.AnimationTypes.single,
        {clip: bindPoseOffset, from: 1 / 30, to: 2 / 30}
      );
      host.AnimationFeature.playAnimation(
        'BindPoseOffset',
        bindPoseOffset.name
      );
    }
    ```

	The last animation layer we'll add is optional, it is not needed for all of the provided host glTF character assets. All of the host assets in the `assets/glTF/characters/adult_male` folder share a common body skeleton, as do the assets in the `assets/glTF/characters/adult_female` folder. However each host character asset has unique facial joint placement. All of the animations in the `adult_male` folder were exported from the character skeleton in `wes.glTF`, and all of those in the `adult_female` folder were exported from the character skeleton in `fiona.glTF`. To make sharing animations within the same character classification possible, each of the other host glTF character assets include an animation clip containing 2 poses called `bindpose_offset`. The first pose in this animation keyframes the joints in the position the `wes.glTF` or `fiona.glTF` meshes were bound to their skeletons at, depending on which folder the asset is located in. The second pose keyframes the joints in pose character's meshes were bound to its own skeleton at. When the clip is made additive, the first pose is subtracted out of the second one, creating an offset that can be played on top of the other animations to correct the facial joints back to the starting position unique to the character asset.


- ```javascript
  // Set up Lipsync
  const visemeOptions = {
  	layers: [{name: 'Viseme', animation: 'visemes'}],
  };
  const talkingOptions = {
  	layers: [{name: 'Talk', animation: 'stand_talk'}],
  };
  host.addFeature(
	HOST.LipsyncFeature,
	false,
	visemeOptions,
	talkingOptions
  );
  ```
  Next we add the [LipsyncFeature](https://aws-samples.github.io/amazon-sumerian-hosts/LipsyncFeature.html). This is the feature that listens to the TextToSpeechFeature and manipulates animations in the AnimationFeature as speechmark messages are caught from the TextToSpeechFeature. This feature will have no effect until both of the prerequisite features have been added to the host.  

  The `visemeOptions` object tells the LipsyncFeature that we have one layer on the AnimationFeature that contains viseme-related animations, its name is `Viseme` and the freeBlend animation that contains the viseme poses is called `viseme`. The LipsyncFeature requires that the animation defined for `visemeOptions` is of type `freeBlend`, if it is not then lipsync animation will have no effect. Each layer defined in `visemeOptions` can optionally define a `visemeMap` object that maps the names of Polly visemes to options such as the name of the corresponding animation blend weight. In the provided host objects we have named all of the viseme animations to match the Polly visemes so we don't need to provide this object. See [DefaultVisemeMap](https://aws-samples.github.io/amazon-sumerian-hosts/global.html#DefaultVisemeMap) to see the required format if you define your own `visemeMap`. As the LipsyncFeature catches viseme events from the TextToSpeechFeature, it will look for the animation blend weight name defined in the `visemeMap` that corresponds with the name of the viseme speechmark. If it finds one it will blend its weight toward 1 and then back to zero over the duration of the viseme speechmark to simulate speech.

  The `talkingOptions` object tells the LipsyncFeature that we have one layer on the AnimationFeature that contains ambient talking motion, its name is `Talk` and the animation we want to play on that layer while speech audio is playing is called `stand_talk`. 
  
  When the LipsyncFeature catches play and resume speech events from the TextToSpeechFeature, it will blend the weight of any viseme or talking layers defined in `visemeOptions` and `talkingOptions` to 1 and play the animation defined for the layer. When it catches pause or stop events it will blend the weights back to 0.

- ```javascript
  // Set up Gestures
  host.addFeature(HOST.GestureFeature, false, {
    layers: {Gesture: {minimumInterval: 3}},
  });
  ```
  Finally we add the [GestureFeature](https://aws-samples.github.io/amazon-sumerian-hosts/GestureFeature.html). This is the feature that will control the `queue` animations we created earlier. The `layer` input parameter allows you to define the names of animation layers that the feature is able to manipulate. Each layer name is associated with a gesture options object specific to that layer. The `minimumInterval` option allows you to define the minimum amount of time in seconds that must elapse after each call to [GestureFeature.playGesture](https://aws-samples.github.io/amazon-sumerian-hosts/GestureFeature.html#playGesture) before another gesture can be played. Set this option to 0 if you don't want any limitations on playing gestures. Raising this option above 0 will give better looking results when auto-generating ssml markup for gestures. Another option that can be defined is `holdTime`. Remember that we defined our gesture animations as `queue` animations, and that the second animation in each queue was set to loop infinitely. Because of this, the queue can never progress to its final animation on its own. The GestureFeature listens for when the AnimationFeature emits its `playNextAnimation` message. This message is emitted each time a `queue` animation progresses. If the GestureFeature detects that the new current animation in the queue cannot progress, it will start a timer that expires after the number of seconds defined by `holdTime` elapses. Once that happens, it will progress the queue. We'll leave it at the default value of 3 for this example.

We have now added all of the host features necessary to simulate animated speech with body gestures.  

### Step 10. Hide the load screen

```javascript
// Hide the load screen and how the text input
document.getElementById('textToSpeech').style.display = 'inline-block';
document.getElementById('loadScreen').style.display = 'none';
```

All of the visuals for the host have been set up and we have begun playing back animation, so now is a good time to hide the load screen to begin showing the rendered results. We'll find and hide the loadScreen div and show the textToSpeech div.

### Step 11. Initialize the speech controls

```javascript
await speechInit;

// Enable drag/drop text files on the speech text area
enableDragDrop('textEntry');

// Play, pause, resume and stop the contents of the text input as speech
// when buttons are clicked
const speechInput = document.getElementById('textEntry');
['play', 'pause', 'resume', 'stop'].forEach(id => {
	const button = document.getElementById(id);
	button.onclick = () => {
	host.TextToSpeechFeature[id](speechInput.value);
	};
});
```

First we need to wait for the TextToSpeechFeature to finish being initialized. It has likely already finished at this point but we add `await speechInit` just in case the glTF assets were very quick to load.  

`enableDragDrop` is a function from the `dragDropTextArea.js` script dependency we defined in Step 1. We pass it the id from our textarea to enable drag/drop functionality of text files onto the textarea.  

Last we loop through our playback control buttons and add `onclick` callbacks to execute play/pause/resume/stop methods on the TextToSpeechFeature. We'll pass them the value of the textarea so that the host knows what to say.

### Step 12. Add the ability to auto-generate SSML markup to play gestures

```javascript
// Update the text area text with gesture SSML markup when clicked
const gestureButton = document.getElementById('gestures');
const gestureMap = host.GestureFeature.createGestureMap();
gestureButton.onclick = () => {
  speechInput.value = HOST.aws.TextToSpeechUtils.autoGenerateSSMLMarks(
    speechInput.value,
    gestureMap
  );
};
```

[TextToSpeechUtils.autoGenerateSSMLMarks](https://aws-samples.github.io/amazon-sumerian-hosts/TextToSpeechUtils.html#autoGenerateSSMLMarks) is a method that allows you to define a speech string and an object that maps SSML mark strings to arrays of words. If words in the arrays are encountered in the speech string, an SSML mark tag is inserted with the value of the mark string is inserted prior to the word in the string and the resulting string is returned. Gestures can be triggered from mark tags by using the following syntax for the mark string: `{"feature":"GestureFeature", "method":"playGesture", "args":["<name of gesture layer goes here>", "<name of gesture animation goes here>"], {"holdTime":<optional holdTime value goes here>, "minimumInterval":<optional minimumInterval value goes here}}`. When an SSML speechmark is received by the GestureFeature, this syntax tells it that the feature type it applies to is the GestureFeature, the method to be executed is `playGesture` and the arguments that should be passed are in the `args` array. To make it easier to create an object that maps this type of syntax to word arrays, the Gesture feature includes a [createGestureMap](https://aws-samples.github.io/amazon-sumerian-hosts/GestureFeature.html#createGestureMap) method to generate an object based on the gestures animations that have been regisstered. Remember that we passed an options object with a `layers` property when we created the GestureFeature. Each layer object can contain an `animations` property corresponding to an object that maps animation names to animations options objects. Each animation options object can contain a `words` array representing an array of strings that the autoGenerateSSMLMarks will search for when trying to insert markup for that gesture. By default every animation on a layer is registered, even if you don't define options for it. If a gesture animation is registered without options, it will try to use an array defined for its name in the [DefaultGestureWords](https://aws-samples.github.io/amazon-sumerian-hosts/global.html#DefaultGestureWords) object if one exists. Because the animation names used in the sample `gesture.glb` files are present in the `DefaultGestureWords`, we didn't need to define anything extra when we created the feature.

We add an `onclick` callback to the `gestures` to update the text in the textarea with SSML markup to trigger the host gesture animations.

You've now created everything necessary to load host glTF assets into the Babylon.js rendering engine and animate them along with audio generated in Amazon Polly. The finished script (minus the Cognito Identity Pool ID) can be found [here](examples/babylon.html). Run the script on a web server and give it a try. For information on how to run things locally, see the [three.js documentation](https://threejs.org/docs/#manual/en/introduction/How-to-run-things-locally).

# [Building the Package](#Building-the-Package)

## Prerequisites  

- Install [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Windows only - [Install Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl/install-win10)
- Install [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## Installation and Build Instructions

1. Create and cd into the folder you want to clone the repository to.
```
mkdir amazon-sumerian-hosts
cd amazon-sumerian-hosts
```

2. Clone the host repository  
```
git clone https://github.com/aws-samples/amazon-sumerian-hosts.git
```

3. Install dev dependencies
```
npm install
```

4. Generate build files
```
npm run build
```

You will now have new build files in the `build` directory. If you'd like to extend hosts to support another Javascript rendering engine, create a new folder inside `src` with the name of the engine you're adding support for. Extend any host modules that need to use resources specific to your rendering engine. See the `src/three.js` and `src/Babylon.js` folders for examples of files you'll likely need to include. Generally you will need to extend `Messenger` if your engine has an event/messaging system, `HostObject` if your engine keeps track of time and delta time, `AnimationFeature` and `SingleState` if your engine has an animation system, and `TextToSpeechFeature` and `Speech` if your engine has an audio system. Update `webpack.common.js` to add a new config for the engine you're adding support for.
