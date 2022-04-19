import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import {HostObject, aws} from '@amazon-sumerian-hosts/babylon';

async function main() {
  // This is served by webpack-dev-server and comes from demo-credentials.js in the repo root
  // If you copy this example, you will substitute in your own cognito Pool ID
  const config = await (await fetch('/devConfig.json')).json();
  // Parse the region out of the cognito Id
  const region = config.cognitoIdentityPoolId.split(':')[0];

  // Initialize AWS and create Polly service objects
  window.AWS.config.region = region;
  window.AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: config.cognitoIdentityPoolId,
  });
  const polly = new AWS.Polly();
  const presigner = new AWS.Polly.Presigner();

  // Add services to Host text to speech
  await aws.TextToSpeechFeature.initializeService(
    polly,
    presigner,
    window.AWS.VERSION
  );

  let scene;
  let hostOwner;
  let audioAttach;

  function babylonScene() {
    // Canvas
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.id = 'renderCanvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style['touch-action'] = 'none';

    // Scene
    const engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    scene.useRightHandedSystem = true;
    scene.fogColor.set(0.5, 0.5, 0.5);
    engine.runRenderLoop(scene.render.bind(scene));

    // Camera
    const camera = new BABYLON.ArcRotateCamera(
      'Camera',
      Math.PI / 2,
      Math.PI / 2,
      1.6,
      new BABYLON.Vector3(0, 1.6, 0),
      scene
    );
    camera.minZ = 0.1;
    camera.maxZ = 1000;
    camera.setPosition(new BABYLON.Vector3(0, 1.6, 2.6));
    camera.setTarget(new BABYLON.Vector3(0, 1, 0));
    camera.wheelDeltaPercentage = 0.01;
    camera.attachControl(canvas, true);

    hostOwner = new BABYLON.TransformNode('hostOwner', scene);
    audioAttach = new BABYLON.TransformNode('audioAttach', scene);
    audioAttach.position.z = -50;
  }
  babylonScene();

  // Create the speaker who will deliver speeches
  const speaker = new HostObject({owner: hostOwner});

  console.log('FJGNJFKDNDF hello from babylon.textttospeech');
  console.log(BABYLON.Engine.audioEngine);
  console.log(BABYLON.Engine.audioEngine.audioContext);
  // Add text to speech capability to the speaker
  speaker.addFeature(aws.TextToSpeechFeature, false, {
    scene,
    attachTo: audioAttach,
  });

  // Listen for speech events from the speaker
  speaker.listenTo(
    speaker.TextToSpeechFeature.EVENTS.play,
    s => {
      console.log('Start Speech', s);
    },
    speaker
  );

  speaker.listenTo(
    speaker.TextToSpeechFeature.EVENTS.pause,
    s => {
      console.log('Pause Speech', s);
    },
    speaker
  );

  speaker.listenTo(
    speaker.TextToSpeechFeature.EVENTS.resume,
    s => {
      console.log('Resume Speech', s);
    },
    speaker
  );

  speaker.listenTo(
    speaker.TextToSpeechFeature.EVENTS.interrupt,
    s => {
      console.log('Interrupt Speech', s);
    },
    speaker
  );

  ['sentence', 'word', 'viseme', 'ssml'].forEach(typeName => {
    speaker.listenTo(
      speaker.TextToSpeechFeature.EVENTS[typeName],
      data => {
        console.log(data.mark.value);
      },
      speaker
    );
  });

  speaker.listenTo(
    speaker.TextToSpeechFeature.EVENTS.stop,
    s => {
      console.log('Stop Speech', s);
    },
    speaker
  );

  // Render loop
  function render() {
    speaker.update();
  }
  scene.onAfterRenderObservable.add(render);

  // Test speeches
  function testSpeech() {
    console.log('TEST PLAY');
    speaker.TextToSpeechFeature.play(
      'Testing, testing, 1, 2, 3. This is a test.'
    );

    // Adjust the speaker's volume throughout the test
    speaker.TextToSpeechFeature.setVolume(0, 4).then(() => {
      speaker.TextToSpeechFeature.setVolume(0.5, 4).then(() => {
        speaker.TextToSpeechFeature.setVolume(1.0);
      });
    });

    // Test interrupting a speech and re-playing
    setTimeout(() => {
      console.log('TEST INTERRUPT WITH SELF');
      speaker.TextToSpeechFeature.play(
        'Testing, testing, 1, 2, 3. This is a test.'
      );
    }, 2500);

    // Test interrupting a speech with a different one
    setTimeout(() => {
      console.log('TEST INTERRUPT WITH OTHER');
      speaker.TextToSpeechFeature.play(
        'Now I will say something else, cancelling the last speech.',
        {
          Engine: 'standard',
          Language: 'English, British',
          VoiceId: 'Russell',
        }
      );
    }, 4000);

    // Test pause, resume and stop
    setTimeout(() => {
      console.log('TEST PAUSE');
      speaker.TextToSpeechFeature.pause();
    }, 5500);

    setTimeout(() => {
      console.log('TEST RESUME');
      speaker.TextToSpeechFeature.resume();
    }, 6500);

    setTimeout(() => {
      console.log('TEST STOP');
      speaker.TextToSpeechFeature.stop();
    }, 7500);

    // Make sure the stopped speech still works
    setTimeout(() => {
      console.log('TEST RE-PLAY');
      speaker.TextToSpeechFeature.play(
        'Now I will say something else, cancelling the last speech.'
      ).then(async () => {
        console.log('IM DONE! STARTING QUEUE TEST');
        speaker.stopListeningToAll();

        console.log('TEST QUEUE AT INTERVAL 0ms');
        await testQueue(0);

        console.log('TEST QUEUE AT INTERVAL 50ms');
        await testQueue(50);

        console.log('TEST QUEUE AT INTERVAL 500ms');
        await testQueue(500);
      });
    }, 8500);
  }

  function testQueue(interval) {
    return new Promise(resolve => {
      const speechQueue = [
        'One. This is the first test.',
        'Two. This is the second test. It is a speech that is generic and has some length.',
        'Three. This is the third test. It is a speech that is generic and has some length. This one is the longest speech.',
        'Four.',
        'Five. This is the fifth test. It is a speech that is generic and has some length.',
      ];
      let isPlaying = false;

      function playSpeech(index) {
        // Suppress current speech resolution
        if (isPlaying) {
          speaker.TextToSpeechFeature.pause();
        }

        // Start playing the speech text at the given index
        isPlaying = true;
        const text = speechQueue[index];
        const promise = speaker.TextToSpeechFeature.play(text);

        promise.then(() => {
          // Don't continue to the next speech if the last one was canceled
          if (promise.canceled) {
            console.log('CANCELED QUEUED SPEECH', text);
            return;
          }

          isPlaying = false;
          index += 1;

          // Play the next speech in the queue
          if (index < speechQueue.length) {
            console.log('ADVANCING QUEUE');
            playSpeech(index);
          }

          // Signal completion if there are no more speeches
          else {
            console.log('QUEUE COMPLETE');
            resolve();
          }
        });
      }

      for (let i = 0, l = speechQueue.length; i < l; i += 1) {
        setTimeout(() => {
          console.log('PLAY QUEUE FROM INDEX', i);
          playSpeech(i);
        }, interval * i);
      }
    });
  }

  testSpeech();
}

main();
