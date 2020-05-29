// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/**
 * A collection of useful generic functions.
 */
export default class Utils {
  /**
   * Generate a unique id
   *
   * @returns {String}
   */
  static createId() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const randomNumber = Math.floor((Date.now() + Math.random() * 16) % 16);
      if (c === 'x') {
        return randomNumber.toString(16);
      }
      // Set bit 6 and 7 to 0 and 1
      return ((randomNumber & 0x3) | 0x8).toString(16);
    });
  }

  /**
   * Check a name string against an array of strings to determine if it is unique.
   * If it isn't, append incremented trailing integers to the end of the name
   * until it is unique.
   *
   * @param {string} name - String name to make unique.
   * @param {Array.<string>=} nameArray - Array of string names to check agains.
   *
   * @returns {string}
   */
  static getUniqueName(name, nameArray = []) {
    // If the name isn't in the array return it right away
    if (!nameArray.includes(name)) {
      return name;
    }

    const nameSet = new Set(nameArray);

    // Separate the name into string and trailing numbers
    const matchGroup = name.match(/\d*$/);
    const {index} = matchGroup;
    const baseName = name.slice(0, index);
    let increment = Number(matchGroup[0]);

    // Find the highest trailing number value for the base of the name
    nameSet.forEach(setName => {
      const setMatchGroup = setName.match(/\d*$/);

      if (setName.slice(0, setMatchGroup.index) === baseName) {
        const setIncrement = Number(setMatchGroup[0]);

        if (setIncrement > increment) {
          increment = setIncrement;
        }
      }
    });

    // Increment the highest trailing number and append to the name
    return `${baseName}${increment + 1}`;
  }
}
