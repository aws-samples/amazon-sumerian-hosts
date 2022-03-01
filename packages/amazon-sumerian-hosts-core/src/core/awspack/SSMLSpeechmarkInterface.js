/* eslint-disable no-unused-vars */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/* eslint-disable max-classes-per-file */
/* eslint-disable no-empty */
import TextToSpeechFeatureDependentInterface from './TextToSpeechFeatureDependentInterface';

/**
 * Class factory interface for that registers callback method when a ssml speechmark event is emitted.
 *
 * @interface
 * @extends TextToSpeechFeatureDependentInterface
 */
class SSMLSpeechmarkInterface extends TextToSpeechFeatureDependentInterface {
  /**
   * When ssml events are caught, this will try to parse the speech mark value and execute any function which meets criteria defined in the value.
   * Speech mark value will be treated as stringified json format containing required feature name, function name and argument array to pass in.
   * Example speech mark value might look like: '{"feature":"GestureFeature", "method":"switchToGesture", "args":["genricA", 0.5]}'
   *
   * @private
   *
   * @param {Object} event - Event data passed from the speech.
   * @param {Object} event.mark - Speechmark object.
   */
  _onSsml({mark}) {}

  /**
   * Creates a class that implements {@link SSMLSpeechmarkInterface}
   * and extends a specified base class.
   *
   * @param {Class} BaseClass - The class to extend.
   *
   * @return {Class} A class that extends `BaseClass` and implements {@link SSMLSpeechmarkInterface}.
   */
  static Mixin(BaseClass) {
    const ParentClass = TextToSpeechFeatureDependentInterface.Mixin(BaseClass);
    const SSMLSpeechMarkMixin = class extends ParentClass {
      _onSsml({mark}) {
        try {
          const {feature, method, args} = JSON.parse(mark.value);
          if (this.constructor.name === feature) {
            const callback = this[method];
            if (callback && typeof callback === 'function') {
              callback.apply(this, args);
            } else {
              console.warn(
                `Function ${method} does not exist within feature ${feature}`
              );
            }
          }
        } catch (e) {}
      }
    };

    return SSMLSpeechMarkMixin;
  }
}

export default SSMLSpeechmarkInterface;
