/* eslint-disable no-underscore-dangle */
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * A collection of useful lex related functions.
 *
 * @hideconstructor
 */
class LexUtils {
  /**
   * Downsamples the audio to a target sample rate.
   *
   * Inspired by the following blog post from the Lex team:
   * https://aws.amazon.com/blogs/machine-learning/capturing-voice-input-in-a-browser/
   *
   * @param {Float32Array} buffer - Input audio buffer
   * @param {float} sourceSampleRate - Sample rate of the input audio buffer
   * @param {float} targetSampleRate - Sample rate to try to convert to
   *
   * @return {Float32Array} Downsampled audio buffer
   */
  static downsampleAudio(buffer, sourceSampleRate, targetSampleRate) {
    if (!buffer || !buffer.length) {
      return;
    }

    if (sourceSampleRate === targetSampleRate) {
      return buffer;
    }

    if (sourceSampleRate < targetSampleRate) {
      throw Error(
        `Input Sample rate ${sourceSampleRate} is less than target sample rate ${targetSampleRate}.`
      );
    }

    const bufferLength = buffer.length;
    const sampleRateRatio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(bufferLength / sampleRateRatio);

    const downsampledBuffer = new Float32Array(newLength);

    let position = 0;
    let bufferOffset = 0;
    while (position < newLength) {
      const nextBufferOffset = Math.round((position + 1) * sampleRateRatio);

      let accumulator = 0;
      let count = 0;
      for (
        let i = bufferOffset;
        i < nextBufferOffset && i < bufferLength;
        i++
      ) {
        accumulator += buffer[i];
        count++;
      }

      downsampledBuffer[position] = accumulator / count;
      position++;
      bufferOffset = nextBufferOffset;
    }

    return downsampledBuffer;
  }

  /**
   * Converts audio data to WAV.
   *
   * Inspired by the following blog post from the Lex team:
   * https://aws.amazon.com/blogs/machine-learning/capturing-voice-input-in-a-browser/
   *
   * @param {Float32Array} buffer - Input audio buffer
   * @param {float} targetSampleRate - Sample rate for the output audio
   *
   * @return {DataView} Converted audio data
   */
  static encodeWAV(buffer, targetSampleRate) {
    function _writeString(view, offset, string) {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }
    function _floatTo16BitPCM(view, offset, input) {
      for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      }
    }

    if (!buffer) {
      return;
    }

    //Insert WAV format related info at the beginning of the buffer up to offset 44
    const encodedBuffer = new ArrayBuffer(44 + buffer.length * 2);
    const view = new DataView(encodedBuffer);

    _writeString(view, 0, 'RIFF');
    view.setUint32(4, 32 + buffer.length * 2, true);
    _writeString(view, 8, 'WAVE');
    _writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, targetSampleRate, true);
    view.setUint32(28, targetSampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    _writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * 2, true);
    _floatTo16BitPCM(view, 44, buffer);

    return view;
  }
}

export default LexUtils;
