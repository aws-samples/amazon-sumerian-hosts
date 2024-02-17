// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import describeThreeHost from './ThreeHarness.js';

export default function describeHostEnvironment(description, fn) {
  describeThreeHost(description, fn);
}
