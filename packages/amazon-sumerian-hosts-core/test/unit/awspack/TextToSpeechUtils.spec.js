// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-sequences */
/* eslint-disable no-constant-condition */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import { TextToSpeechUtils } from '@amazon-sumerian-hosts/core';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('TextToSpeechUtils', () => {
  const regexNoMark = /mark:no/g;
  const regexTheMark = /mark:the/g;
  const regexTextMark = /mark:text/g;

  describe('autoGenerateSSMLMarks', () => {
    it('should throw an error if the input map is not an object', () => {
      expect(() => {
        TextToSpeechUtils.autoGenerateSSMLMarks(
          'No one reads the sample text.',
          null
        );
      }).toThrowError();

      expect(() => {
        TextToSpeechUtils.autoGenerateSSMLMarks(
          'No one reads the sample text.',
          undefined
        );
      }).toThrowError();

      expect(() => {
        TextToSpeechUtils.autoGenerateSSMLMarks(
          'No one reads the sample text.',
          52
        );
      }).toThrowError();

      expect(() => {
        TextToSpeechUtils.autoGenerateSSMLMarks(
          'No one reads the sample text.',
          'not an object'
        );
      }).toThrowError();
    });

    it('should insert matching marks into text that starts with an SSML tag', () => {
      const originalText = '<mark name="test"/>No one reads the sample text.';
      const presentMarks = [regexNoMark, regexTextMark, regexTheMark];

      const map = {
        'mark:no': ['no'],
        'mark:text': ['text'],
        'mark:the': ['the'],
      };

      const markedText = TextToSpeechUtils.autoGenerateSSMLMarks(
        originalText,
        map
      );

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should insert matching marks into text that ends with an SSML tag', () => {
      const originalText = 'No one reads the sample text.<mark name="test"/>';

      const presentMarks = [regexNoMark, regexTextMark, regexTheMark];

      const map = {
        'mark:no': ['no'],
        'mark:text': ['text'],
        'mark:the': ['the'],
      };

      const markedText = TextToSpeechUtils.autoGenerateSSMLMarks(
        originalText,
        map
      );

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should insert matching marks into text within an SSML tag', () => {
      const originalText = '<prosody>No one reads the sample text.</prosody>';

      const presentMarks = [regexNoMark, regexTextMark, regexTheMark];

      const map = {
        'mark:no': ['no'],
        'mark:text': ['text'],
        'mark:the': ['the'],
      };

      const markedText = TextToSpeechUtils.autoGenerateSSMLMarks(
        originalText,
        map
      );

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should not modify existing SSML tags', () => {
      const originalText = `<speak><mark name='you'/>test</speak>`;
      const map = {
        'mark:you': ['you'],
      };

      const markedText = TextToSpeechUtils.autoGenerateSSMLMarks(
        originalText,
        map
      );

      expect(markedText).toEqual(originalText);
    });

    it('should not insert duplicate marks', () => {
      const originalText = 'No one reads the sample text.';
      const presentMarks = [regexNoMark, regexTextMark, regexTheMark];

      const map = {
        'mark:no': ['no'],
        'mark:text': ['text'],
        'mark:the': ['the'],
      };

      let markedText = TextToSpeechUtils.autoGenerateSSMLMarks(
        originalText,
        map
      );
      markedText = TextToSpeechUtils.autoGenerateSSMLMarks(markedText, map);

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should execute addMarksToUnmarkedSentences if there are random marks defined', () => {
      const onAddRandomMarks = spyOn(
        TextToSpeechUtils,
        'addMarksToUnmarkedSentences'
      );
      const map = {
        'mark:no': ['no'],
        'mark:text': ['text'],
        'mark:the': ['the'],
      };
      const random = ['mark:random1', 'mark:random2'];
      const text = 'No one reads the sample text';
      TextToSpeechUtils.autoGenerateSSMLMarks(text, map);

      expect(onAddRandomMarks).not.toHaveBeenCalled();

      TextToSpeechUtils.autoGenerateSSMLMarks(text, map, []);

      expect(onAddRandomMarks).not.toHaveBeenCalled();

      TextToSpeechUtils.autoGenerateSSMLMarks(text, map, random);

      expect(onAddRandomMarks).toHaveBeenCalledTimes(1);
    });
  });

  describe('addMarksToUnmarkedSentences', () => {
    it('should return the original input text if no marks are provided', () => {
      const text = 'Some unmarked text that needs marks';

      expect(TextToSpeechUtils.addMarksToUnmarkedSentences(text)).toEqual(text);

      expect(TextToSpeechUtils.addMarksToUnmarkedSentences(text, [])).toEqual(
        text
      );
    });

    it('should return the original input text if all sentences contain marks', () => {
      const text =
        '<mark name="mark1"/> This sentence has a mark. So does <mark name="mark2"/> this one';

      expect(
        TextToSpeechUtils.addMarksToUnmarkedSentences(text, [
          'random1',
          'random2',
          'random3',
        ])
      ).toEqual(text);
    });

    it('should add marks to each sentence not containing marks', () => {
      const ssmlMarkRegex = /<mark name=(?:"|')(.*?)(?:"|')\/>/g;

      [
        ['This is a sentence.', 1],
        ['This is a sentence. This is another! Still more?', 3],
        [`<mark name='test'/>This contains a mark. But, this doesn't!!!`, 2],
      ].forEach(set => {
        const result = TextToSpeechUtils.addMarksToUnmarkedSentences(set[0], [
          'test',
        ]);

        expect((result.match(ssmlMarkRegex) || []).length).toEqual(set[1]);
      });
    });
  });

  describe('validateText', () => {
    it('should enclose the input string in <speak></speak> tags if it is not already', () => {
      expect('<speak>some text</speak>').toEqual(
        TextToSpeechUtils.validateText('some text')
      );

      expect('<speak></speak>').toEqual(TextToSpeechUtils.validateText(''));
    });

    it('should not add duplivate <speak></speak> tags if they are aready present', () => {
      expect('<speak>some text</speak>').toEqual(
        TextToSpeechUtils.validateText('<speak>some text</speak>')
      );
    });

    it('should remove extra spaces between speak tags and the enclosed text', () => {
      const expected = '<speak>some text with weird spacing</speak>';
      const actual = TextToSpeechUtils.validateText(
        '<speak>  some text with weird spacing   \n  </speak>'
      );

      expect(expected).toEqual(actual);
    });
  });

  describe('_insertMarks', () => {
    it('should insert matching marks into plain text', () => {
      const originalText = 'No one reads the sample text.';
      const presentMarks = [regexNoMark, regexTextMark, regexTheMark];

      const map = TextToSpeechUtils._processInputMap({
        'mark:no': ['no'],
        'mark:text': ['text'],
        'mark:the': ['the'],
      });

      const markedText = TextToSpeechUtils._insertMarks(originalText, map, []);

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should insert multiple matching marks when map values share words', () => {
      const originalText = 'No one reads the sample text.';

      const presentMarks = [regexNoMark, regexTextMark];

      const map = TextToSpeechUtils._processInputMap({
        'mark:no': ['text'],
        'mark:text': ['text'],
      });

      const markedText = TextToSpeechUtils._insertMarks(originalText, map, []);

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should insert marks for each of the matching words in the input map value', () => {
      const originalText = 'No one reads the sample text.';

      const map = TextToSpeechUtils._processInputMap({
        'mark:no': ['text', 'reads', 'the'],
      });

      const markedText = TextToSpeechUtils._insertMarks(originalText, map, []);

      expect(markedText.match(regexNoMark).length).toEqual(3);
    });

    it('should append any duplicate to the beginning', () => {
      const originalText = `No one reads the sample text.`;

      const markedText = TextToSpeechUtils._insertMarks(
        originalText,
        new Map(),
        ['mark:no']
      );

      expect(markedText.match(regexNoMark).length).toEqual(1);
    });
  });

  describe('_processInputMap', () => {
    it('should throw an error when an input map value is not an array', () => {
      const map = {
        'mark:no': 'test',
      };

      expect(() => {
        TextToSpeechUtils._processInputMap(map);
      }).toThrowError();
    });

    it('should return a Map', () => {
      expect(TextToSpeechUtils._processInputMap({})).toBeInstanceOf(Map);
    });

    it('should produce a map key for each word in the value array in the input object', () => {
      const map = {
        'mark:no': ['no', 'this', 'test'],
      };

      const internalMap = TextToSpeechUtils._processInputMap(map);

      expect(Array.from(internalMap.keys())).toEqual(['no', 'this', 'test']);
    });

    it('should produce a map value for each key that contains a word value in the input object', () => {
      const map = {
        'mark:no': ['no'],
        'mark:yes': ['no'],
      };

      const internalMap = TextToSpeechUtils._processInputMap(map);

      expect(internalMap.get('no')).toEqual(['mark:no', 'mark:yes']);
    });

    it('should not produce duplicate map values for duplicate words for the same input key', () => {
      const map = {
        'mark:no': ['no', 'no', 'no'],
      };

      const internalMap = TextToSpeechUtils._processInputMap(map);

      expect(internalMap.get('no')).toEqual(['mark:no']);
    });

    it('should change all input word values to lowercase', () => {
      const map = {
        'mark:no': ['NO', 'ThIs', 'tesT'],
      };

      const internalMap = TextToSpeechUtils._processInputMap(map);

      expect(Array.from(internalMap.keys())).toEqual(['no', 'this', 'test']);
    });
  });

  describe('_insertRandomMarksAt', () => {
    it('should return the same string if the indices array is null or zero length', () => {
      const text = 'This is some text.';

      expect(
        TextToSpeechUtils._insertRandomMarksAt(text, null, ['mark:test'])
      ).toEqual(text);

      expect(
        TextToSpeechUtils._insertRandomMarksAt(text, [], ['mark:test'])
      ).toEqual(text);
    });

    it('should return the same string if the marks array is null or zero length', () => {
      const text = 'This is some text.';

      expect(
        TextToSpeechUtils._insertRandomMarksAt(text, [1, 2], null)
      ).toEqual(text);

      expect(TextToSpeechUtils._insertRandomMarksAt(text, [1, 2], [])).toEqual(
        text
      );
    });

    it('should insert marks at the specified indices without losing any of the original text', () => {
      const text = 'This is some text';

      const result = TextToSpeechUtils._insertRandomMarksAt(
        text,
        [0, 4],
        ['mark:test']
      );

      expect(result.split(`<mark name='mark:test'/>`).join('')).toEqual(text);
    });

    it('should insert marks at the specified indices without losing any of the original text', () => {
      const text = 'This is some text.';

      const result = TextToSpeechUtils._insertRandomMarksAt(
        text,
        [0, 4],
        ['mark:test']
      );

      expect(result.indexOf(`<mark name='mark:test'/>`)).toEqual(0);
      expect(result.indexOf(`<mark name='mark:test'/>`, 1)).toEqual(
        4 + `<mark name='mark:test'/>`.length
      );
    });
  });

  describe('_getSentenceEnds', () => {
    it('should return an array', () => {
      expect(TextToSpeechUtils._getSentenceEnds('')).toBeInstanceOf(Array);
    });

    it('should return an array of indices corresponding to the last non-(.!?) characters before a each sequence of (.!?) characters in a string', () => {
      [
        ['', []],
        ['This is a test.', [14]],
        ['This... Is a? Test!!', [4, 12, 18]],
      ].forEach(set => {
        expect(TextToSpeechUtils._getSentenceEnds(set[0])).toEqual(set[1]);
      });
    });
  });
});
