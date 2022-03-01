// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {Deferred, Utils} from '@amazon-sumerian-hosts/core';

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

  describe('wait', () => {
    it('should return a Deferred promise', () => {
      expect(Utils.wait(3)).toBeInstanceOf(Deferred);
    });

    it('should log a warning if the seconds argument is not a number', () => {
      const onWarn = spyOn(console, 'warn');
      Utils.wait('notANumber');

      expect(onWarn).toHaveBeenCalledTimes(1);
    });

    it('should resolve immediately if the seconds argument is less than or equal to zero', async () => {
      await expectAsync(Utils.wait(0)).toBeResolved();

      await expectAsync(Utils.wait(-1)).toBeResolved();
    });

    describe('execute', () => {
      it('should reject the promise if a non-numeric deltaTime argument is passed', () => {
        const wait = Utils.wait(1);
        wait.execute('notANumber');

        return expectAsync(wait).toBeRejected();
      });

      it('should execute the onProgress function argument each time the deferred is executed with a non-zero delta time', () => {
        const onProgress = jasmine.createSpy('onProgress');
        const wait = Utils.wait(1, {onProgress});

        wait.execute(0);

        expect(onProgress).not.toHaveBeenCalled();

        wait.execute(100);

        expect(onProgress).toHaveBeenCalledTimes(1);
      });

      it('should resolve the promise once the required number of seconds has elapsed', async () => {
        const wait = Utils.wait(1);

        wait.execute(1000);

        await expectAsync(wait).toBeResolved();
      });
    });
  });
});
