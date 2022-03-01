// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import {MathUtils} from '@amazon-sumerian-hosts/core';

// eslint-disable-next-line jasmine/no-focused-tests
describe('MathUtils', () => {
  describe('closestPointOnLine', () => {
    it('should find the closest point on a line segment', () => {
      [
        [
          [-1, -1],
          [1, 1],
          [-2, 0],
          [-1, -1],
        ],
        [
          [-1, -1],
          [1, 1],
          [2, 0],
          [1, 1],
        ],
        [
          [-1, -1],
          [1, 1],
          [0.5, -0.5],
          [0, 0],
        ],
      ].forEach(set => {
        expect(MathUtils.closestPointOnLine(set[0], set[1], set[2])).toEqual(
          set[3]
        );
      });
    });
  });

  describe('distanceSquared', () => {
    it('should calculate the distance squared', () => {
      [
        [[0, 0], [0, 1], 1],
        [[0, 0], [1, 1], 2],
        [[-1, -1], [1, 1], 8],
      ].forEach(set => {
        expect(MathUtils.distanceSquared(set[0], set[1])).toEqual(set[2]);
      });
    });
  });

  describe('getDelaunayTriangulation', () => {
    it('should throw an error when vertices is undefined', () => {
      expect(() => {
        MathUtils.getDelaunayTriangulation();
      }).toThrowError();
    });

    it('should throw an error when vertices contains less than three points', () => {
      const points = [
        [0, 0],
        [0, 1],
      ];

      expect(() => {
        MathUtils.getDelaunayTriangulation(points);
      }).toThrowError();
    });

    it('should generate a triangulation that contains all original points', () => {
      const points = [
        [-1, 1],
        [0, 1],
        [1, 1],
        [-1, 0],
        [0, 0],
        [1, 0],
        [-1, -1],
        [0, -1],
        [1, -1],
      ];

      const triangles = MathUtils.getDelaunayTriangulation(points);

      [...points.keys()].forEach(index => {
        let isInTriangulation = false;
        triangles.forEach(triangle => {
          triangle.forEach(triangleIndex => {
            if (triangleIndex === index) {
              isInTriangulation = true;
            }
          });
        });

        expect(isInTriangulation).toBeTrue();
      });
    });

    it('should generate a triangulation that satisfies the Delaunay circumcircle property', () => {
      const points = [
        [-1, 1],
        [0, 1],
        [1, 1],
        [-1, 0],
        [0, 0],
        [1, 0],
        [-1, -1],
        [0, -1],
        [1, -1],
      ];

      const triangles = MathUtils.getDelaunayTriangulation(points);

      triangles.forEach(triangle => {
        [...points.keys()].forEach(index => {
          if (triangle.indexOf(index) === -1) {
            expect(
              MathUtils.isPointInCircumCircle(
                points[triangle[0]],
                points[triangle[1]],
                points[triangle[2]],
                points[index]
              )
            ).not.toBeTrue();
          }
        });
      });
    });
  });

  describe('isPointInCircumCircle', () => {
    it('should return true when the given point is within the triangle circumcircle', () => {
      const points = [
        [-1, -1],
        [1, 0],
        [0, 1],
      ];

      expect(MathUtils.isPointInCircumCircle(...points, [0, 0])).toBeTrue();
    });

    it('should return false when the given point is within the triangle circumcircle', () => {
      const points = [
        [-1, -1],
        [1, 0],
        [0, 1],
      ];

      expect(
        MathUtils.isPointInCircumCircle(...points, [-2, 0])
      ).not.toBeTrue();
    });
  });

  describe('isPointInTriangle', () => {
    it('should return true when the given point is within the triangle', () => {
      const points = [
        [-1, -1],
        [0, 1],
        [1, 0],
      ];

      expect(MathUtils.isPointInTriangle(...points, [0, 0])).toBeTrue();
    });

    it('should return false when the given point is within the triangle', () => {
      const points = [
        [-1, -1],
        [0, 1],
        [1, 0],
      ];

      expect(MathUtils.isPointInTriangle(...points, [-2, 0])).not.toBeTrue();
    });
  });

  describe('sortPointsCCW', () => {
    it('should sort points in counter-clockwise order', () => {
      const points = [
        [0, 0],
        [-1, 1],
        [-1, 0],
      ];
      const orderCCW = [2, 0, 1];

      expect(MathUtils.sortPointsCCW([...orderCCW].reverse(), points)).toEqual(
        orderCCW
      );
    });
  });

  describe('triangleArea', () => {
    it('should calculate the area of a triangle', () => {
      expect(MathUtils.triangleArea([-1, -1], [-1, 0], [1, -1])).toEqual(1.0);
    });
  });

  describe('getVectorMagnitude', () => {
    it('should throw an error if the input is not an Array', () => {
      expect(() => MathUtils.getVectorMagnitude()).toThrowError();

      expect(() => MathUtils.getVectorMagnitude('notAnArray')).toThrowError();

      expect(() => MathUtils.getVectorMagnitude({})).toThrowError();
    });

    it('should throw an error if the elements of the input array are not all numeric', () => {
      expect(() => MathUtils.getVectorMagnitude([1, '2'])).toThrowError();

      expect(() =>
        MathUtils.getVectorMagnitude([1, false, 3, 4])
      ).toThrowError();
    });

    it('should return the length of a vector of arbitrary dimensions', () => {
      [
        [[1, 0], 1],
        [[0, 1, 0], 1],
        [[0, 0, 1, 0], 1],
        [[0, 6], 6],
        [[4, 2, 4], 6],
        [[-2, 0, 4, -4], 6],
      ].forEach(set => {
        expect(MathUtils.getVectorMagnitude(set[0])).toEqual(set[1]);
      });
    });
  });

  describe('cartesianToSpherical', () => {
    it('should return an array containing the radius, polar angle and azimuthal angle corresponding to the given x, y, z coordinates from the input array', () => {
      [
        [
          [0, 0, 0],
          [0, 0, 0],
        ],
        [
          [0, 3, 0],
          [3, 0, 0],
        ],
        [
          [0, 0, 5],
          [5, Math.PI / 2, 0],
        ],
        [
          [-1, 0, 0],
          [1, Math.PI / 2, -Math.PI / 2],
        ],
      ].forEach(set => {
        expect(MathUtils.cartesianToSpherical(...set[0])).toEqual(set[1]);
      });
    });
  });

  describe('getDotProduct', () => {
    it('should throw an error if either input is not an Array', () => {
      expect(() => MathUtils.getDotProduct()).toThrowError();

      expect(() =>
        MathUtils.getDotProduct('notAnArray', [0, 1])
      ).toThrowError();

      expect(() => MathUtils.getDotProduct([0, 1], {})).toThrowError();
    });

    it('should throw an error if the input array lengths are not equal', () => {
      expect(() => MathUtils.getDotProduct([0, 0], [1, 1, 1])).toThrowError();

      expect(() => MathUtils.getDotProduct([0, 0], [1, 1])).not.toThrowError();
    });

    it('should throw an error if the elements of the input arrays are not all numeric', () => {
      expect(() => MathUtils.getDotProduct([1, '2'], [0, 0])).toThrowError();

      expect(() => MathUtils.getDotProduct([1, 2], [false, 0])).toThrowError();
    });

    it('should return the amount one vector goes in the direction of another', () => {
      expect(MathUtils.getDotProduct([1, 1], [2, 2])).toEqual(4);

      expect(MathUtils.getDotProduct([0, 5], [1, 1])).toEqual(5);
    });
  });

  describe('getAngleBetween', () => {
    it('should calculate the angle in radians between two vector arrays', () => {
      const angle1 = MathUtils.getAngleBetween([0, 1], [0, 1]);

      expect(Math.abs(angle1)).toBeLessThanOrEqual(Number.EPSILON);

      expect(
        Math.abs(MathUtils.getAngleBetween([0, 1], [1, 0]) - Math.PI / 2)
      ).toBeLessThanOrEqual(Number.EPSILON);
    });
  });

  describe('rotateVector', () => {
    it('should throw an error if either input is not an Array of numbers', () => {
      expect(() => MathUtils.rotateVector()).toThrowError();

      expect(() => MathUtils.rotateVector([1, 0, 0])).toThrowError();

      expect(() =>
        MathUtils.rotateVector([0, 1, 0], [1, 0, 0, 0, 1, 0, 0, 0, 1])
      ).not.toThrowError();
    });

    it('should throw an error if the first input does not have 3 elements', () => {
      expect(() =>
        MathUtils.rotateVector([0, 1], [1, 0, 0, 0, 1, 0, 0, 0, 1])
      ).toThrowError();

      expect(() =>
        MathUtils.rotateVector([0, 1, 0], [1, 0, 0, 0, 1, 0, 0, 0, 1])
      ).not.toThrowError();
    });

    it('should throw an error if the second input does not have 9 elements', () => {
      expect(() =>
        MathUtils.rotateVector([0, 1, 0], [1, 0, 0, 0, 1, 0])
      ).toThrowError();

      expect(() =>
        MathUtils.rotateVector([0, 1, 0], [1, 0, 0, 0, 1, 0, 0, 0, 1])
      ).not.toThrowError();
    });

    it('should return a new vector array rotated by the amount of the matrix array', () => {
      expect(
        MathUtils.rotateVector([0, 1, 0], [0, -1, 0, 1, 0, 0, 0, 0, 1])
      ).toEqual([1, 0, 0]);
    });
  });

  describe('normalizeVector', () => {
    it('should update the values of the input vector array with values that result in the same direction and a length of 1', () => {
      const v1 = [10, 0, 0];
      MathUtils.normalizeVector(v1);

      expect(v1).toEqual([1, 0, 0]);

      const v2 = [4, 2, 4];
      MathUtils.normalizeVector(v2);

      expect(v2).toEqual([2 / 3, 1 / 3, 2 / 3]);
    });
  });

  describe('getRotationMatrix', () => {
    it('should throw an error the input is not an Array of numbers', () => {
      expect(() => MathUtils.getRotationMatrix()).toThrowError();

      expect(() => MathUtils.getRotationMatrix('not an array')).toThrowError();

      expect(() =>
        MathUtils.getRotationMatrix([
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
        ])
      ).not.toThrowError();
    });

    it('should throw an error if the input does not have 16 elements', () => {
      expect(() =>
        MathUtils.getRotationMatrix([1, 0, 0, 0, 1, 0, 0, 0, 1])
      ).toThrowError();

      expect(() =>
        MathUtils.getRotationMatrix([
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
        ])
      ).not.toThrowError();
    });

    it('should return an array of nine numbers', () => {
      const result = MathUtils.getRotationMatrix([
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        0,
        0,
        0,
        1,
      ]);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toEqual(9);
      expect(result.every(v => typeof v === 'number')).toBeTrue();
    });

    it('should return the rotation component of the input 4x4 matrix array', () => {
      expect(
        MathUtils.getRotationMatrix([
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
          0,
          0,
          0,
          0,
          1,
        ])
      ).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
    });
  });

  describe('dampValue', () => {
    it('should return an array where the first number is between or equal to the currentValue and targetValue', () => {
      const [result1] = MathUtils.dampValue(1, 10, [0, 0], 1);

      expect(result1).toBeGreaterThanOrEqual(1);
      expect(result1).toBeLessThanOrEqual(10);

      const [result2] = MathUtils.dampValue(50, 85, [0, 0], 1);

      expect(result2).toBeGreaterThanOrEqual(50);
      expect(result2).toBeLessThanOrEqual(85);
    });
  });
});
