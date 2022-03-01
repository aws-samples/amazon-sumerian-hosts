// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {LexUtils} from '@amazon-sumerian-hosts/core';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('LexUtils', () => {
  describe('downsampleAudio', () => {
    it('should return undefined if input buffer is not defined or has length of 0', () => {
      const testBuffer = new Float32Array();
      let resultBuffer = LexUtils.downsampleAudio(undefined, 16000,16000);

      expect(resultBuffer).toBe(undefined);

      resultBuffer = LexUtils.downsampleAudio(testBuffer, 16000,16000);

      expect(resultBuffer).toBe(undefined);
    });

    it('should return the original buffer if the sample rate is the same as target rate', () => {
      const testBuffer = new Float32Array([1,2,3]);
      const resultBuffer = LexUtils.downsampleAudio(testBuffer, 16000,16000);

      expect(resultBuffer).toEqual(testBuffer);
    });

    it('should throw error if the sample rate is smaller than the target rate', () => {
      const testBuffer = new Float32Array([1,2,3]);

      expect(() =>{LexUtils.downsampleAudio(testBuffer, 16000,48000)}).toThrowError();
    });

    it('should correcty downsample buffer into target sample rate', () => {
      const testBuffer = new Float32Array([1,1,1,2,2,2,3,3,3]);
      const resultBuffer = LexUtils.downsampleAudio(testBuffer, 48000,16000);

      expect(resultBuffer).toEqual(new Float32Array([1,2,3]));
    });
  });

  describe('encodeWAV', () => {
    it('should return undefined if input buffer is not defined', () => {
      const result = LexUtils.encodeWAV(undefined, 16000);

      expect(result).toBe(undefined);
    });

    it('should correcty encode input buffer as WAV format', () => {
      const testBuffer = new Float32Array([1,1,1]);
      const resultView = LexUtils.encodeWAV(testBuffer,16000);

      const expectedResultArray = [
        'R'.charCodeAt(0),'I'.charCodeAt(0),'F'.charCodeAt(0),'F'.charCodeAt(0),
        (32 + testBuffer.length * 2) & 0x000000ff,
        (((32 + testBuffer.length * 2) & 0x0000ff00)) >> 8,
        (((32 + testBuffer.length * 2) & 0x00ff0000)) >> 16,
        (((32 + testBuffer.length * 2) & 0xff000000)) >> 24,
        'W'.charCodeAt(0),'A'.charCodeAt(0),'V'.charCodeAt(0),'E'.charCodeAt(0),
        'f'.charCodeAt(0),'m'.charCodeAt(0),'t'.charCodeAt(0),' '.charCodeAt(0),
        16, 0, 0, 0,
        1, 0, 1, 0,
        16000 & 0x000000ff, (16000 & 0x0000ff00) >> 8, (16000 & 0x00ff0000) >> 16, (16000 & 0xff000000) >> 24,
        32000 & 0x000000ff, (32000 & 0x0000ff00) >> 8, (32000 & 0x00ff0000) >> 16, (32000 & 0xff000000) >> 24,
        2, 0, 16, 0,
        'd'.charCodeAt(0),'a'.charCodeAt(0),'t'.charCodeAt(0),'a'.charCodeAt(0),
        (testBuffer.length * 2) & 0x000000ff,
        ((testBuffer.length * 2) & 0x0000ff00) >> 8,
        ((testBuffer.length * 2) & 0x00ff0000) >> 16,
        ((testBuffer.length * 2) & 0xff000000) >> 24,
        0xff, 0x7f, 0xff, 0x7f, 0xff, 0x7f              //representing [1,1,1]
      ];

      const expectedArrayBuffer = new Uint8Array(expectedResultArray);

      expect(resultView.buffer).toEqual(expectedArrayBuffer.buffer);
    });
  });
});
