// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import Utils from 'core/Utils';

describe('Utils', () => {
  describe('createId', () => {
    it('should generate a string', () => {
      const actual = typeof Utils.createId();
      const expected = 'string';

      expect(actual).toEqual(expected);
    });
  });

  describe('getUniqueName', () => {
    const nameArray = [
      'name',
      'nameOther',
      'name1',
      'name5',
      'name-5',
      'name14',
    ];

    it('should return the original name if it is not included in the provided array of names', () => {
      expect(Utils.getUniqueName('uniqueName', nameArray)).toEqual(
        'uniqueName'
      );

      expect(Utils.getUniqueName('name', nameArray)).not.toEqual('name');
    });

    it('should return a string that matches the original name with the highest trailing number appended if it is included in the provided array of names', () => {
      expect(Utils.getUniqueName('name', nameArray)).toEqual('name15');

      expect(Utils.getUniqueName('name-5', nameArray)).toEqual('name-6');

      expect(Utils.getUniqueName('nameOther', nameArray)).toEqual('nameOther1');
    });
  });
});
