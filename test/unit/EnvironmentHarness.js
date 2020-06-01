// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {env} from 'app/HostEnvironment';
import describeCoreHost from './CoreHarness';
import describeThreeHost from './ThreeHarness';
import describeBabylonHost from './BabylonHarness';

export default function describeHostEnvironment(description, fn) {
  switch (env) {
    case 'babylon':
      describeBabylonHost(description, fn);
      break;

    case 'three':
      describeThreeHost(description, fn);
      break;

    case 'core':
    default:
      describeCoreHost(description, fn);
  }
}
