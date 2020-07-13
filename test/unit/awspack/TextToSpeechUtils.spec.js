// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-sequences */
/* eslint-disable no-constant-condition */
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable no-underscore-dangle */
import TextToSpeechUtils from 'core/awspack/TextToSpeechUtils';
import describeEnvironment from '../EnvironmentHarness';

describeEnvironment('TextToSpeechUtils', () => {
  const regexNoMark = /mark:no/g;
  const regexTheMark = /mark:the/g;
  const regexTextMark = /mark:text/g;

  describe('AutoGenerateSSMLMarks', () => {
    it('should throw an error if the input map is not an object', () => {
      expect(() => {
        TextToSpeechUtils.autoGenerateSSMLMarks('No one reads the sample text.', null);
      }).toThrowError();

      expect(() => {
        TextToSpeechUtils.autoGenerateSSMLMarks('No one reads the sample text.', undefined);
      }).toThrowError();

      expect(() => {
        TextToSpeechUtils.autoGenerateSSMLMarks('No one reads the sample text.', 52);
      }).toThrowError();

      expect(() => {
        TextToSpeechUtils.autoGenerateSSMLMarks('No one reads the sample text.', 'not an object');
      }).toThrowError();
    });

    it('should insert matching marks into text that starts with an SSML tag', () => {
      const originalText = '<mark name="test"/>No one reads the sample text.';
      const presentMarks = [
        regexNoMark,
        regexTextMark,
        regexTheMark
      ];

      const map = {
        'mark:no' : ['no'],
        'mark:text' : ['text'],
        'mark:the' : ['the']
      };

      const markedText = TextToSpeechUtils.autoGenerateSSMLMarks(originalText, map);

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should insert matching marks into text that ends with an SSML tag', () => {
      const originalText = 'No one reads the sample text.<mark name="test"/>';

      const presentMarks = [
        regexNoMark,
        regexTextMark,
        regexTheMark
      ];

      const map = {
        'mark:no' : ['no'],
        'mark:text' : ['text'],
        'mark:the' : ['the']
      };

      const markedText = TextToSpeechUtils.autoGenerateSSMLMarks(originalText, map);

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should insert matching marks into text within an SSML tag', () => {
      const originalText = '<prosody>No one reads the sample text.</prosody>';

      const presentMarks = [
        regexNoMark,
        regexTextMark,
        regexTheMark
      ];

      const map = {
        'mark:no' : ['no'],
        'mark:text' : ['text'],
        'mark:the' : ['the']
      };

      const markedText = TextToSpeechUtils.autoGenerateSSMLMarks(originalText, map);

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });

    it('should not modify existing SSML tags', () => {
      const originalText = `<speak><mark name='you'/>test</speak>`;
      const map = {
        'mark:you' : ['you']
      };

      const markedText = TextToSpeechUtils.autoGenerateSSMLMarks(originalText, map);

      expect(markedText).toEqual(originalText);
    });

    it('should not insert duplicate marks', () => {
      const originalText = 'No one reads the sample text.';
      const presentMarks = [
        regexNoMark,
        regexTextMark,
        regexTheMark
      ];

      const map = {
        'mark:no' : ['no'],
        'mark:text' : ['text'],
        'mark:the' : ['the']
      };

      let markedText = TextToSpeechUtils.autoGenerateSSMLMarks(originalText, map);
      markedText = TextToSpeechUtils.autoGenerateSSMLMarks(markedText, map);

      presentMarks.forEach(regex => {
        expect(markedText.match(regex).length).toEqual(1);
      });
    });
  });

  describe('validateText', () => {
    it('should enclose the input string in <speak></speak> tags if it is not already', () => {
      expect('<speak>some text</speak>').toEqual(
        TextToSpeechUtils.validateText('some text')
      );

      expect('<speak></speak>').toEqual(
        TextToSpeechUtils.validateText('')
      );
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

    describe('_insertMarks', () => {
      it('should insert matching marks into plain text', () => {
        const originalText = 'No one reads the sample text.'
        const presentMarks = [
          regexNoMark,
          regexTextMark,
          regexTheMark
        ];

        const map = TextToSpeechUtils._processInputMap({
          'mark:no' : ['no'],
          'mark:text' : ['text'],
          'mark:the' : ['the']
        });

        const markedText = TextToSpeechUtils._insertMarks(originalText, map, []);

        presentMarks.forEach(regex => {
          expect(markedText.match(regex).length).toEqual(1);
        });
      });

      it('should insert multiple matching marks when map values share words', () => {
        const originalText = 'No one reads the sample text.';

        const presentMarks = [
          regexNoMark,
          regexTextMark
        ];

        const map = TextToSpeechUtils._processInputMap({
          'mark:no' : ['text'],
          'mark:text' : ['text'],
        });

        const markedText = TextToSpeechUtils._insertMarks(originalText, map, []);

        presentMarks.forEach(regex => {
          expect(markedText.match(regex).length).toEqual(1);
        });
      });

      it('should insert marks for each of the matching words in the input map value', () => {
        const originalText = 'No one reads the sample text.';

        const map = TextToSpeechUtils._processInputMap({
          'mark:no' : ['text', 'reads', 'the']
        });

        const markedText = TextToSpeechUtils._insertMarks(originalText, map, []);

        expect(markedText.match(regexNoMark).length).toEqual(3);
      });

      it('should append any duplicate to the beginning', () => {
        const originalText = `No one reads the sample text.`;

        const markedText = TextToSpeechUtils._insertMarks(originalText, new Map(), ['mark:no']);

        expect(markedText.match(regexNoMark).length).toEqual(1);
      });
    });

    describe('_processInputMap', () => {
      it('should throw an error when an input map value is not an array', () => {
        const map = {
          'mark:no' : 'test'
        };

        expect(() => {
          TextToSpeechUtils._processInputMap(map)
        }).toThrowError();
      });

      it('should return a Map', () => {
        expect(
          TextToSpeechUtils._processInputMap({})
        ).toBeInstanceOf(Map);
      });

      it('should produce a map key for each word in the value array in the input object', () => {
        const map = {
          'mark:no' : ['no', 'this', 'test']
        };

        const internalMap = TextToSpeechUtils._processInputMap(map);

        expect(Array.from(internalMap.keys())).toEqual(['no', 'this', 'test'])
      });

      it('should produce a map value for each key that contains a word value in the input object', () => {
        const map = {
          'mark:no' : ['no'],
          'mark:yes' : ['no']
        };

        const internalMap = TextToSpeechUtils._processInputMap(map);

        expect(internalMap.get('no')).toEqual(['mark:no', 'mark:yes']);
      });

      it('should not produce duplicate map values for duplicate words for the same input key', () => {
        const map = {
          'mark:no' : ['no', 'no', 'no']
        };

        const internalMap = TextToSpeechUtils._processInputMap(map);

        expect(internalMap.get('no')).toEqual(['mark:no']);
      });

      it('should change all input word values to lowercase', () => {
        const map = {
          'mark:no': ['NO', 'ThIs', 'tesT']
        };

        const internalMap = TextToSpeechUtils._processInputMap(map);

        expect(Array.from(internalMap.keys())).toEqual(['no', 'this', 'test'])
      });
    });
  });
});