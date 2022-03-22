// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import Utils from '../Utils';

/**
 * A collection of useful text-to-speech functions.
 *
 * @hideconstructor
 */
class TextToSpeechUtils {
  /**
   * Returns a new string with SSML marks inserted based on
   * matches between the input string and the input map. The
   * word matches are case-insensitive. Words within existing
   * SSML tags will not be affected. Input text will be surrounded
   * by <speak></speak> tags if needed.
   *
   * @param {string} text - Input string.
   * @param {object} map - Input object that maps mark keys
   * to arrays of words. Example:
   *
   *  {
   *    'mark:sad' : ['sad', 'blue', 'down'],
   *    'mark:happy' : ['joy', 'glad', 'great'],
   *    'mark:no' : ['no', 'nah', 'nay', 'sure']
   *  }
   * @param {Array.<string>} [randomMarks = []] - If there are sentences that don't
   * match any words from the map object, marks from this array will be randomly
   * chosen and inserted.
   *
   * @returns {string} - Updated input string.
   */
  static autoGenerateSSMLMarks(text, map, randomMarks = []) {
    if (typeof map !== 'object' || map === null) {
      throw new Error(
        `Cannot generate SSML marks for text "${text}" because map is not an object.`
      );
    }

    // process the input map into an internal format
    const internalMap = this._processInputMap(map);

    const speakTags = ['<speak>', '</speak>'];
    const ssmlMarkRegex = /<mark name=(?:"|')(.*?)(?:"|')\/>/;
    const ssmlTagRegex = /<[^>]*>/g;

    // Identify any existing SSML tags
    const existingTags = [];
    let result = ssmlTagRegex.exec(text);

    while (result !== null) {
      existingTags.push({
        start: result.index,
        end: result.index + result[0].length,
        text: result[0],
      });

      result = ssmlTagRegex.exec(text);
    }

    const chunks = [];
    let index = 0;
    let ssmlMarkResult;
    let duplicateMarkToCheck = [];
    existingTags.forEach(existingTag => {
      const substr = text.slice(index, existingTag.start);

      if (substr !== '') {
        // auto-mark non-tag text
        chunks.push(
          this._insertMarks(substr, internalMap, duplicateMarkToCheck)
        );

        duplicateMarkToCheck = [];
      }

      ssmlMarkResult = ssmlMarkRegex.exec(existingTag.text);

      if (ssmlMarkResult !== null) {
        const markText = ssmlMarkResult[1];
        duplicateMarkToCheck.push(markText);
      } else if (!speakTags.includes(existingTag.text)) {
        chunks.push(existingTag.text);
      }

      // advance the index
      index = existingTag.end;
    });

    chunks.push(
      this._insertMarks(text.slice(index), internalMap, duplicateMarkToCheck)
    );

    let markedText = chunks.join('');

    if (randomMarks && randomMarks.length > 0) {
      // add random marks to any unmarked sentences
      markedText = this.addMarksToUnmarkedSentences(markedText, randomMarks);
    }

    return TextToSpeechUtils.validateText(markedText);
  }

  /**
   * Returns a new string with a random SSML mark inserted at each sentence that
   * does not already contain an SSML mark.
   *
   * @param {string} text - Input string.
   * @param {Array.<string>} marks - Any array of random SSML marks to choose from
   * when modifying the text.
   *
   * @returns {string}
   */
  static addMarksToUnmarkedSentences(text, marks) {
    if (!marks || marks.length === 0) return text;

    const ssmlMarkRegex = /<mark name=(?:"|')(.*?)(?:"|')\/>/g;
    const ssmlTagRegex = /<[^>]*>/g;

    // Find the indices of any marks in the text
    const markIndices = [];
    let markResult = ssmlMarkRegex.exec(text);

    while (markResult !== null) {
      markIndices.push(markResult.index);
      markResult = ssmlMarkRegex.exec(text);
    }

    // Find all SSML tags in the text
    const existingTags = [];
    let ssmlResult = ssmlTagRegex.exec(text);
    while (ssmlResult !== null) {
      existingTags.push({
        start: ssmlResult.index,
        end: ssmlResult.index + ssmlResult[0].length,
        text: ssmlResult[0],
      });
      ssmlResult = ssmlTagRegex.exec(text);
    }

    // Create a copy of the text with all SSML marks replaces with whitespace
    let cleanedText = text.slice();
    existingTags.forEach(existingSsml => {
      const whitespace = new Array(existingSsml.text.length + 1).join(' ');
      cleanedText = [
        cleanedText.slice(0, existingSsml.start),
        whitespace,
        cleanedText.slice(existingSsml.end),
      ].join('');
    });

    const sentenceEndIndices = this._getSentenceEnds(cleanedText);

    // Only insert random marks into sentences that don't already have any
    let prevIndex = 0;
    const targetIndices = sentenceEndIndices.filter(index => {
      const containsMark =
        markIndices.findIndex(markIndex => {
          return prevIndex <= markIndex && index > markIndex;
        }) !== -1;
      prevIndex = index;
      return !containsMark;
    });

    const randomMarkedText = this._insertRandomMarksAt(
      text,
      targetIndices,
      marks
    );

    return randomMarkedText;
  }

  /**
   * Generate a version of given text that is enclosed by Polly ssml speak tags.
   *
   * @param {string} text - The text to validate.
   *
   * @returns {string} - Updated input string.
   */
  static validateText(text) {
    if (!text) {
      text = '<speak></speak>';
    } else {
      text = text
        .replace(/(^\s*<\s*speak\s*)>\s*|(^\s*)/, '<speak>')
        .replace(/(\s*<\s*\/\s*speak\s*>\s*$|\s*$)/, '</speak>');
    }

    return text;
  }

  /**
   * Parse an input string and insert SSML marks based on
   * word matches in a map.
   *
   * @private
   *
   * @param {string} text - Input string.
   * @param {Array.<number>} [indices = []] - An array of indices in the text input
   * where random marks should be inserted.
   * @param {Array.<string>} [marks = []] - An array of mark strings to choose
   * from when inserting random marks.
   *
   * @returns {string} - Updated input string.
   */
  static _insertRandomMarksAt(text, indices = [], marks = []) {
    if (!marks || marks.length === 0 || !indices || indices.length === 0) {
      return text;
    }

    let offset = 0;
    indices.forEach(index => {
      const randomMark = `<mark name='${
        marks[Utils.getRandomInt(0, marks.length)]
      }'/>`;
      text = [
        text.slice(0, index + offset),
        randomMark,
        text.slice(index + offset),
      ].join('');
      offset += randomMark.length;
    });

    return text;
  }

  /**
   * Parses a string of text and returns an array containing the indices
   * of the last character in a sentence that is not in the following list:
   *  ('.', '?', '!')
   *
   * @private
   *
   * @param {string} text - Text to process for end of sentence
   * indices.
   *
   * @returns {Array.<number>} - Array of end of sentence indices.
   */
  static _getSentenceEnds(text) {
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const endSentenceRegex = /[.!?]+/;

    let result = sentenceRegex.exec(text);
    const sentenceEnds = [];
    while (result !== null) {
      // find the last non-punctuation character
      const punctResult = endSentenceRegex.exec(result[0]);
      sentenceEnds.push(
        result.index + result[0].length - punctResult[0].length
      );
      result = sentenceRegex.exec(text);
    }

    return sentenceEnds;
  }

  /**
   * Parse an input string and insert SSML marks based on
   * word matches in a map.
   *
   * @private
   *
   * @param {string} text - Input string.
   * @param {Map} map - Mapping of words to mark values that
   * will be inserted as the value for a mark's 'name' attribute.
   * @param {Array} duplicatesToCheck - A list of mark values to check for duplicate against the first word
   *
   * @returns {string} - Updated input string.
   */
  static _insertMarks(text, map, duplicatesToCheck) {
    if (text === '') return text;

    const wordRegex = /\w+|\s+|[^\s\w]+/g;

    let lowerCaseWord;
    let checkDuplicate = true;
    const markedWords = text.match(wordRegex).map(word => {
      lowerCaseWord = word.toLowerCase();

      if (map.has(lowerCaseWord)) {
        const marks = map.get(lowerCaseWord).map(mark => {
          if (checkDuplicate) {
            checkDuplicate = false;
            return duplicatesToCheck.includes(mark)
              ? ''
              : `<mark name='${mark}'/>`;
          } else {
            return `<mark name='${mark}'/>`;
          }
        });
        return `${marks.join('')}${word}`;
      } else {
        checkDuplicate = false;
        return word;
      }
    });

    const existingMarks = duplicatesToCheck.map(mark => {
      return `<mark name='${mark}'/>`;
    });

    return `${existingMarks.join('')}${markedWords.join('')}`;
  }

  /**
   * Processes an input object for mapping an array
   * of words to specific mark keys. Converts the input
   * map into a Map with a more efficient format for
   * performing mark injection.
   *
   * @private
   *
   * @param {object} map - Input object that maps mark keys
   * to arrays of words.
   *
   * @returns {Map} - Map for internal use.
   */
  static _processInputMap(map) {
    const internalMap = new Map();

    let list = [];
    Object.entries(map).forEach(([key, value]) => {
      if (!Array.isArray(value)) {
        throw new Error(
          `Cannot generate SSML marks from map "${map}" because value for key '${key}' is not an array.`
        );
      }

      value.forEach(word => {
        const lowerCaseWord = word.toLowerCase();
        list = internalMap.get(lowerCaseWord);

        if (list !== undefined && !list.includes(key)) {
          internalMap.set(lowerCaseWord, [...list, key]);
        } else {
          internalMap.set(lowerCaseWord, [key]);
        }
      });
    });

    return internalMap;
  }
}

export default TextToSpeechUtils;
