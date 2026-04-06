// Subhangi Chatterjee
// schatt16

// asg0.js - Assignment 0: Vector Library

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('example');
  if (!canvas) {
    console.log('Failed to retrieve the <canvas> element');
    return false;
  }

  // Get the rendering context for 2DCG
  var ctx = canvas.getContext('2d');

  // Fill the canvas with black
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw a default red vector v1 = (2.25, 2.25)
  var v1 = new Vector3([2.25, 2.25, 0.0]);
  drawVector(v1, "red"); //Call drawVector(v1, "red") in the main() function
}

/**
 * Draws a vector on the canvas from the center.
 * @param {Vector3} v - The vector to draw
 * @param {string} color - The color of the vector (e.g. "red", "blue")
 */
function drawVector(v, color) {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');

  // Center of the canvas
  var cx = canvas.width / 2;
  var cy = canvas.height / 2;

  // Scale factor: multiply coordinates by 20 for visibility
  var scale = 20;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  // Note: canvas y-axis is inverted, so we subtract the y component
  ctx.lineTo(cx + v.elements[0] * scale, cy - v.elements[1] * scale);
  ctx.stroke();
}

/**
 * Clears the canvas to black.
 */
function clearCanvas() {
  var canvas = document.getElementById('example');
  var ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Called when the user clicks the first "Draw" button.
 * Reads v1 and v2 from the input fields and draws them.
 */
function handleDrawEvent() {
  // Clear the canvas
  clearCanvas();

  // Read v1
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  // creating a 2D vector with x1 and y1. 
  var v1 = new Vector3([x1, y1, 0.0]);

  // Draw v1 in red
  drawVector(v1, "red");

  // Read v2
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0.0]);

  // Draw v2 in blue
  drawVector(v2, "blue");
}

/**
 * Computes the angle (in degrees) between two vectors using the dot product.
 * dot(v1, v2) = ||v1|| * ||v2|| * cos(alpha)
 */
function angleBetween(v1, v2) {
  var d = Vector3.dot(v1, v2);
  var mag1 = v1.magnitude();
  var mag2 = v2.magnitude();

  if (mag1 === 0 || mag2 === 0) {
    console.log("Cannot compute angle: one of the vectors has zero magnitude.");
    return;
  }

  var cosAlpha = d / (mag1 * mag2);
  // Clamp to [-1, 1] to avoid NaN from floating point errors
  cosAlpha = Math.max(-1, Math.min(1, cosAlpha));
  var alpha = Math.acos(cosAlpha);
  // Convert radians to degrees
  return alpha * (180.0 / Math.PI);
}

/**
 * Computes the area of the triangle formed by vectors v1 and v2.
 * Area = 0.5 * ||v1 x v2||
 */
function areaTriangle(v1, v2) {
  var crossVec = Vector3.cross(v1, v2);
  var areaPar = crossVec.magnitude();
  return areaPar / 2.0;
}

/**
 * Called when the user clicks the second "Draw" button (operation button).
 * Reads v1, v2, the selected operation, and the scalar, then performs the operation.
 */
function handleDrawOperationEvent() {
  // Clear the canvas
  clearCanvas();

  // Read v1
  var x1 = parseFloat(document.getElementById('v1x').value);
  var y1 = parseFloat(document.getElementById('v1y').value);
  var v1 = new Vector3([x1, y1, 0.0]);

  // Read v2
  var x2 = parseFloat(document.getElementById('v2x').value);
  var y2 = parseFloat(document.getElementById('v2y').value);
  var v2 = new Vector3([x2, y2, 0.0]);

  // Draw v1 in red and v2 in blue
  drawVector(v1, "red");
  drawVector(v2, "blue");

  // Read operation and scalar
  var op = document.getElementById('op-select').value;
  var scalar = parseFloat(document.getElementById('scalar').value);

  switch (op) {
    case 'add': {
      // v3 = v1 + v2
      var v3 = new Vector3([x1, y1, 0.0]);
      v3.add(v2);
      drawVector(v3, "green");
      break;
    }
    case 'sub': {
      // v3 = v1 - v2
      var v3 = new Vector3([x1, y1, 0.0]);
      v3.sub(v2);
      drawVector(v3, "green");
      break;
    }
    case 'mul': {
      // v3 = v1 * scalar, v4 = v2 * scalar
      var v3 = new Vector3([x1, y1, 0.0]);
      v3.mul(scalar);
      var v4 = new Vector3([x2, y2, 0.0]);
      v4.mul(scalar);
      drawVector(v3, "green");
      drawVector(v4, "green");
      break;
    }
    case 'div': {
      // v3 = v1 / scalar, v4 = v2 / scalar
      if (scalar === 0) {
        console.log("Cannot divide by zero.");
        break;
      }
      var v3 = new Vector3([x1, y1, 0.0]);
      v3.div(scalar);
      var v4 = new Vector3([x2, y2, 0.0]);
      v4.div(scalar);
      drawVector(v3, "green");
      drawVector(v4, "green");
      break;
    }
    case 'magnitude': {
      console.log("Magnitude v1: " + v1.magnitude());
      console.log("Magnitude v2: " + v2.magnitude());
      break;
    }
    case 'normalize': {
      var v3 = new Vector3([x1, y1, 0.0]);
      v3.normalize();
      var v4 = new Vector3([x2, y2, 0.0]);
      v4.normalize();
      drawVector(v3, "green");
      drawVector(v4, "green");
      break;
    }
    case 'angle': {
      var angle = angleBetween(v1, v2);
      console.log("Angle: " + angle);
      break;
    }
    case 'area': {
      var area = areaTriangle(v1, v2);
      console.log("Area of the triangle: " + area);
      break;
    }
  }
}
