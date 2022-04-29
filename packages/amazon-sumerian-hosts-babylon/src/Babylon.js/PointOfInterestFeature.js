// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {
  PointOfInterestFeature as CorePointOfInterestFeature,
  AxisMap,
} from '@amazon-sumerian-hosts/core';
import {TransformNode} from '@babylonjs/core/Meshes/transformNode';

/**
 * @extends core/PointOfInterestFeature
 * @alias babylonjs/PointOfInterestFeature
 */
class PointOfInterestFeature extends CorePointOfInterestFeature {
  static _getWorldPosition(obj) {
    return obj.getWorldMatrix().m.slice(12, 15);
  }

  static _getWorldMatrix(obj) {
    return [...obj.getWorldMatrix().m];
  }

  static _sphericalToBlendValue(...args) {
    const blendValue = super._sphericalToBlendValue(...args);

    //Revert theta blend value if not using right hand coordinate system
    blendValue.h = this.useRightHandCoordinateSystem ? blendValue.h : blendValue.h * -1;

    return blendValue;
  }

  _validateTransformObject(obj) {
    return obj instanceof TransformNode;
  }

  /**
   *
   * @param {string} name
   */
  setTargetByName(name) {
    super.setTargetByName(name);
    if (!name) {
      return;
    }

    this.target = this._scene.getTransformNodeByName(name);
  }

  /**
   *
   * @param {string} id
   */
  setTargetById(id) {
    super.setTargetByName(id);
    if (!id) {
      return;
    }

    this.target = this._scene.getTransformNodeByID(id);
  }
}

export default PointOfInterestFeature;
export {AxisMap};
