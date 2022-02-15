// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import describeBabylonHost from './BabylonHarness';

export default function describeHostEnvironment(description, fn) {
  describeBabylonHost(description, fn);
}
