/* eslint-disable camelcase */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-inner-declarations */

import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import * as HOST from '@amazon-sumerian-hosts/babylon';

async function main() {
  const {scene, shadowGenerator} = createScene();
  const {character, clips} = await loadCharacter('../../assets/Xbot.glb');
  const host = createHost();
  addListeners(host);
  createPanel();

  function createScene() {
    // Canvas
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.id = 'renderCanvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style['touch-action'] = 'none';

    // Scene
    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);
    scene.useRightHandedSystem = true;
    scene.fogColor.set(0.63, 0.63, 0.63);
    scene.fogStart = 10;
    scene.fogEnd = 50;
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

    // Lights
    const hemiLight = new BABYLON.HemisphericLight(
      'light1',
      new BABYLON.Vector3(0, -20, 0),
      scene
    );
    hemiLight.intensity = 2;
    hemiLight.groundColor = BABYLON.Color3.FromHexString('0x444444');
    hemiLight.specular = BABYLON.Color3.Black();

    const dirLight = new BABYLON.DirectionalLight(
      'dir01',
      new BABYLON.Vector3(0, -0.5, -1.0),
      scene
    );
    dirLight.position = new BABYLON.Vector3(0, 20, 0);
    dirLight.specular = BABYLON.Color3.FromHexString('0x444444');

    // Shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    // Environment
    const helper = scene.createDefaultEnvironment({
      enableGroundShadow: true,
    });
    helper.setMainColor(new BABYLON.Color3(1, 1, 1));
    helper.ground.receiveShadows = true;

    return {scene, shadowGenerator};
  }

  function loadCharacter(filePath) {
    const currentAnimations = [...scene.animationGroups];

    return new Promise(resolve => {
      BABYLON.SceneLoader.ImportMesh(
        '',
        filePath,
        undefined,
        scene,
        newMeshes => {
          const [character] = newMeshes;
          const newAnimations = scene.animationGroups.filter(
            a => !currentAnimations.includes(a)
          );

          // Cast shadows
          shadowGenerator.addShadowCaster(character, true);
          for (let index = 0; index < newMeshes.length; index++) {
            newMeshes[index].receiveShadows = false;
          }

          resolve({character, clips: newAnimations});
        }
      );
    });
  }

  function createHost() {
    // Create a host with an animation feature
    const host = new HOST.HostObject({owner: character});
    host.addFeature(HOST.anim.AnimationFeature);
    scene.onBeforeAnimationsObservable.add(() => {
      host.update();
    });

    // Create 3 layers: Override, Additive, Override
    host.AnimationFeature.addLayer('BaseLayer');
    host.AnimationFeature.addLayer('AdditiveLayer', {
      blendMode: HOST.anim.LayerBlendModes.Additive,
    });
    host.AnimationFeature.addLayer('OverrideLayer', {
      transitionTime: 0.5,
    });

    // Set up base layer animations
    const idleClip = clips.find(a => a.name === 'idle');
    host.AnimationFeature.addAnimation(
      'BaseLayer',
      idleClip.name,
      HOST.anim.AnimationTypes.single,
      {clip: idleClip}
    );
    host.AnimationFeature.playAnimation('BaseLayer', 'idle');

    // Set up additive layer animations
    const sneakClip = clips.find(a => a.name === 'sneak_pose');
    BABYLON.AnimationGroup.MakeAnimationAdditive(sneakClip);
    host.AnimationFeature.addAnimation(
      'AdditiveLayer',
      sneakClip.name,
      HOST.anim.AnimationTypes.single,
      {clip: sneakClip, from: 2 / 30, to: 3 / 30}
    );
    host.AnimationFeature.playAnimation('AdditiveLayer', 'sneak_pose');

    // Set up override layer animations
    const sadClip = clips.find(a => a.name === 'sad_pose');
    const agreeClip = clips.find(a => a.name === 'agree');
    const headShakeClip = clips.find(a => a.name === 'headShake');
    const walkClip = clips.find(a => a.name === 'walk');
    const runClip = clips.find(a => a.name === 'run');

    // Set up freeBlend animation
    host.AnimationFeature.addAnimation(
      'OverrideLayer',
      'freeBlend',
      HOST.anim.AnimationTypes.freeBlend,
      {
        blendStateOptions: [
          {
            name: 'sad',
            clip: sadClip,
            from: 2 / 30,
            to: 3 / 30,
            weight: 1,
          },
          {name: 'agree', clip: agreeClip, weight: 1},
          {name: 'headShake', clip: headShakeClip, weight: 1},
          {name: 'walk', clip: walkClip, weight: 1},
        ],
      }
    );

    // Set up queue animations
    host.AnimationFeature.addAnimation(
      'OverrideLayer',
      'movementQueue',
      HOST.anim.AnimationTypes.queue,
      {
        queueOptions: [
          {
            name: 'walk',
            clip: walkClip,
            loopCount: 2,
          },
          {
            name: 'run',
            clip: runClip,
            loopCount: 3,
          },
        ],
      }
    );
    host.AnimationFeature.addAnimation(
      'OverrideLayer',
      'idleQueue',
      HOST.anim.AnimationTypes.queue,
      {
        queueOptions: [
          {
            name: 'headShake',
            clip: headShakeClip,
          },
          {
            name: 'agree',
            clip: agreeClip,
            loopCount: 1,
          },
        ],
      }
    );
    // Set up SingleState animation
    host.AnimationFeature.addAnimation(
      'OverrideLayer',
      'singleState',
      HOST.anim.AnimationTypes.single,
      {clip: runClip}
    );

    // Set up random animations
    host.AnimationFeature.addAnimation(
      'OverrideLayer',
      'randomAnimation',
      HOST.anim.AnimationTypes.randomAnimation,
      {
        subStateOptions: [
          {name: 'sub1', clip: idleClip},
          {name: 'sub2', clip: runClip},
          {name: 'sub3', clip: walkClip},
        ],
      }
    );

    // Set up 1D-blend animations
    host.AnimationFeature.addAnimation(
      'OverrideLayer',
      'blend1D',
      HOST.anim.AnimationTypes.blend1d,
      {
        blendStateOptions: [
          {
            name: 'sad',
            clip: sadClip,
          },
          {
            name: 'walk',
            clip: walkClip,
          },
          {
            name: 'run',
            clip: runClip,
          },
        ],
        blendThresholds: [-4, -2, 2],
        blendMatchPhases: [false, true, true],
      }
    );

    // Set up 2D-blend animations
    const look_ul = clips.find(a => a.name === 'look_UL');
    const look_ur = clips.find(a => a.name === 'look_UR');
    const look_uc = clips.find(a => a.name === 'look_UC');
    const look_cl = clips.find(a => a.name === 'look_CL');
    const look_cr = clips.find(a => a.name === 'look_CR');
    const look_cc = clips.find(a => a.name === 'look_CC');
    const look_dl = clips.find(a => a.name === 'look_DL');
    const look_dr = clips.find(a => a.name === 'look_DR');
    const look_dc = clips.find(a => a.name === 'look_DC');

    host.AnimationFeature.addAnimation(
      'OverrideLayer',
      'blend2D',
      HOST.anim.AnimationTypes.blend2d,
      {
        blendStateOptions: [
          {
            name: 'look_ul',
            clip: look_ul,
          },
          {
            name: 'look_uc',
            clip: look_uc,
          },
          {
            name: 'look_ur',
            clip: look_ur,
          },
          {
            name: 'look_cl',
            clip: look_cl,
          },
          {
            name: 'look_cc',
            clip: look_cc,
          },
          {
            name: 'look_cr',
            clip: look_cr,
          },
          {
            name: 'look_dl',
            clip: look_dl,
          },
          {
            name: 'look_dc',
            clip: look_dc,
          },
          {
            name: 'look_dr',
            clip: look_dr,
          },
        ],
        blendThresholds: [
          [-0.707, 0.707],
          [0, 1],
          [0.707, 0.707],
          [-1, 0],
          [0, 0],
          [1, 0],
          [-0.707, -0.707],
          [0, -1],
          [0.707, -0.707],
        ],
      }
    );

    host.AnimationFeature.playAnimation('OverrideLayer', 'movementQueue', 0);

    return host;
  }

  function createPanel() {
    // eslint-disable-next-line no-undef
    const panel = new dat.GUI({width: 310});
    const panelSettings = {
      Pause: () => {
        host.AnimationFeature.pause();
      },
      Resume: () => {
        host.AnimationFeature.resume();
      },
    };

    // Create a folder for each layer
    host.AnimationFeature.layers.map(name => {
      const folder = panel.addFolder(name);
      const folderSettings = {
        Weight: 1,
        Pause: () => {
          host.AnimationFeature.pauseLayer(name);
        },
        Resume: () => {
          host.AnimationFeature.resumeLayer(name);
        },
      };

      // Create a weight slider
      folder
        .add(folderSettings, 'Weight', 0.0, 1.0, 0.01)
        .listen()
        .onChange(weight => {
          host.AnimationFeature.setLayerWeight(name, weight);
        });

      // Create an animation selector
      const animations = [null, ...host.AnimationFeature.getAnimations(name)];
      const currentAnimation = host.AnimationFeature.getCurrentAnimation(name);
      const switcherSettings = {'Current Animation': currentAnimation};

      const animSwitcher = folder
        .add(switcherSettings, 'Current Animation')
        .options(animations)
        .listen();
      animSwitcher.onChange(() => {
        const anim =
          switcherSettings['Current Animation'] === 'null'
            ? null
            : switcherSettings['Current Animation'];
        host.AnimationFeature.playAnimation(
          name,
          anim,
          0.5,
          HOST.anim.Easing.Quadratic.InOut
        );
      });

      // Add resume button
      folder.add(folderSettings, 'Pause');

      // Add pause button
      folder.add(folderSettings, 'Resume');

      // Create an animations folder
      const animFolder = folder.addFolder('Animations');
      animations.slice(1).forEach(animation => {
        const animationFolder = animFolder.addFolder(animation);
        const animationSettings = {
          Play: () => {
            switcherSettings['Current Animation'] = animation;
            host.AnimationFeature.playAnimation(name, animation);
          },
          Pause: () => {
            host.AnimationFeature.pauseAnimation(name);
          },
          Resume: () => {
            switcherSettings['Current Animation'] = animation;
            host.AnimationFeature.resumeAnimation(name, animation);
          },
          Stop: () => {
            host.AnimationFeature.stopAnimation(name, animation);
          },
          Next: () => {
            if (switcherSettings['Current Animation'] !== animation) {
              switcherSettings['Current Animation'] = animation;
              host.AnimationFeature.resumeAnimation(name, animation);
            }
            host.AnimationFeature.playNextAnimation('OverrideLayer');
          },
        };

        // Add playback buttons
        animationFolder.add(animationSettings, 'Play');
        animationFolder.add(animationSettings, 'Pause');
        animationFolder.add(animationSettings, 'Resume');
        animationFolder.add(animationSettings, 'Stop');

        const animType = host.AnimationFeature.getAnimationType(
          name,
          animation
        );

        // Add the next button for queue states
        if (animType === 'queue') {
          animationFolder.add(animationSettings, 'Next');
        }

        // Add two value sliders for blend2d states
        else if (animType === 'blend2d') {
          animationSettings.blendWeightX = 0;
          animationFolder
            .add(animationSettings, 'blendWeightX', -1, 1, 0.01)
            .listen()
            .onChange(weight => {
              host.AnimationFeature.setAnimationBlendWeight(
                name,
                animation,
                'X',
                weight
              );
            });

          animationSettings.blendWeightY = 0;
          animationFolder
            .add(animationSettings, 'blendWeightY', -1, 1, 0.01)
            .listen()
            .onChange(weight => {
              host.AnimationFeature.setAnimationBlendWeight(
                name,
                animation,
                'Y',
                weight
              );
            });

          function onMouseMove(event) {
            const x = (event.clientX / window.innerWidth) * 2 - 1;
            const y = -(event.clientY / window.innerHeight) * 2 + 1;

            animationSettings.blendWeightX = -x;
            animationSettings.blendWeightY = y;

            host.AnimationFeature.setAnimationBlendWeight(
              name,
              animation,
              'X',
              -x
            );

            host.AnimationFeature.setAnimationBlendWeight(
              name,
              animation,
              'Y',
              y
            );
          }
          window.addEventListener('mousemove', onMouseMove, false);
        }

        // Add weight sliders for freeBlend states
        else if (animType === 'freeBlend') {
          host.AnimationFeature.getAnimationBlendNames(name, animation).forEach(
            blendName => {
              animationSettings[blendName] = 1;
              animationFolder
                .add(animationSettings, blendName, 0.0, 1.0, 0.01)
                .listen()
                .onChange(weight => {
                  host.AnimationFeature.setAnimationBlendWeight(
                    name,
                    animation,
                    blendName,
                    weight
                  );
                });
            }
          );
        }

        // Add a single value slider for blend1d states
        else if (animType === 'blend1d') {
          animationSettings.blendWeight = 0;
          animationFolder
            .add(animationSettings, 'blendWeight', -5, 5, 0.1)
            .listen()
            .onChange(weight => {
              host.AnimationFeature.setAnimationBlendWeight(
                name,
                animation,
                null,
                weight
              );
            });
        }

        // Add normalizedTime sliders for single states
        else if (animType === 'single') {
          const currentState = host._features.AnimationFeature._layerMap[
            name
          ].getState(animation);
          animationSettings.NormalizedTime = currentState.normalizedTime;
          scene.registerBeforeRender(() => {
            animationSettings.NormalizedTime = currentState.normalizedTime;
          });
          animationFolder
            .add(animationSettings, 'NormalizedTime', 0.0, 1.0, 0.01)
            .listen()
            .onChange(time => {
              currentState.normalizedTime = time;
            });
        }
      });

      folder.open();

      return folder;
    });

    // Create feature level play and pause buttons
    // Add resume button
    panel.add(panelSettings, 'Pause');

    // Add pause button
    panel.add(panelSettings, 'Resume');
  }

  function addListeners(host) {
    host.listenTo(
      host.AnimationFeature.EVENTS.playAnimation,
      e => {
        console.log('Play animation', e);
      },
      host
    );

    host.listenTo(
      host.AnimationFeature.EVENTS.playNextAnimation,
      e => {
        console.log('Next animation', e);
      },
      host
    );

    host.listenTo(
      host.AnimationFeature.EVENTS.pauseAnimation,
      e => {
        console.log('Pause animation', e);
      },
      host
    );

    host.listenTo(
      host.AnimationFeature.EVENTS.resumeAnimation,
      e => {
        console.log('Resume animation', e);
      },
      host
    );

    host.listenTo(
      host.AnimationFeature.EVENTS.interruptAnimation,
      e => {
        console.log('Interrupt animation', e);
      },
      host
    );

    host.listenTo(
      host.AnimationFeature.EVENTS.stopAnimation,
      e => {
        console.log('Stop animation', e);
      },
      host
    );
  }
}

main();
