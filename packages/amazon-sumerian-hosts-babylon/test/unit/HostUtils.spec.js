// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import HostUtils from "app/HostUtils"

describe('HostUtils', () => {

  it('has a createHost() function', () => {
    expect(HostUtils.createHost).toBeDefined();
  });

  describe('object returned from getCharacterConfig()', () => {
    const config = HostUtils.getCharacterConfig('assets', 'Grace');
    const animAssetsBase = 'assets/animations/adult_female/';

    it('has correct modelUrl property', () => {
      expect(config.modelUrl).toEqual('assets/characters/adult_female/grace/grace.gltf');
    });

    it('has correct gestureConfigUrl property', () => {
      expect(config.gestureConfigUrl).toEqual(`${animAssetsBase}gesture.json`);
    });

    it('has correct pointOfInterestConfigUrl property', () => {
      expect(config.pointOfInterestConfigUrl).toEqual(`${animAssetsBase}poi.json`);
    });

    it('has correct animStandIdleUrl property', () => {
      expect(config.animStandIdleUrl).toEqual(`${animAssetsBase}stand_idle.glb`);
    });

    it('has correct animLipSyncUrl property', () => {
      expect(config.animLipSyncUrl).toEqual(`${animAssetsBase}lipsync.glb`);
    });

    it('has correct animGestureUrl property', () => {
      expect(config.animGestureUrl).toEqual(`${animAssetsBase}gesture.glb`);
    });

    it('has correct animEmoteUrl property', () => {
      expect(config.animEmoteUrl).toEqual(`${animAssetsBase}emote.glb`);
    });

    it('has correct animFaceIdleUrl property', () => {
      expect(config.animFaceIdleUrl).toEqual(`${animAssetsBase}face_idle.glb`);
    });

    it('has correct animBlinkUrl property', () => {
      expect(config.animBlinkUrl).toEqual(`${animAssetsBase}blink.glb`);
    });

    it('has correct animPointOfInterestUrl property', () => {
      expect(config.animPointOfInterestUrl).toEqual(`${animAssetsBase}poi.glb`);
    });
  });

  it('when called with an invalid character ID it should throw an error', () => {
    expect(() => {
      HostUtils.getCharacterConfig('assets', 'Batman');
    }).toThrowError(Error, '"Batman" is not a supported character ID.');
  });
});