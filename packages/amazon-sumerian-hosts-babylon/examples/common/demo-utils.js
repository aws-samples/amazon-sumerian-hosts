function setupSceneEnvironment(scene) {
  // Create a simple environment.
  const environmentHelper = scene.createDefaultEnvironment({
    groundOpacity: 1,
    groundShadowLevel: 0.3
  });
  environmentHelper.setMainColor(BABYLON.Color3.Teal());

  // const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(-0.3, 1, 0));
  const light = new BABYLON.DirectionalLight('keyLight', new BABYLON.Vector3(0.3, -2, -1));
  light.intensity = 3;

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

  const shadowGenerator = new BABYLON.ShadowGenerator(2048, light);
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