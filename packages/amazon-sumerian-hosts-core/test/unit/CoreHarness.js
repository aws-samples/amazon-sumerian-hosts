// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
export default function describeCoreHost(description, fn) {
  describe(`Core Host - ${description}`, () => {
    const owner = {id: '1234'};

    fn({owner}, 'core');
  });
}
