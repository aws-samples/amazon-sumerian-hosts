// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-empty */
import Deferred from 'core/Deferred';

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

      expect(autoRejected.rejected).toBeTrue();

      const manualRejected = new Deferred();

      expect(manualRejected.rejected).toBeFalse();

      manualRejected.reject();

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

      expect(autoRejected.pending).toBeFalse();

      const manualRejected = new Deferred();

      expect(manualRejected.pending).toBeTrue();

      manualRejected.resolve();

      expect(manualRejected.pending).toBeFalse();
    });

    it('should return false if the promise has been manually canceled', () => {
      const deferred = new Deferred();

      expect(deferred.pending).toBeTrue();

      deferred.cancel();

      expect(deferred.pending).toBeFalse();
    });
  });

  describe('resolve', () => {
    it('should allow the promise to manually be resolved with a value', () => {
      const onResolve = jasmine.createSpy('onResolve');
      const deferred = new Deferred(undefined, onResolve);
      deferred.resolve(3);

      expect(onResolve).toHaveBeenCalledWith(3);
    });
  });

  describe('reject', () => {
    it('should allow the promise to manually be rejected with a value', () => {
      const onReject = jasmine.createSpy('onReject');
      const deferred = new Deferred(undefined, undefined, onReject);
      deferred.reject('error');

      expect(onReject).toHaveBeenCalledWith('error');
    });
  });

  describe('cancel', () => {
    it('should allow the promise to manually be cancelled with a value and execute the onCancel argument instead of onResolve', () => {
      const onResolve = jasmine.createSpy('onResolve');
      const onCancel = jasmine.createSpy('onCancel');
      const deferred = new Deferred(undefined, onResolve, undefined, onCancel);
      deferred.cancel('cancelled');

      expect(onCancel).toHaveBeenCalledWith('cancelled');
      expect(onResolve).not.toHaveBeenCalledWith('cancelled');
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
});
