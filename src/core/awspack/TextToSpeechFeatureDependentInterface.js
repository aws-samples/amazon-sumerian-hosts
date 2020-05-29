// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/* eslint-disable max-classes-per-file */
import FeatureDependentInterface from 'core/FeatureDependentInterface';

/**
 * Class factory interface for features that are dependent on the TextToSpeechFeature
 * being present on the host. Speech events will automatically be listened for once a
 * TextToSpeechFeature is added to the host and stopped once it is removed.
 */
export default class TextToSpeechFeatureDependentInterface extends FeatureDependentInterface {
  /**
   * @private
   *
   * Executed when speech play events are caught.
   */
  _onPlay() {}

  /**
   * @private
   *
   * Executed when speech pause events are caught.
   */
  _onPause() {}

  /**
   * @private
   *
   * Executed when speech resume events are caught.
   */
  _onResume() {}

  /**
   * @private
   *
   * Executed when speech stop events are caught.
   */
  _onStop() {}

  /**
   * @private
   *
   * Executed when speech sentence events are caught.
   */
  _onSentence() {}

  /**
   * @private
   *
   * Executed when speech word events are caught.
   */
  _onWord() {}

  /**
   * @private
   *
   * Executed when speech viseme events are caught.
   */
  _onViseme() {}

  /**
   * @private
   *
   * Executed when speech ssml events are caught.
   */
  _onSsml() {}

  static Mixin(BaseClass) {
    const ParentClass = FeatureDependentInterface.Mixin(BaseClass);
    const TextToSpeechFeatureDependentMixin = class extends ParentClass {
      _onPlay() {}

      _onPause() {}

      _onResume() {}

      _onStop() {}

      _onSentence() {}

      _onWord() {}

      _onViseme() {}

      _onSsml() {}
    };

    Object.defineProperties(TextToSpeechFeatureDependentMixin, {
      EVENT_DEPENDENCIES: {
        value: {
          ...ParentClass.EVENT_DEPENDENCIES,
          ...TextToSpeechFeatureDependentInterface.EVENT_DEPENDENCIES,
        },
        writable: false,
      },
    });

    return TextToSpeechFeatureDependentMixin;
  }
}

Object.defineProperties(TextToSpeechFeatureDependentInterface, {
  EVENT_DEPENDENCIES: {
    value: {
      TextToSpeechFeature: {
        play: '_onPlay',
        pause: '_onPause',
        resume: '_onResume',
        stop: '_onStop',
        sentence: '_onSentence',
        word: '_onWord',
        viseme: '_onViseme',
        ssml: '_onSsml',
      },
    },
    writable: false,
  },
});
