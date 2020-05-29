// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/**
 * A Promise object that can be resolved, rejected or canceled at any time by the
 * user.
 */
export default class Deferred extends Promise {
  /**
   * @private
   *
   * @param {Function=} executable - The function to be executed by the constructor,
   * during the process of constructing the promise. The signature of this is expected
   * to be: executable(  resolutionFunc, rejectionFunc ).
   * @param {Function=} onResolve - Optional function to execute once the promise
   * is resolved.
   * @param {Function=} onReject - Optional function to execute once the promise
   * is rejected.
   * @param {Function=} onCancel - Optional function to execute if the user cancels
   * the promise. Canceling results in the promise having a status of 'resolved'.
   */
  constructor(executable = () => {}, onResolve, onReject, onCancel) {
    if (typeof executable !== 'function') {
      throw new Error(
        `Cannot create new Deferred. Executable must be a function.`
      );
    }

    if (typeof onResolve !== 'undefined' && typeof onResolve !== 'function') {
      throw new Error(
        `Cannot create new Deferred. OnResolve must be a function.`
      );
    }

    if (typeof onReject !== 'undefined' && typeof onReject !== 'function') {
      throw new Error(
        `Cannot create new Deferred. OnReject must be a function.`
      );
    }

    if (typeof onCancel !== 'undefined' && typeof onCancel !== 'function') {
      throw new Error(
        `Cannot create new Deferred. OnCancel must be a function.`
      );
    }

    let res;
    let rej;
    let cancel;
    const status = {
      resolved: false,
      rejected: false,
      canceled: false,
      pending: true,
    };

    super((resolve, reject) => {
      // Store the resolver
      res = value => {
        if (status.pending) {
          status.resolved = true;
          status.pending = false;

          if (typeof onResolve === 'function') {
            onResolve(value);
          }

          return resolve(value);
        }
      };

      // Store the rejecter
      rej = value => {
        if (status.pending) {
          status.rejected = true;
          status.pending = false;

          if (typeof onReject === 'function') {
            onReject(value);
          }

          return reject(value);
        }
      };

      // Store the canceler
      cancel = value => {
        if (status.pending) {
          status.canceled = true;
          status.pending = false;

          if (typeof onCancel === 'function') {
            onCancel(value);
          }

          return resolve(value);
        }
      };

      // Run the executable with custom resolver and rejecter
      executable(res, rej);
    });

    this._status = status;
    this._resolve = res;
    this._reject = rej;
    this._cancel = cancel;
    this._executable = executable;
  }

  /**
   * Gets the resolved state of the promise.
   */
  get resolved() {
    return this._status.resolved;
  }

  /**
   * Gets the rejected state of the promise.
   */
  get rejected() {
    return this._status.rejected;
  }

  /**
   * Gets the canceled state of the promise.
   */
  get canceled() {
    return this._status.canceled;
  }

  /**
   * Gets the pending state of the promise.
   */
  get pending() {
    return this._status.pending;
  }

  /**
   * Force the promise to resolve.
   *
   * @param {any=} value - Value to pass to the resolver.
   */
  resolve(value) {
    return this._resolve(value);
  }

  /**
   * Force the promise to reject.
   *
   * @param {any=} value - Value to pass to the rejecter.
   */
  reject(value) {
    return this._reject(value);
  }

  /**
   * Force the promise to resolve and set the canceled state to true.
   *
   * @param {any=} value - Value to pass to the resolver.
   */
  cancel(value) {
    return this._cancel(value);
  }

  /**
   * Run the promise function to try to resolve the promise. Promise must be
   * pending.
   *
   * @param {...any} args - Optional arguments to pass after resolve and reject.
   */
  execute(...args) {
    if (this.pending) {
      this._executable(this._resolve, this._reject, ...args);
    }
  }

  /**
   * Return a canceled deferred promise.
   *
   * @param {any=} value - Value to cancel the promise with.
   *
   * @returns {Deferred}
   */
  static cancel(value) {
    const result = new Deferred();
    result.cancel(value);

    return result;
  }

  /**
   * Return a new Deferred promise that will resolve or reject once all promises
   * in the input array have been resolved or one promise is rejected. Promises in
   * the array that are Deferred promises will be manually resolved, rejected or
   * canceled when calling resolve, reject or cancel on the return promise.
   *
   * @param {Array.<(Deferred|Promise)>} promiseArray - Array of promise objects
   * to keep track of for resolution.
   * @param {Function=} onResolve - Optional function to execute once the promise
   * is resolved.
   * @param {Function=} onReject - Optional function to execute once the promise
   * is rejected.
   * @param {Function=} onCancel - Optional function to execute if the user cancels
   * the promise. Canceling results in the promise having a status of 'resolved'.
   *
   * @returns Deferred
   */
  static all(promiseArray, onResolve, onReject, onCancel) {
    const promises = [...promiseArray];
    const promiseCount = promises.length;
    const deferred = promises.filter(p => p instanceof Deferred);

    return new Deferred(
      (resolve, reject) => {
        const resolutions = [];

        promises.forEach(promise => {
          promise
            .then(resolution => {
              resolutions.push(resolution);

              if (resolutions.length === promiseCount) {
                resolve(resolutions);
              }
            })
            .catch(e => {
              reject(e);
            });
        });
      },
      resolveValue => {
        deferred.forEach(d => {
          d.resolve(resolveValue);
        });

        if (typeof onResolve === 'function') {
          onResolve(resolveValue);
        }
      },
      error => {
        deferred.forEach(d => {
          d.reject(error);
        });

        if (typeof onReject === 'function') {
          onReject(error);
        }
      },
      cancelValue => {
        deferred.forEach(d => {
          d.cancel(cancelValue);
        });

        if (typeof onCancel === 'function') {
          onCancel(cancelValue);
        }
      }
    );
  }
}
