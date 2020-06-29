// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

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
   *
   * @returns {string} - Updated input string.
   */
  static autoGenerateSSMLMarks(text, map) {
    if(typeof map !== 'object' || map === null) {
      throw new Error(
        `Cannot generate SSML marks for text "${ text }" becuase map is not an object.`
      );
    }

    // process the input map into an internal format
    const internalMap = TextToSpeechUtils._processInputMap(map);

    const speakTags = ['<speak>', '</speak>'];
    const ssmlMarkRegex = /<mark name=(?:"|')(.*)(?:"|')\/>/
    const ssmlTagRegex = /<[^>]*>/g;

    // Identify any existing SSML tags
    const existingTags = [];
    let result;
    while(result = ssmlTagRegex.exec(text)) {
      existingTags.push({
        start: result.index,
        end: result.index + result[0].length,
        text: result[0]
      });
    }

    const chunks = [];
    let index = 0;
    let ssmlMarkResult;
    let duplicateMarkToCheck = [];
    existingTags.forEach(existingTag => {
      const substr = text.slice(index, existingTag.start);

      if (substr !== '') {
        // auto-mark non-tag text
        chunks.push(TextToSpeechUtils._insertMarks(
          substr,
          internalMap,
          duplicateMarkToCheck
        ));

        duplicateMarkToCheck = [];
      }

      if (ssmlMarkResult = ssmlMarkRegex.exec(existingTag.text)) {
        const markText = ssmlMarkResult[1];
        duplicateMarkToCheck.push(markText);
      } else if (!speakTags.includes(existingTag.text)) {
        chunks.push(existingTag.text);
      }

      // advance the index
      index = existingTag.end;
    });

    chunks.push(TextToSpeechUtils._insertMarks(
      text.slice(index),
      internalMap,
      duplicateMarkToCheck
    ));

    return TextToSpeechUtils.validateText([...chunks].join(''));
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
   * @param {Map} map - Mapping of words to mark values that
   * will be inserted as the value for a mark's 'name' attribute.
   * @param {Array} duplicatesToCheck - A list of mark values to check for duplicate against the first word
   *
   * @returns {string} - Updated input string.
   */
  static _insertMarks(text, map, duplicatesToCheck) {
    if(text === '') return text;

    const wordRegex = /\w+|\s+|[^\s\w]+/g;

    let lowerCaseWord;
    let checkDuplicate = true;
    const markedWords = text.match(wordRegex).map(word => {
      lowerCaseWord = word.toLowerCase();

      if (map.has(lowerCaseWord)) {
        const marks = map.get(lowerCaseWord).map(mark => {
          if (checkDuplicate) {
            checkDuplicate = false;
            return duplicatesToCheck.includes(mark) ? '' : `<mark name='${ mark }'/>`;
          } else {
            return `<mark name='${ mark }'/>`;
          }
        });
        return `${ marks.join('') }${ word }`;
      } else {
        checkDuplicate = false;
        return word;
      }
    });

    const existingMarks = duplicatesToCheck.map(mark => {
      return `<mark name='${ mark }'/>`;
    })

    return `${ existingMarks.join('') }${ markedWords.join('') }`;
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
      if(!Array.isArray(value)) {
        throw new Error(
          `Cannot generate SSML marks from map "${ map }" because value for key '${ key }' is not an array.`
        );
      }

      value.forEach(word => {
        const lowerCaseWord = word.toLowerCase();
        list = internalMap.get(lowerCaseWord);

        if(list !== undefined && !list.includes(key)) {
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