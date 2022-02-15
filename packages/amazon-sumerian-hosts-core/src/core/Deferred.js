// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * The built-in class for asynchronous Promises.
 * @external Promise
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 */

/**
 * A Promise object that can be resolved, rejected or canceled at any time by the
 * user.
 *
 * @extends external:Promise
 */
class Deferred extends Promise {
  /**
   * @constructor
   *
   * @param {Function} [executable=() => {}] - The function to be executed by the
   * constructor, during the process of constructing the promise. The signature
   * of this is expected to be: executable(  resolutionFunc, rejectionFunc, cancellationFunc ).
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
            value = onResolve(value);
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
            value = onReject(value);
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
            value = onCancel(value);
          }

          return resolve(value);
        }
      };

      // Run the executable with custom resolver and rejecter
      executable(res, rej, cancel);
    });

    this._status = status;
    this._resolve = res;
    this._reject = rej;
    this._cancel = cancel;
    this._executable = executable;
  }

  /**
   * Gets the resolved state of the promise.
   *
   * @readonly
   */
  get resolved() {
    return this._status.resolved;
  }

  /**
   * Gets the rejected state of the promise.
   *
   * @readonly
   */
  get rejected() {
    return this._status.rejected;
  }

  /**
   * Gets the canceled state of the promise.
   *
   * @readonly
   */
  get canceled() {
    return this._status.canceled;
  }

  /**
   * Gets the pending state of the promise.
   *
   * @readonly
   */
  get pending() {
    return this._status.pending;
  }

  /**
   * Force the promise to resolve.
   *
   * @param {any=} value - Value to pass to the resolver.
   *
   * @returns {any} - The return value of the resolver function.
   */
  resolve(value) {
    return this._resolve(value);
  }

  /**
   * Force the promise to reject.
   *
   * @param {any=} value - Value to pass to the rejecter.
   *
   * @returns {any} - The return value of the rejecter function.
   */
  reject(value) {
    return this._reject(value);
  }

  /**
   * Force the promise to resolve and set the canceled state to true.
   *
   * @param {any=} value - Value to pass to the canceller.
   *
   * @returns {any} - The return value of the canceller function.
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
      this._executable(this._resolve, this._reject, this._cancel, ...args);
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
    return new Deferred((_resolve, _reject, cancel) => {
      cancel(value);
    });
  }

  /**
   * Return a new Deferred promise that will resolve or reject once all promises
   * in the input array have been resolved or one promise is canceled or rejected.
   * Promises in the array that are Deferred promises will be manually resolved,
   * rejected or canceled when calling resolve, reject or cancel on the return promise.
   *
   * @param {Array.<any>} iterable - An iterable such as an array.
   * @param {Function=} onResolve - Optional function to execute once the promise
   * is resolved.
   * @param {Function=} onReject - Optional function to execute once the promise
   * is rejected.
   * @param {Function=} onCancel - Optional function to execute if the user cancels
   * the promise. Canceling results in the promise having a status of 'canceled'.
   *
   * @returns Deferred
   */
  static all(iterable, onResolve, onReject, onCancel) {
    if (iterable == null || typeof iterable[Symbol.iterator] !== 'function') {
      let e = `Cannot execute Deferred.all. First argument must be iterable.`;

      if (typeof onReject === 'function') {
        e = onReject(e);
      }

      return Deferred.reject(e);
    }

    const array = [...iterable];
    const deferred = array.filter(item => item instanceof Deferred);

    const result = new Deferred(
      undefined,
      resolveValue => {
        deferred.forEach(item => {
          item.resolve(resolveValue);
        });
        deferred.length = 0;

        if (typeof onResolve === 'function') {
          return onResolve(resolveValue);
        } else {
          return resolveValue;
        }
      },
      error => {
        deferred.forEach(item => {
          item.reject(error);
        });
        deferred.length = 0;

        if (typeof onReject === 'function') {
          return onReject(error);
        } else {
          return error;
        }
      },
      cancelValue => {
        deferred.forEach(item => {
          item.cancel(cancelValue);
        });
        deferred.length = 0;

        if (typeof onCancel === 'function') {
          return onCancel(cancelValue);
        } else {
          return cancelValue;
        }
      }
    );

    const numItems = array.length;
    const itemTracker = {
      failed: false,
      numResolved: 0,
      resolutions: [],
    };

    array.forEach((item, index) => {
      if (itemTracker.failed) {
        return;
      } else if (!(item instanceof Promise)) {
        itemTracker.resolutions[index] = item;
        itemTracker.numResolved += 1;

        if (itemTracker.numResolved === numItems) {
          result.resolve(itemTracker.resolutions);
        }
        return;
      }

      item.then(
        value => {
          if (!itemTracker.failed && !item.canceled) {
            itemTracker.resolutions[index] = value;
            itemTracker.numResolved += 1;

            if (itemTracker.numResolved === numItems) {
              result.resolve(itemTracker.resolutions);
            }
          } else if (!itemTracker.failed) {
            itemTracker.failed = true;
            result.cancel(value);
          }
        },
        error => {
          if (!itemTracker.failed) {
            itemTracker.failed = true;
            result.reject(error);
          }
        }
      );
    });

    return result;
  }
}

export default Deferred;
