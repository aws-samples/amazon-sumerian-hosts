// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-sequences */
/* eslint-disable no-constant-condition */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import {AbstractHostFeature, HostObject} from '@amazon-sumerian-hosts/core';
import SSMLSpeechmarkInterface from '../../../src/core/awspack/SSMLSpeechmarkInterface';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('SSMLSpeechmarkInterface', () => {
  let ssmlMarkFeature;
  let host;

  beforeEach(() => {
    host = new HostObject();
    const HostFeature = AbstractHostFeature.mix(SSMLSpeechmarkInterface.Mixin);
    host.addFeature(HostFeature);
    ssmlMarkFeature = host._features.SSMLSpeechMarkMixin;
    ssmlMarkFeature.callback = jasmine.createSpy();
  });

  describe('_onSsml', () => {
    it('should call the callback function if all the criteria meet', () => {
      const speechMark = {
        type: 'ssml',
        value:
          '{"feature":"SSMLSpeechMarkMixin","method":"callback","args":["name", 1]}',
      };
      ssmlMarkFeature._onSsml({mark: speechMark});

      expect(ssmlMarkFeature.callback).toHaveBeenCalledWith('name', 1);
    });

    it('should not call the callback function if feature doesnt exist', () => {
      const speechMark = {
        type: 'ssml',
        value:
          '{"feature":"AnimationFeature","method":"callback","args":["name", 1]}',
      };
      ssmlMarkFeature._onSsml({mark: speechMark});

      expect(ssmlMarkFeature.callback).not.toHaveBeenCalled();
    });

    it('should not call the callback function if function doesnt exist in feature', () => {
      spyOn(console, 'warn');
      const speechMark = {
        type: 'ssml',
        value:
          '{"feature":"SSMLSpeechMarkMixin","method":"notExist","args":["name", 1]}',
      };
      ssmlMarkFeature._onSsml({mark: speechMark});

      expect(ssmlMarkFeature.callback).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
