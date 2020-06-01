// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
export default function describeBabylonHost(description, fn) {
  describe(`Babylon Host - ${description}`, () => {
    // Canvas
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.id = 'renderCanvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style['touch-action'] = 'none';

    const engine = new BABYLON.Engine(canvas, true);
    const scene = new BABYLON.Scene(engine);

    const owner = BABYLON.MeshBuilder.CreateSphere(
      'sphere',
      {diameter: 2, segments: 4},
      scene
    );

    fn({scene, owner}, 'babylon');
  });
}
