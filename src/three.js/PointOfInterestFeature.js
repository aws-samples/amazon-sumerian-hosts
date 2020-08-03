// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CorePointOfInterestFeature, {AxisMap} from 'core/PointOfInterestFeature';

/**
 * @extends core/PointOfInterestFeature
 * @alias three.js/PointOfInterestFeature
 */
class PointOfInterestFeature extends CorePointOfInterestFeature {
  static _getWorldPosition(obj) {
    obj.updateWorldMatrix(true, false);
    return obj.matrixWorld.elements.slice(12, 15);
  }

  static _getWorldMatrix(obj) {
    obj.updateWorldMatrix(true, false);
    return [...obj.matrixWorld.elements];
  }

  _validateTransformObject(obj) {
    return obj instanceof THREE.Object3D;
  }

  setTargetByName(name) {
    super.setTargetByName(name);
    if (!name) {
      return;
    }

    this.target = this._scene.getObjectByName(name);
  }

  setTargetById(id) {
    super.setTargetByName(id);
    if (!id) {
      return;
    }

    this.target = this._scene.getObjectById(id);
  }
}

export default PointOfInterestFeature;
export {AxisMap};
