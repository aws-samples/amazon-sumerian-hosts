// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import describeCoreHost from './CoreHarness';

export default function describeHostEnvironment(description, fn) {
  describeCoreHost(description, fn);
}
