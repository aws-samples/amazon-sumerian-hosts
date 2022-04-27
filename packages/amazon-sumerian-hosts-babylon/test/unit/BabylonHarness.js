// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {Scene} from '@babylonjs/core/scene';
import {Engine} from '@babylonjs/core/Engines/engine';
import {Mesh} from '@babylonjs/core/Meshes/mesh';
// Side-effects only imports allowing Mesh to create default shapes
import '@babylonjs/core/Meshes/Builders/sphereBuilder';

export default function describeBabylonHost(description, fn) {
  describe(`Babylon Host - ${description}`, () => {
    // Canvas
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.id = 'renderCanvas';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style['touch-action'] = 'none';

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);

    const owner = Mesh.CreateSphere(
      'sphere',
      {diameter: 2, segments: 4},
      scene
    );

    fn({scene, owner}, 'babylon');
  });
}
