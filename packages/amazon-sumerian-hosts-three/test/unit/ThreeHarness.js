// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
export default function describeThreeHost(description, fn) {
  describe(`Three Host - ${description}`, () => {
    const scene = new THREE.Scene();
    const owner = new THREE.Object3D();
    scene.add(owner);

    fn({scene, owner}, 'three');
  });
}
