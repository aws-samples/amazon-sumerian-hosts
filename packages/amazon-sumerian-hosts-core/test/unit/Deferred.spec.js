// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-empty */
import {Deferred} from '@amazon-sumerian-hosts/core';

describe('Deferred', () => {
  describe('constructor', () => {
    it('should create a Promise object', () => {
      const deferred = new Deferred();
      const actual = deferred instanceof Promise;
      const expected = true;

      expect(actual).toEqual(expected);
    });

    it('should throw an error if a non-function is passed as the executable', () => {
      expect(() => {
        // eslint-disable-next-line no-unused-vars
        const deferred = new Deferred('not a function');
      }).toThrowError();
    });

    it('should throw an error if a non-function is passed as the onResolve callback', () => {
      expect(() => {
        // eslint-disable-next-line no-unused-vars
        const deferred = new Deferred(undefined, 'not a function');
      }).toThrowError();
    });

    it('should throw an error if a non-function is passed as the onReject callback', () => {
      expect(() => {
        // eslint-disable-next-line no-unused-vars
        const deferred = new Deferred(undefined, undefined, 'not a function');
      }).toThrowError();
    });

    it('should throw an error if a non-function is passed as the onCancel callback', () => {
      expect(() => {
        // eslint-disable-next-line no-unused-vars
        const deferred = new Deferred(
          undefined,
          undefined,
          undefined,
          'not a function'
        );
      }).toThrowError();
    });

    it('should execute the onResolve callback once the promise has been resolved', async () => {
      const onResolve = jasmine.createSpy('onResolve');
      const deferred = new Deferred(resolve => {
        resolve(5);
      }, onResolve);
      await deferred;

      expect(onResolve).toHaveBeenCalledWith(5);
    });

    it('should not execute the onResolve callback if the promise tries to resolve after it has already been rejected or canceled', async () => {
      const onResolve = jasmine.createSpy('onResolve');
      const onReject = jasmine.createSpy('onReject');
      const onCancel = jasmine.createSpy('onCancel');

      const rejected = new Deferred(
        (resolve, reject) => {
          reject('error');
          resolve(5);
        },
        onResolve,
        onReject,
        onCancel
      );
      try {
        await rejected;
      } catch (e) {}

      expect(onReject).toHaveBeenCalledWith('error');
      expect(onResolve).not.toHaveBeenCalled();

      const canceled = new Deferred(
        (resolve, _reject, cancel) => {
          cancel(15);
          resolve(5);
        },
        onResolve,
        onReject,
        onCancel
      );
      await canceled;

      expect(onCancel).toHaveBeenCalledWith(15);
      expect(onResolve).not.toHaveBeenCalled();
    });

    it('should execute the onReject callback once the promise has been rejected', async () => {
      const onReject = jasmine.createSpy('onReject');
      const deferred = new Deferred(
        (_resolve, reject) => {
          reject('error');
        },
        undefined,
        onReject
      ).catch(() => {});
      await deferred;

      expect(onReject).toHaveBeenCalledWith('error');
    });

    it('should not execute the onReject callback if the promise tries to reject after it has already been resolved or canceled', async () => {
      const onResolve = jasmine.createSpy('onResolve');
      const onReject = jasmine.createSpy('onReject');
      const onCancel = jasmine.createSpy('onCancel');

      const resolved = new Deferred(
        (resolve, reject) => {
          resolve(5);
          reject('error');
        },
        onResolve,
        onReject,
        onCancel
      );
      await resolved;

      expect(onResolve).toHaveBeenCalledWith(5);
      expect(onReject).not.toHaveBeenCalled();

      const canceled = new Deferred(
        (_resolve, reject, cancel) => {
          cancel(15);
          reject('error');
        },
        onResolve,
        onReject,
        onCancel
      );
      await canceled;

      expect(onCancel).toHaveBeenCalledWith(15);
      expect(onReject).not.toHaveBeenCalled();
    });

    it('should execute the onCancel callback once the promise has been canceled', async () => {
      const onCancel = jasmine.createSpy('onCancel');
      const deferred = new Deferred(
        (_resolve, _reject, cancel) => {
          cancel(15);
        },
        undefined,
        undefined,
        onCancel
      );
      await deferred;

      expect(onCancel).toHaveBeenCalledWith(15);
    });

    it('should not execute the onCancel callback if the promise tries to cancel after it has already been resolved or rejected', async () => {
      const onResolve = jasmine.createSpy('onResolve');
      const onReject = jasmine.createSpy('onReject');
      const onCancel = jasmine.createSpy('onCancel');

      const resolved = new Deferred(
        (resolve, _reject, cancel) => {
          resolve(5);
          cancel(15);
        },
        onResolve,
        onReject,
        onCancel
      );
      await resolved;

      expect(onResolve).toHaveBeenCalledWith(5);
      expect(onCancel).not.toHaveBeenCalled();

      const rejected = new Deferred(
        (_resolve, reject, cancel) => {
          reject('error');
          cancel(15);
        },
        onResolve,
        onReject,
        onCancel
      );
      try {
        await rejected;
      } catch (e) {}

      expect(onReject).toHaveBeenCalledWith('error');
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe('resolved', () => {
    it('should return true if the promise has been resolved', () => {
      const autoResolved = new Deferred(resolve => {
        resolve();
      });

      expect(autoResolved.resolved).toBeTrue();

      const manualResolved = new Deferred();

      expect(manualResolved.resolved).toBeFalse();

      manualResolved.resolve();

      expect(manualResolved.resolved).toBeTrue();
    });
  });

  describe('rejected', () => {
    it('should return true if the promise has been rejected', () => {
      const autoRejected = new Deferred((_resolve, reject) => {
        reject();
      });

      autoRejected.catch();

      expect(autoRejected.rejected).toBeTrue();

      const manualRejected = new Deferred();

      expect(manualRejected.rejected).toBeFalse();

      manualRejected.reject();

      manualRejected.catch();

      expect(manualRejected.rejected).toBeTrue();
    });
  });

  describe('canceled', () => {
    it('should return true if the promise has been manually canceled', () => {
      const deferred = new Deferred();

      expect(deferred.canceled).toBeFalse();

      deferred.cancel();

      expect(deferred.canceled).toBeTrue();
    });
  });

  describe('pending', () => {
    it('should return false if the promise has been resolved', () => {
      const autoResolved = new Deferred(resolve => {
        resolve();
      });

      expect(autoResolved.pending).toBeFalse();

      const manualResolved = new Deferred();

      expect(manualResolved.pending).toBeTrue();

      manualResolved.resolve();

      expect(manualResolved.pending).toBeFalse();
    });

    it('should return false if the promise has been rejected', () => {
      const autoRejected = new Deferred((_resolve, reject) => {
        reject();
      });

      autoRejected.catch();

      expect(autoRejected.pending).toBeFalse();

      const manualRejected = new Deferred();

      expect(manualRejected.pending).toBeTrue();

      manualRejected.reject();

      manualRejected.catch();

      expect(manualRejected.pending).toBeFalse();
    });

    it('should return false if the promise has been canceled', () => {
      const autoCanceled = new Deferred((_resolve, _reject, cancel) => {
        cancel();
      });

      expect(autoCanceled.pending).toBeFalse();

      const manualCanceled = new Deferred();

      expect(manualCanceled.pending).toBeTrue();

      manualCanceled.cancel();

      expect(manualCanceled.pending).toBeFalse();
    });
  });

  describe('resolve', () => {
    it('should allow the promise to manually be resolved with a value', () => {
      const onResolve = jasmine.createSpy('onResolve');
      const deferred = new Deferred(undefined, onResolve);

      expect(deferred.pending).toBeTrue();

      deferred.resolve(3);

      expect(onResolve).toHaveBeenCalledWith(3);
      expect(deferred.pending).toBeFalse();
    });
  });

  describe('reject', () => {
    it('should allow the promise to manually be rejected with a value', () => {
      const onReject = jasmine.createSpy('onReject');
      const deferred = new Deferred(undefined, undefined, onReject);

      expect(deferred.pending).toBeTrue();

      deferred.reject('error');

      deferred.catch();

      expect(onReject).toHaveBeenCalledWith('error');
      expect(deferred.pending).toBeFalse();
    });
  });

  describe('cancel', () => {
    it('should allow the promise to manually be cancelled with a value and execute the onCancel argument instead of onResolve', () => {
      const onResolve = jasmine.createSpy('onResolve');
      const onCancel = jasmine.createSpy('onCancel');
      const deferred = new Deferred(undefined, onResolve, undefined, onCancel);

      expect(deferred.pending).toBeTrue();

      deferred.cancel('cancelled');

      expect(onCancel).toHaveBeenCalledWith('cancelled');
      expect(onResolve).not.toHaveBeenCalledWith('cancelled');
      expect(deferred.pending).toBeFalse();
    });
  });

  describe('execute', () => {
    it("should allow the promise's executor to be manually executed", () => {
      const executor = jasmine.createSpy('executor');
      const deferred = new Deferred(executor);

      expect(executor).toHaveBeenCalledTimes(1);

      deferred.execute(5);

      expect(executor).toHaveBeenCalledWith(
        deferred._resolve,
        deferred._reject,
        deferred._cancel,
        5
      );
    });

    it('should not run the executor if the promise is no longer pending', () => {
      const deferred = new Deferred(resolve => {
        resolve();
      });
      const onExecute = spyOn(deferred, '_executable');
      deferred.execute();

      expect(onExecute).not.toHaveBeenCalled();
    });
  });

  describe('static cancel', () => {
    it('should return a Deferred whose canceled property returns true', () => {
      const result = Deferred.cancel(15);

      expect(result).toBeInstanceOf(Deferred);
      expect(result.pending).toBeFalse();
      expect(result.resolved).toBeFalse();
      expect(result.rejected).toBeFalse();
      expect(result.canceled).toBeTrue();
    });

    it('should return a Deferred that resolves to the provieded value', () => {
      const result = Deferred.cancel(15);

      return expectAsync(result).toBeResolvedTo(15);
    });
  });

  describe('static all', () => {
    it('should return a Deferred', () => {
      expect(Deferred.all([])).toBeInstanceOf(Deferred);
    });

    it('should return a rejected Deferred if a non-iterable is passed as the first argument', async () => {
      await expectAsync(Deferred.all()).toBeRejected();
      await expectAsync(Deferred.all(undefined)).toBeRejected();
      await expectAsync(Deferred.all(null)).toBeRejected();
      await expectAsync(Deferred.all(true)).toBeRejected();
      await expectAsync(Deferred.all(1)).toBeRejected();
      await expectAsync(Deferred.all(NaN)).toBeRejected();
      await expectAsync(Deferred.all({value: 1})).toBeRejected();
    });

    it('should resolve with an array matching the contents of the original iterable if none of the items in the iterable are non-promises', async () => {
      const allStr = Deferred.all('12345');
      await expectAsync(allStr).toBeResolvedTo(['1', '2', '3', '4', '5']);

      await allStr;

      expect(allStr.resolved).toBeTrue();

      const array = [1, 2, 3, 4, 5];
      const allArray = Deferred.all(array);
      await expectAsync(allArray).toBeResolvedTo(array);

      await allArray;

      expect(allArray.resolved).toBeTrue();

      const mixedArray = [1, 2, Promise.resolve(3), 4, 5];
      const allMixedArray = Deferred.all(mixedArray);
      await expectAsync(allMixedArray).toBeResolved();
      await expectAsync(allMixedArray).not.toBeResolvedTo(mixedArray);

      await allMixedArray;

      expect(allMixedArray.resolved).toBeTrue();
    });

    it('should resolve with an array matching the values and resolved values of the original iterable if the iterable contains promises', async () => {
      const mixedArray = [1, 2, Promise.resolve(3), 4, 5];
      const allMixedArray = Deferred.all(mixedArray);
      await expectAsync(allMixedArray).toBeResolved();
      await expectAsync(allMixedArray).not.toBeResolvedTo(mixedArray);
      await expectAsync(allMixedArray).toBeResolvedTo([1, 2, 3, 4, 5]);

      await allMixedArray;

      expect(allMixedArray.resolved).toBeTrue();
    });

    it('should resolve with the first canceled value if the iterable contains a Deferred that gets canceled', async () => {
      const mixedArray = [
        1,
        Deferred.cancel(5),
        Promise.resolve(3),
        Deferred.cancel(15),
        5,
      ];
      const allMixedArray = Deferred.all(mixedArray);
      await expectAsync(allMixedArray).toBeResolved();
      await expectAsync(allMixedArray).not.toBeResolvedTo(mixedArray);
      await expectAsync(allMixedArray).toBeResolvedTo(5);

      await allMixedArray;

      expect(allMixedArray.resolved).toBeFalse();
      expect(allMixedArray.canceled).toBeTrue();
    });

    it('should cancel any pending Deferred promises with the value of the first canceled Deferred', async () => {
      const p1 = new Deferred(resolve => {
        resolve(5);
      });
      const p2 = new Deferred();
      const p3 = new Deferred();
      const p4 = new Deferred();
      const all = Deferred.all([p1, p2, p3, p4]);

      await expectAsync(p1).toBeResolvedTo(5);

      await p1;

      expect(p1.resolved).toBeTrue();
      expect(p2.resolved).toBeFalse();
      expect(p3.resolved).toBeFalse();
      expect(p4.resolved).toBeFalse();
      expect(all.resolved).toBeFalse();

      p3.cancel('cancelValue');

      await expectAsync(all).toBeResolvedTo('cancelValue');
      await expectAsync(p1).toBeResolvedTo(5);
      await expectAsync(p2).toBeResolvedTo('cancelValue');
      await expectAsync(p3).toBeResolvedTo('cancelValue');
      await expectAsync(p4).toBeResolvedTo('cancelValue');

      await p2;
      await p3;
      await p4;
      await all;

      expect(p1.resolved).toBeTrue();
      expect(p1.canceled).toBeFalse();
      expect(p2.resolved).toBeFalse();
      expect(p2.canceled).toBeTrue();
      expect(p3.resolved).toBeFalse();
      expect(p3.canceled).toBeTrue();
      expect(p4.resolved).toBeFalse();
      expect(p4.canceled).toBeTrue();
      expect(all.resolved).toBeFalse();
      expect(all.canceled).toBeTrue();
    });

    it('should reject with the first rejected value if the iterable contains a promise that gets canceled', async () => {
      const mixedArray = [
        1,
        Deferred.resolve(5),
        Promise.reject(new Error('error')),
        new Deferred(),
        5,
      ];
      const allMixedArray = Deferred.all(mixedArray);
      await expectAsync(allMixedArray).toBeRejected();
      await expectAsync(allMixedArray).not.toBeRejectedWith(mixedArray);
      await expectAsync(allMixedArray).toBeRejectedWith(new Error('error'));

      try {
        await allMixedArray;
      } catch (e) {}

      expect(allMixedArray.resolved).toBeFalse();
      expect(allMixedArray.rejected).toBeTrue();
    });

    it('should reject any pending Deferred promises with the value of the first rejected Deferred', async () => {
      const p1 = new Deferred(resolve => {
        resolve(5);
      });
      const p2 = new Deferred();
      const p3 = new Deferred();
      const p4 = new Deferred();
      const all = Deferred.all([p1, p2, p3, p4]);

      await expectAsync(p1).toBeResolvedTo(5);

      await p1;

      expect(p1.resolved).toBeTrue();
      expect(p2.resolved).toBeFalse();
      expect(p3.resolved).toBeFalse();
      expect(p4.resolved).toBeFalse();
      expect(all.resolved).toBeFalse();

      p3.reject('error');

      await expectAsync(all).toBeRejectedWith('error');
      await expectAsync(p1).toBeResolvedTo(5);
      await expectAsync(p2).toBeRejectedWith('error');
      await expectAsync(p3).toBeRejectedWith('error');
      await expectAsync(p4).toBeRejectedWith('error');

      try {
        await p2;
      } catch (e) {}
      try {
        await p3;
      } catch (e) {}
      try {
        await p4;
      } catch (e) {}
      try {
        await all;
      } catch (e) {}

      expect(p1.resolved).toBeTrue();
      expect(p1.rejected).toBeFalse();
      expect(p2.resolved).toBeFalse();
      expect(p2.rejected).toBeTrue();
      expect(p3.resolved).toBeFalse();
      expect(p3.rejected).toBeTrue();
      expect(p4.resolved).toBeFalse();
      expect(p4.rejected).toBeTrue();
      expect(all.resolved).toBeFalse();
      expect(all.rejected).toBeTrue();
    });

    it('should resolve any pending Deferred promises with the resolve value if the Deferred.all promise is manually resolved', async () => {
      const p1 = new Deferred(resolve => {
        resolve(5);
      });
      const p2 = new Deferred();
      const p3 = new Deferred();
      const p4 = new Deferred();
      const all = Deferred.all([3, p1, p2, p3, p4]);

      await expectAsync(p1).toBeResolvedTo(5);

      await p1;

      expect(p1.resolved).toBeTrue();
      expect(p2.resolved).toBeFalse();
      expect(p3.resolved).toBeFalse();
      expect(p4.resolved).toBeFalse();
      expect(all.resolved).toBeFalse();

      p3.resolve('five');

      await expectAsync(p1).toBeResolvedTo(5);
      await expectAsync(p3).toBeResolvedTo('five');

      await p3;

      expect(p1.resolved).toBeTrue();
      expect(p2.resolved).toBeFalse();
      expect(p3.resolved).toBeTrue();
      expect(p4.resolved).toBeFalse();
      expect(all.resolved).toBeFalse();

      all.resolve(10);

      await expectAsync(p1).toBeResolvedTo(5);
      await expectAsync(p2).toBeResolvedTo(10);
      await expectAsync(p3).toBeResolvedTo('five');
      await expectAsync(p4).toBeResolvedTo(10);
      await expectAsync(all).toBeResolvedTo(10);

      await p2;
      await p4;
      await all;

      expect(p1.resolved).toBeTrue();
      expect(p1.canceled).toBeFalse();
      expect(p2.resolved).toBeTrue();
      expect(p2.canceled).toBeFalse();
      expect(p3.resolved).toBeTrue();
      expect(p3.canceled).toBeFalse();
      expect(p4.resolved).toBeTrue();
      expect(p4.canceled).toBeFalse();
      expect(all.resolved).toBeTrue();
      expect(all.canceled).toBeFalse();
    });
  });
});
