/**
 * This function is the entry point for running a demo. It handles all Babylon
 * engine setup and instantiates a Babylon scene by calling the user-defined
 * `createScene` function argument.
 *
 * @param {function} createScene A function that returns a Babylon scene object
 */
async function loadDemo(createScene) {
  const canvas = document.getElementById('renderCanvas');
  const engine = new BABYLON.Engine(canvas, true);
  const scene = await createScene(BABYLON, canvas);
  scene.render();
  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());

  // Reveal the loaded scene.
  document.getElementById('mainScreen').classList.remove('loading');
}

/**
 * Creates a base scene by adding environment elements, lights, and a camera
 * to the provided scene object.
 *
 * @param {BABYLON.Scene} scene An empty scene object to which elements will be
 * added.
 * @returns {object} An object with the shape:
 ```
 {
   scene: BABYLON.Scene,
   shadowGenerator: BABYLON.ShadowGenerator
 }
 */
function setupSceneEnvironment(scene) {
  // Create a simple environment.
  const environmentHelper = scene.createDefaultEnvironment({
    groundOpacity: 1,
    groundShadowLevel: 0.1
  });
  environmentHelper.setMainColor(BABYLON.Color3.Teal());

  scene.environmentIntensity = 1.2;

  const shadowLight = new BABYLON.DirectionalLight('shadowLight', new BABYLON.Vector3(0.8, -2, -1));
  shadowLight.diffuse = new BABYLON.Color3(1, 0.9, 0.62);
  shadowLight.intensity = 2;

  const keyLight = new BABYLON.DirectionalLight('keyLight', new BABYLON.Vector3(0.3, -1, -2));
  keyLight.diffuse = new BABYLON.Color3(1, 0.9, 0.65);
  keyLight.intensity = 3;

  // Add a camera.
  const cameraRotation = BABYLON.Angle.FromDegrees(85).radians();
  const cameraPitch = BABYLON.Angle.FromDegrees(70).radians();
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    cameraRotation,
    cameraPitch,
    2.6,
    new BABYLON.Vector3(0, 1.0, 0));
  camera.wheelDeltaPercentage = 0.01;
  camera.minZ = 0.01;

  // Initialize user control of camera.
  const canvas = scene.getEngine().getRenderingCanvas();
  camera.attachControl(canvas, true);

  const shadowGenerator = new BABYLON.ShadowGenerator(2048, shadowLight);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.blurKernel = 8;
  scene.meshes.forEach(mesh => {
    shadowGenerator.addShadowCaster(mesh);
  });

  return { scene, shadowGenerator };
}

export default {
  loadDemo,
  setupSceneEnvironment
}