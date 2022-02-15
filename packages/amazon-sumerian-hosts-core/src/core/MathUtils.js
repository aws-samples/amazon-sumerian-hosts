// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const RadianToDegree = 180 / Math.PI;
const DegreeToRadian = Math.PI / 180;

/**
 * A collection of useful math functions.
 *
 * @hideconstructor
 */
class MathUtils {
  /**
   * Convert the given angle from radians to degrees.
   *
   * @param {number} radians - Angle in radians.
   *
   * @returns {number} - Angle in degrees.
   */
  static toDegrees(radians) {
    return radians * RadianToDegree;
  }

  /**
   * Convert the given angle from degrees to radians.
   *
   * @param {number} degrees - Angle in degrees.
   *
   * @returns {number} - Angle in radians.
   */
  static toRadians(degrees) {
    return degrees * DegreeToRadian;
  }

  /**
   * Linearly interpolate between two values.
   *
   * @param {number} from - Start value.
   * @param {number} to - Target value.
   * @param {number} factor - 0-1 amount to interpolate between from and to.
   *
   * @returns {number}
   */
  static lerp(from, to, factor) {
    return from + (to - from) * factor;
  }

  /**
   * Clamp a number between 2 values.
   *
   * @param {number} value - Value to clamp.
   * @param {number} [min=0] - Minumum value.
   * @param {number} [max=1] - Maximum value.
   *
   * @returns {number}
   */
  static clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(value, max));
  }

  /**
   * Calculates the closest point on a given 2D line segement
   * from a given 2D point.
   *
   * @param {Array.<number>} a - First point on line segment.
   * @param {Array.<number>} b - Second point on line segment.
   * @param {Array.<number>} p - 2D point.
   *
   * @returns {Array.<number>}
   */
  static closestPointOnLine(a, b, p) {
    const distSqr = MathUtils.distanceSquared(a, b);

    // Line segment is a single point
    if (distSqr === 0) {
      return a;
    }

    const t =
      ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / distSqr;

    let point = [...a];
    if (t > 1) {
      point = [...b];
    } else if (t > 0) {
      point = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    }

    return point;
  }

  /**
   * Gets the distance squared for two 2D points.
   * @param {Array.<number>} a - 2D point.
   * @param {Array.<number>} b - 2D point.
   *
   * @returns {number}
   */
  static distanceSquared(a, b) {
    return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]);
  }

  /**
   * Triangulates a set of 2D points using an implementation
   * of the Bowyer-Watson incremental Delaunay triangulation.
   *
   * @param {Array.<Array.<number>>} vertices - Array of 2D points.
   *
   * @returns {Array.<Array<number>>} - Array of triangle indices.
   */
  static getDelaunayTriangulation(vertices) {
    if (!vertices || vertices.length < 3) {
      throw new Error(
        `Cannot get delaunay triangulation for points ${vertices}. Input must contain at least three points.`
      );
    }

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    vertices.forEach(v => {
      minX = v[0] < minX ? v[0] : minX;
      minY = v[1] < minY ? v[1] : minY;
      maxX = v[0] > maxX ? v[0] : maxX;
      maxY = v[1] > maxY ? v[1] : maxY;
    });

    const dX = maxX - minX;
    const dY = maxY - minY;
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    const dMax = dX > dY ? dX : dY;

    const superIndices = [
      vertices.length,
      vertices.length + 1,
      vertices.length + 2,
    ];

    const vertsWithSuper = [
      ...vertices,
      [midX - 20 * dMax, midY - dMax],
      [midX, midY + 20 * dMax],
      [midX + 20 * dMax, midY - dMax],
    ];

    const superSortedIndices = MathUtils.sortPointsCCW(
      superIndices,
      vertsWithSuper
    );

    const superTriangle = {
      indices: superSortedIndices,
      edges: [
        [superSortedIndices[0], superSortedIndices[1]],
        [superSortedIndices[1], superSortedIndices[2]],
        [superSortedIndices[2], superSortedIndices[0]],
      ],
    };

    const triangles = [superTriangle];

    vertsWithSuper.forEach((newVert, newIndex) => {
      const invalidTriangles = [];
      triangles.forEach(triangle => {
        if (
          MathUtils.isPointInCircumCircle(
            vertsWithSuper[triangle.indices[0]],
            vertsWithSuper[triangle.indices[1]],
            vertsWithSuper[triangle.indices[2]],
            newVert
          )
        ) {
          invalidTriangles.push(triangle);
        }
      });

      const boundingPoly = [];
      invalidTriangles.forEach(triangle => {
        triangle.edges.forEach(edge => {
          let count = 0;
          invalidTriangles.forEach(otherTriangle => {
            if (triangle !== otherTriangle) {
              otherTriangle.edges.forEach(otherEdge => {
                if (
                  (edge[0] === otherEdge[0] && edge[1] === otherEdge[1]) ||
                  (edge[1] === otherEdge[0] && edge[0] === otherEdge[1])
                ) {
                  count += 1;
                }
              });
            }
          });
          if (count === 0) boundingPoly.push(edge);
        });
      });

      invalidTriangles.forEach(triangle => {
        triangles.splice(triangles.indexOf(triangle), 1);
      });

      boundingPoly.forEach(edge => {
        const sortedIndices = MathUtils.sortPointsCCW(
          [edge[0], edge[1], newIndex],
          vertsWithSuper
        );

        triangles.push({
          indices: sortedIndices,
          edges: [
            [sortedIndices[0], sortedIndices[1]],
            [sortedIndices[1], sortedIndices[2]],
            [sortedIndices[2], sortedIndices[0]],
          ],
        });
      });
    });

    const trianglesToRemove = [];
    triangles.forEach(triangle => {
      triangle.indices.forEach(index => {
        if (superIndices.includes(index)) {
          trianglesToRemove.push(triangle);
        }
      });
    });

    trianglesToRemove.forEach(triangle => {
      const index = triangles.indexOf(triangle);
      if (index !== -1) {
        triangles.splice(index, 1);
      }
    });

    return triangles.map(triangle => triangle.indices);
  }

  /**
   * Determines if a given 2D point is within the cicrumcircle
   * defined by three 2D points. The triangle points must be in
   * counter-clockwise order a -> b -> c.
   *
   * @param {Array.<number>} a - First triangle point.
   * @param {Array.<number>} b - Second triangle point.
   * @param {Array.<number>} c - Third triangle point.
   * @param {Array.<number>} p - 2D point.
   *
   * @returns {boolean}
   */
  static isPointInCircumCircle(a, b, c, p) {
    const ax = a[0] - p[0];
    const ay = a[1] - p[1];
    const bx = b[0] - p[0];
    const by = b[1] - p[1];
    const cx = c[0] - p[0];
    const cy = c[1] - p[1];

    return (
      (ax * ax + ay * ay) * (bx * cy - cx * by) -
        (bx * bx + by * by) * (ax * cy - cx * ay) +
        (cx * cx + cy * cy) * (ax * by - bx * ay) >
      0
    );
  }

  /**
   * Determines if a given 2D point is within a given triangle.
   *
   * @param {Array.<number>} a - First triangle point.
   * @param {Array.<number>} b - Second triangle point.
   * @param {Array.<number>} c - Third triangle point.
   * @param {Array.<number>} p - 2D point.
   *
   * @returns {boolean}
   */
  static isPointInTriangle(a, b, c, p) {
    const denom = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    const aVal =
      ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) / denom;
    const bVal =
      ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) / denom;
    const cVal = 1 - aVal - bVal;

    return (
      aVal >= 0 && aVal <= 1 && bVal >= 0 && bVal <= 1 && cVal >= 0 && cVal <= 1
    );
  }

  /**
   * Gets the sorted indices of a given set of 2D points in
   * counter-clockwise order.
   *
   * @param {Array.<number>} indices - List of indices.
   * @param {Array.<Array.<number>>} vertices - List of 2D points.
   *
   * @returns {Array.<Array.<number>>} - List of sorted indices.
   */
  static sortPointsCCW(indices, vertices) {
    const centroid = [0, 0];
    indices.forEach(index => {
      centroid[0] += vertices[index][0];
      centroid[1] += vertices[index][1];
    });
    centroid[0] /= indices.length;
    centroid[1] /= indices.length;

    indices.sort((a, b) => {
      const bVal = Math.atan2(
        vertices[b][1] - centroid[1],
        vertices[b][0] - centroid[0]
      );
      const aVal = Math.atan2(
        vertices[a][1] - centroid[1],
        vertices[a][0] - centroid[0]
      );

      return aVal - bVal;
    });

    return indices;
  }

  /**
   * Cacluates the area of a triangle
   * @param {Array.<number>} a - First triangle point.
   * @param {Array.<number>} b - Second triangle point.
   * @param {Array.<number>} c - Third triangle point.
   *
   * @returns {number}
   */
  static triangleArea(a, b, c) {
    return Math.abs(
      (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1])) * 0.5
    );
  }

  /**
   * Return the magnitude of a given vector array.
   *
   * @param {Array.<number>} vector - Array consisting of numbers.
   *
   * @returns {number}
   */
  static getVectorMagnitude(vector) {
    if (!(vector instanceof Array)) {
      throw new Error(
        `Cannot get magnitude for vector ${vector}. Input must be an Array numbers.`
      );
    }

    const reducer = (accumulator, currentValue) => {
      if (typeof currentValue !== 'number') {
        throw new Error(
          `Cannot get magnitude for vector ${vector}. All items in the input Array must be numbers.`
        );
      }

      return accumulator + currentValue ** 2;
    };

    return Math.sqrt(vector.reduce(reducer, 0));
  }

  /**
   * Return the dot product between two vectors.
   *
   * @param {Array.<number>} vectorA - Array consisting of numbers.
   * @param {Array.<number>} vectorB - Array consisting of numbers.
   *
   * @returns {number}
   */
  static getDotProduct(vectorA, vectorB) {
    if (
      !(vectorA instanceof Array) ||
      !(vectorB instanceof Array) ||
      vectorA.length !== vectorB.length
    ) {
      throw new Error(
        `Cannot get dot product between ${vectorA} and ${vectorB}. Inputs must be vectors of the same length.`
      );
    }

    let result = 0;
    vectorA.forEach((valueA, index) => {
      const valueB = vectorB[index];

      if (typeof valueA !== 'number' || typeof valueB !== 'number') {
        throw new Error(
          `Cannot get dot product between ${vectorA} and ${vectorB}. Vectors must only consist of numeric values.`
        );
      }

      result += valueA * valueB;
    });

    return result;
  }

  /**
   * Return the angle in radians between vectorA and vectorB.
   *
   * @param {Array.<number>} vectorA - Array consisting of numbers.
   * @param {Array.<number>} vectorB - Array consisting of numbers.
   *
   * @returns {number}
   */
  static getAngleBetween(vectorA, vectorB) {
    const normalA = this.normalizeVector([...vectorA]);
    const normalB = this.normalizeVector([...vectorB]);
    const dot = this.getDotProduct(normalA, normalB);

    return Math.acos(this.clamp(dot, -1, 1));
  }

  /**
   * Multiply a 3x3 rotation matrix with a vector3.
   *
   * @param {Array.<number>} vector3 - Array consisting of 3 numbers representing
   * a direction vector.
   * @param {Array.<number>} matrix3 - An array of 9 numbers representing a row
   * major rotation matrix.
   *
   * @returns {Array.<number>} - An array of 3 numbers representing the new direction
   * of the vector.
   */
  static rotateVector(vector3, matrix3) {
    if (
      !(vector3 instanceof Array) ||
      vector3.length !== 3 ||
      !vector3.every(v => typeof v === 'number')
    ) {
      throw new Error(
        `Cannot rotate vector ${vector3} by rotation matrix ${matrix3}. Input vector must be an array of 3 numbers.`
      );
    }

    if (
      !(matrix3 instanceof Array) ||
      matrix3.length !== 9 ||
      !matrix3.every(v => typeof v === 'number')
    ) {
      throw new Error(
        `Cannot rotate vector ${vector3} by rotation matrix ${matrix3}. Input matrix3 must be an array of 9 numbers.`
      );
    }

    const x =
      matrix3[0] * vector3[0] +
      matrix3[3] * vector3[1] +
      matrix3[6] * vector3[2];
    const y =
      matrix3[1] * vector3[0] +
      matrix3[4] * vector3[1] +
      matrix3[7] * vector3[2];
    const z =
      matrix3[2] * vector3[0] +
      matrix3[5] * vector3[1] +
      matrix3[8] * vector3[2];

    return [x, y, z];
  }

  /**
   * Normalize a given vector array.
   *
   * @param {Array.<number>} vector - Array consisting of numbers.
   *
   * @returns {Array.<number>} The original vector with normalized values, for chaining.
   */
  static normalizeVector(vector) {
    const magnitude = this.getVectorMagnitude(vector);

    if (magnitude === 0) {
      vector.fill(0);
    } else {
      vector.forEach((value, index) => {
        vector[index] = value / magnitude;
      });
    }

    return vector;
  }

  /**
   * Extract the 3x3 rotation matrix from a given 4x4 transformation matrix.
   *
   * @param {Array.<number>} matrix4 - An array of 16 numbers representing a row
   * major transformation matrix.
   *
   * @returns {Array.<number>} - An array of 9 numbers representing a row major
   * rotation matrix.
   */
  static getRotationMatrix(matrix4) {
    if (
      !(matrix4 instanceof Array) ||
      matrix4.length !== 16 ||
      !matrix4.every(v => typeof v === 'number')
    ) {
      throw new Error(
        `Cannot convert matrix ${matrix4} to a rotation matrix. Input matrix must be an array of 16 numbers.`
      );
    }

    // Extract scale
    const scaleX = 1 / (this.getVectorMagnitude(matrix4.slice(0, 4)) || 1);
    const scaleY = 1 / (this.getVectorMagnitude(matrix4.slice(4, 8)) || 1);
    const scaleZ = 1 / (this.getVectorMagnitude(matrix4.slice(8, 12)) || 1);

    return [
      matrix4[0] * scaleX,
      matrix4[1] * scaleX,
      matrix4[2] * scaleX,
      matrix4[4] * scaleY,
      matrix4[5] * scaleY,
      matrix4[6] * scaleY,
      matrix4[8] * scaleZ,
      matrix4[9] * scaleZ,
      matrix4[10] * scaleZ,
    ];
  }

  /**
   * Return an array containing the spherical coordinates of the given cartesian
   * xyz coordinates.
   *
   * @private
   *
   * @param {number} x - Position along the x axis.
   * @param {number} y - Position along the y axis.
   * @param {number} z - Position along the z axis.
   *
   * @returns {Array.<number>} - An array consisting of three numberes where index
   * 0 represents the radius, index 1 represents the vertical/polar angle in radians
   * and index 2 represents the horizontal/azimuthal angle in radians.
   */
  static cartesianToSpherical(x, y, z) {
    const r = this.getVectorMagnitude([x, y, z]);

    // Return identity if the vector has no length
    if (r === 0) {
      return [0, 0, 0];
    }

    return [r, Math.acos(this.clamp(y / r, -1, 1)), Math.atan2(x, z)];
  }

  /**
   * Gradually change a value of a numeric property towards a goal over time using
   * a critically damped spring function.
   *
   * @param {number} currentValue - The starting value.
   * @param {number} targetValue- The goal value.
   * @param {Array.<number>} [valueStore = [0, 0]] - An Array consisting of two
   * numbers where the first number holds the result value and the second holds
   * the velocity that resulted in that value. The same array should be provided
   * with each call to this function.
   * @param {number} [deltaTime = 1e-7] - The time since the last call to this function
   * in seconds.
   * @param {number} [smoothTime = 0.3] - The approximate amount of time in seconds
   * it should take to reach the target value.
   * @param {number} [maxSpeed = 1e7] - A clamping value for the maximum speed the
   * value can change.
   *
   * @returns {Array.<number>} - The valueStore array.
   */
  static dampValue(
    currentValue,
    targetValue,
    valueStore = [0, 0],
    deltaTime = 1e-7,
    smoothTime = 0.3,
    maxSpeed = 1e7
  ) {
    smoothTime = Math.max(0.0001, smoothTime);
    deltaTime = Math.max(1e-7, deltaTime);

    // Find the delta between values and use it to estimate the previous value
    const clampTime = maxSpeed * smoothTime;
    const deltaValue = currentValue - targetValue;
    const clampDeltaValue = this.clamp(deltaValue, -clampTime, clampTime);
    const lastValue = currentValue - clampDeltaValue;

    // Calculate damping factors
    const d1 = 2 / smoothTime;
    const d2 = d1 * deltaTime;
    const d3 = 1 / (1 + d2 + 0.5 * d2 ** 2 + 0.25 * d2 ** 3);
    const d4 = (valueStore[1] + d1 * clampDeltaValue) * deltaTime;

    // Damp the target value and update the velocity
    valueStore[0] = lastValue + (clampDeltaValue + d4) * d3;
    valueStore[1] = (valueStore[1] - d1 * d4) * d3;

    // Prevent overshooting
    if (targetValue - currentValue > 0 === valueStore[0] > targetValue) {
      valueStore[0] = targetValue;
      valueStore[1] = (valueStore[0] - targetValue) / deltaTime;
    }

    return valueStore;
  }
}

export default MathUtils;
