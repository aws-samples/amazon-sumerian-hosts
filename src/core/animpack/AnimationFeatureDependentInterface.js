// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/* eslint-disable no-unused-vars */
/* eslint-disable max-classes-per-file */
import FeatureDependentInterface from 'core/FeatureDependentInterface';

/**
 * Class factory interface for features that are dependent on the AnimationFeature
 * being present on the host. Layer and animation events will automatically be
 * listened for once a AnimationFeature is added to the host and stopped once it
 * is removed.
 */
export default class AnimationFeatureDependentInterface extends FeatureDependentInterface {
  /**
   * @private
   *
   * Executed when animation layer added events are caught.
   *
   * @param {string} name - Name of the layer that was added.
   */
  _onLayerAdded({name}) {}

  /**
   * @private
   *
   * Executed when animation layer removed events are caught.
   *
   * @param {string} name - Name of the layer that was removed.
   */
  _onLayerRemoved({name}) {}

  /**
   * @private
   *
   * Executed when animation layer renamed events are caught.
   *
   * @param {string} oldName - Name of the layer that was renamed.
   * @param {string} newName - New name of the layer.
   */
  _onLayerRenamed({oldName, newName}) {}

  /**
   * @private
   *
   * Executed when animation added events are caught.
   *
   * @param {string} layerName - Name of the layer that an animation was added to.
   * @param {string} animationName - Name of the animation that was added.
   */
  _onAnimationAdded({layerName, animationName}) {}

  /**
   * @private
   *
   * Executed when animation removed events are caught.
   *
   * @param {string} layerName - Name of the layer that an animation was removed from.
   * @param {string} animationName - Name of the animation that was removed.
   */
  _onAnimationRemoved({layerName, animationName}) {}

  /**
   * @private
   *
   * Executed when animation renamed events are caught.
   *
   * @param {string} layerName - Name of the layer that an animation belongs to.
   * @param {string} oldName - Name of the animation that was renamed.
   * @param {string} newName - New name of the animation.
   */
  _onAnimationRenamed({layerName, oldName, newName}) {}

  static Mixin(BaseClass) {
    const ParentClass = FeatureDependentInterface.Mixin(BaseClass);
    const AnimationFeatureDependentMixin = class extends ParentClass {
      _onLayerAdded({name}) {}

      _onLayerRemoved({name}) {}

      _onLayerRenamed({oldName, newName}) {}

      _onAnimationAdded({layerName, animationName}) {}

      _onAnimationRemoved({layerName, animationName}) {}

      _onAnimationRenamed({layerName, oldName, newName}) {}
    };

    Object.defineProperties(AnimationFeatureDependentMixin, {
      EVENT_DEPENDENCIES: {
        value: {
          ...ParentClass.EVENT_DEPENDENCIES,
          ...AnimationFeatureDependentInterface.EVENT_DEPENDENCIES,
        },
        writable: false,
      },
    });

    return AnimationFeatureDependentMixin;
  }
}

Object.defineProperties(AnimationFeatureDependentInterface, {
  EVENT_DEPENDENCIES: {
    value: {
      AnimationFeature: {
        addLayer: '_onLayerAdded',
        removeLayer: '_onLayerRemoved',
        renameLayer: '_onLayerRenamed',
        addAnimation: '_onAnimationAdded',
        removeAnimation: '_onAnimationRemoved',
        renameAnimation: '_onAnimationRenamed',
      },
    },
    writable: false,
  },
});
