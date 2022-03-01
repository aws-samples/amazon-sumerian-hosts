// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
/* eslint-disable jasmine/no-spec-dupes */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable jasmine/prefer-toHaveBeenCalledWith */
/* eslint-disable prefer-destructuring */
import {Blend2dState, Deferred} from '@amazon-sumerian-hosts/core';
import describeHostEnviornment from '../../EnvironmentHarness';

describeHostEnviornment('Blend2dState', () => {
  let state1;
  let state2;
  let state3;
  let state4;

  beforeEach(() => {
    state1 = {
      name: 'state1',
      weight: 1,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      internalWeight: jasmine.createSpy('internalWeight'),
    };
    state1.updateInternalWeight.and.callFake(factor => {
      state1._internalWeight = state1.weight * factor;
    });
    state1.setWeight.and.callFake(weight => {
      state1.weight = weight;
    });
    state2 = {
      name: 'state2',
      weight: 0,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      internalWeight: jasmine.createSpy('internalWeight'),
    };
    state2.updateInternalWeight.and.callFake(factor => {
      state2._internalWeight = state2.weight * factor;
    });
    state2.setWeight.and.callFake(weight => {
      state2.weight = weight;
    });
    state3 = {
      name: 'state3',
      weight: 0.5,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      internalWeight: jasmine.createSpy('internalWeight'),
    };
    state3.updateInternalWeight.and.callFake(factor => {
      state3._internalWeight = state3.weight * factor;
    });
    state3.setWeight.and.callFake(weight => {
      state3.weight = weight;
    });
    state4 = {
      name: 'state4',
      weight: 0.5,
      setWeight: jasmine.createSpy('setWeight', () => new Deferred()),
      updateInternalWeight: jasmine.createSpy('updateInternalWeight'),
      internalWeight: jasmine.createSpy('internalWeight'),
    };
    state4.updateInternalWeight.and.callFake(factor => {
      state4._internalWeight = state4.weight * factor;
    });
    state4.setWeight.and.callFake(weight => {
      state4.weight = weight;
    });
  });

  describe('constructor', () => {
    it('should throw an error when the number of blendStates does not match the number of blendThresholds', () => {
      expect(() => {
        const blend = new Blend2dState(
          {},
          [state1, state2, state3],
          [
            [0, 0],
            [1, 0],
          ]
        );
      }).toThrowError();
    });

    it('should throw an error when there is a duplicate value in blendThresholds', () => {
      expect(() => {
        const blend = new Blend2dState(
          {},
          [state1, state2, state3],
          [
            [0, 0],
            [1, 0],
            [0, 0],
          ]
        );
      }).toThrowError();
    });
  });

  describe('setBlendWeight', () => {
    let blend;

    beforeEach(() => {
      blend = new Blend2dState(
        {},
        [state1, state2, state3],
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ]
      );
    });

    it('should throw an error if called with a name other than "x" or "y"', () => {
      expect(() => {
        blend.setBlendWeight('z', 1);
      }).toThrowError();
    });

    it('should return a deferred promise when name is "x" or "y"', () => {
      const interpolatorX = blend.setBlendWeight('x', 1);

      expect(interpolatorX).toBeInstanceOf(Deferred);

      const interpolatorY = blend.setBlendWeight('y', 1);

      expect(interpolatorY).toBeInstanceOf(Deferred);
    });

    it('should update the blend value when the promise is executed', () => {
      const interpolatorX = blend.setBlendWeight('x', 1, 1);

      expect(blend.blendValueX).toEqual(0);

      interpolatorX.execute(250);

      expect(blend.blendValueX).toEqual(0.25);

      const interpolatorY = blend.setBlendWeight('y', 1, 1);

      expect(blend.blendValueY).toEqual(0);

      interpolatorY.execute(250);

      expect(blend.blendValueY).toEqual(0.25);
    });

    it('should resolve once the blend value reaches the target value', async () => {
      const interpolatorX = blend.setBlendWeight('x', 1, 1);

      interpolatorX.execute(1000);

      await expectAsync(interpolatorX).toBeResolved();

      const interpolatorY = blend.setBlendWeight('y', 1, 1);

      interpolatorY.execute(1000);

      await expectAsync(interpolatorY).toBeResolved();
    });
  });

  describe('getBlendWeight', () => {
    let blend;

    beforeEach(() => {
      blend = new Blend2dState(
        {},
        [state1, state2, state3],
        [
          [0, 0],
          [1, 0],
          [0, 1],
        ]
      );
    });

    it('should throw an error if called with a name other than "x" or "y"', () => {
      expect(() => {
        blend.getBlendWeight('z', 1);
      }).toThrowError();
    });

    it('should return the corresponding blendValue when name is "x" or "y"', () => {
      expect(blend.getBlendWeight('x')).not.toEqual(0.52);

      blend._blendValueX = 0.52;

      expect(blend.getBlendWeight('x')).toEqual(0.52);

      expect(blend.getBlendWeight('y')).not.toEqual(0.25);

      blend._blendValueY = 0.25;

      expect(blend.getBlendWeight('y')).toEqual(0.25);
    });
  });

  describe('updateInternalWeight', () => {
    it('should match the normalizedTime of all phase-matched sub-states with non-zero weight when _leadPhaseState is not null', () => {
      const blend = new Blend2dState(
        {},
        [state1, state2, state3],
        [
          [-0.1, -0.1],
          [1, 0],
          [0, 1],
        ],
        [true, true, false]
      );

      blend._phaseLeadState = state1;

      state1.normalizedTime = 0;
      state2.normalizedTime = 1;
      state3.normalizedTime = 1;

      blend.updateInternalWeight(1);

      expect(state2.normalizedTime).toEqual(state1.normalizedTime);
      expect(state3.normalizedTime).not.toEqual(state1.normalizedTime);
    });

    it('should update sub-state internal weights such that they equal the internal weight of the container', () => {
      const blend = new Blend2dState(
        {},
        [state1, state2, state3],
        [
          [-1, -1],
          [1, 0],
          [0, 1],
        ]
      );
      blend._updateBlendWeights();

      blend.updateInternalWeight(1);

      let sumSubInternalWeights = 0;
      blend._states.forEach(state => {
        sumSubInternalWeights += state._internalWeight;
      });

      expect(sumSubInternalWeights).toEqual(blend._internalWeight);

      blend.setWeight(0.5);
      blend.updateInternalWeight(0.5);

      sumSubInternalWeights = 0;
      blend._states.forEach(state => {
        sumSubInternalWeights += state._internalWeight;
      });

      expect(sumSubInternalWeights).toEqual(blend._internalWeight);
    });
  });

  describe('_updateBlendWeights', () => {
    let blend;
    beforeEach(() => {
      blend = new Blend2dState(
        {},
        [state1, state2, state3],
        [
          [-1, -1],
          [1, 0],
          [0, 1],
        ]
      );
    });

    it('should set the corresponding blend weight to 1 when there is only one blend state', () => {
      blend = new Blend2dState({}, [state1], [[0, 0]]);

      state1.weight = 0;

      blend._updateBlendWeights();

      expect(state1.weight).toEqual(1);
    });

    it('should call _setInfluenceClosestPointOnLine when there are only two blend states', () => {
      blend = new Blend2dState(
        {},
        [state1, state2],
        [
          [-1, -1],
          [1, 1],
        ]
      );

      spyOn(blend, '_setInfluenceClosestPointOnLine');

      blend._updateBlendWeights();

      expect(blend._setInfluenceClosestPointOnLine).toHaveBeenCalledWith([
        0,
        0,
      ]);
    });

    it('should call _setInfluenceTriangle when the [x,y] blendValues are within a triangle', () => {
      spyOn(blend, '_setInfluenceTriangle');

      blend._blendValueX = 0;
      blend._blendValueY = 0;
      blend._updateBlendWeights();

      expect(blend._setInfluenceTriangle).toHaveBeenCalled();
    });

    it('should call _setInfluenceTriangle with the triangle that contains the [x,y] blend values', () => {
      blend = new Blend2dState(
        {},
        [state1, state2, state3, state4],
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]
      );

      spyOn(blend, '_setInfluenceTriangle');

      blend.blendValueX = 0.1;
      blend.blendValueY = 0.1;
      blend._updateBlendWeights();

      expect(blend._setInfluenceTriangle).toHaveBeenCalledWith(
        [0, 1, 2],
        [0.1, 0.1]
      );

      blend.blendValueX = -0.1;
      blend._updateBlendWeights();

      expect(blend._setInfluenceTriangle).toHaveBeenCalledWith(
        [3, 0, 2],
        [-0.1, 0.1]
      );
    });

    it('should call _setInfluenceClosestPointInTriangles when the [x,y] blendValues are within a triangle', () => {
      spyOn(blend, '_setInfluenceClosestPointInTriangles');

      blend._blendValueX = 0;
      blend._blendValueY = 2;
      blend._updateBlendWeights();

      expect(blend._setInfluenceClosestPointInTriangles).toHaveBeenCalled();
    });
  });

  describe('_setInfluenceTriangle', () => {
    it('should set blend weights that correspond to the triangle thresholds based on the barycentric ratios between the triangle points and the [x,y] blendValues', () => {
      const blend = new Blend2dState(
        {},
        [state1, state2, state3, state4],
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]
      );

      [
        [
          [0, 1, 2],
          [0, 0],
          [1, 0, 0, 0],
        ],
        [
          [0, 1, 2],
          [0.5, 0],
          [0.5, 0.5, 0, 0],
        ],
        [
          [0, 1, 2],
          [1 / 3, 1 / 3],
          [1 / 3, 1 / 3, 1 / 3, 0],
        ],
        [
          [0, 2, 3],
          [-0.5, 0],
          [0.5, 0, 0, 0.5],
        ],
      ].forEach(set => {
        blend._states.forEach(state => {
          state.weight = 0;
        });
        blend._setInfluenceTriangle(set[0], set[1]);

        [...blend._states.values()].forEach((state, index) => {
          expect(state.weight).toBeCloseTo(set[2][index]);
        });
      });
    });
  });

  describe('_setInfluenceClosestPointInTriangles', () => {
    it('should call _setInfluenceTriangle with the triangle and point in that triangle that are closest to the [x,y] blendValue', () => {
      const blend = new Blend2dState(
        {},
        [state1, state2, state3, state4],
        [
          [0, 0],
          [1, 0],
          [0, 1],
          [-1, 0],
        ]
      );

      const spy = spyOn(blend, '_setInfluenceTriangle');

      [
        [
          [0.2, -0.1],
          [0, 1, 2],
          [0.2, 0],
        ],
        [
          [-2, -0.1],
          [3, 0, 2],
          [-1, 0],
        ],
        [
          [0.1, 2],
          [0, 1, 2],
          [0, 1],
        ],
      ].forEach(set => {
        blend._setInfluenceClosestPointInTriangles(set[0]);

        expect(blend._setInfluenceTriangle).toHaveBeenCalledWith(
          set[1],
          set[2]
        );

        spy.calls.reset();
      });
    });
  });

  describe('_setInfluenceClosestPointOnLine', () => {
    it('should set the two blend weights based on the two blendThreshold poitns and the [x,y] blendValues', () => {
      const blend = new Blend2dState(
        {},
        [state1, state2],
        [
          [-1, -1],
          [1, 1],
        ]
      );

      [
        [
          [0, 0],
          [0.5, 0.5],
        ],
        [
          [-2, -2],
          [1, 0],
        ],
        [
          [2, 3],
          [0, 1],
        ],
        [
          [2, -1],
          [0.1, 0.9],
        ],
      ].forEach(set => {
        [blend._blendValueX, blend._blendValueY] = set[0];

        blend._updateBlendWeights();

        [...blend._states.values()].forEach((state, index) => {
          expect(state.weight).toBeCloseTo(set[1][index]);
        });
      });
    });
  });

  describe('_setPhaseLeadState', () => {
    it('should set _phaseLeadState to the blend with the highest weight of all phase-matched blends', () => {
      const blend = new Blend2dState(
        {},
        [state1, state2, state3],
        [
          [-1, -1],
          [1, 0],
          [0, 1],
        ]
      );

      state1.weight = 1.0;
      state2.weight = 0.4;
      state3.weight = 0.7;

      blend._phaseLeadState = null;

      blend._setPhaseLeadState(
        [...blend._states.values()],
        [false, true, true]
      );

      expect(blend._phaseLeadState).toEqual(state3);
    });
  });
});
