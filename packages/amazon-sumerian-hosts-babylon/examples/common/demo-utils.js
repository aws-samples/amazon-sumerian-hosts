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
  setupSceneEnvironment
}