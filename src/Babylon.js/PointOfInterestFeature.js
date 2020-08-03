// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import CorePointOfInterestFeature, { AxisMap } from 'core/PointOfInterestFeature';

/**
 * @extends core/PointOfInterestFeature
 * @alias Babylon.js/PointOfInterestFeature
 */
class PointOfInterestFeature extends CorePointOfInterestFeature {
  static _getWorldPosition(obj) {
    return obj.getWorldMatrix().m.slice(12, 15);
  }

  static _getWorldMatrix(obj) {
    return [...obj.getWorldMatrix().m];
  }

  _validateTransformObject(obj) {
    return obj instanceof BABYLON.TransformNode;
  }

  setTargetByName(name) {
    super.setTargetByName(name);
    if (!name) {
      return;
    }

    this.target = this._scene.getTransformNodeByName(name);
  }

  setTargetById(id) {
    super.setTargetByName(id);
    if (!id) {
      return;
    }

    this.target = this._scene.getTransformNodeByID(id);
  }
}

export default PointOfInterestFeature;
export { AxisMap };
