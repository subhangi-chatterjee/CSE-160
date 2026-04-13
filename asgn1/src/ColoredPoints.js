var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

const POINT =0;
const TRIANGLE= 1;
const CIRCLE = 2;

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5;
let g_selectedSegments = 10;
let g_shapesList = [];
let g_selectedType = POINT;
let g_showPicture = false;

function setupWebGl() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
}

function connectVariablestoGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUiI() {
  // document.getElementById('green').onclick = function() {g_selectedColor = [0.0, 1.0, 0.0, 1.0];};
  // document.getElementById('red').onclick = function() {g_selectedColor = [1.0, 0.0, 0.0, 1.0];};
  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    g_showPicture = false;
    renderAllshapes();
  };
  document.getElementById('pictureButton').onclick = function() {
    g_showPicture = true;
    renderAllshapes();
  };

  document.getElementById('pointButton').onclick = function() { g_selectedType = POINT};
  document.getElementById('triButton').onclick = function() { g_selectedType = TRIANGLE};
  document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE};

  document.getElementById('redSlide').addEventListener('mouseup', function() {
    g_selectedColor[0] = this.value / 100;
  });

  document.getElementById('greenSlide').addEventListener('mouseup', function() {
    g_selectedColor[1] = this.value / 100;
  });

  document.getElementById('blueSlide').addEventListener('mouseup', function() {
    g_selectedColor[2] = this.value / 100;
  });

  document.getElementById('sizeSlide').addEventListener('mouseup', function() {
    g_selectedSize = this.value;
  });

  document.getElementById('segmentSlide').addEventListener('mouseup', function() {
    g_selectedSegments = Number(this.value);
  });

  
}

function main() {
  setupWebGl();
  connectVariablestoGLSL();
  addActionsForHtmlUiI();

  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

function click(ev) {
  let [x, y] = convertCoordinatesEventoGL(ev);

  //let point = new Point();
  let point;
  if(g_selectedType == POINT){
    point = new Point();
  } else if (g_selectedType == TRIANGLE) {
    point = new Triangle();
  } else {
    point = new Circle();
  }

  point.position = [x, y, 0.0];
  point.color = g_selectedColor.slice();
  point.size = g_selectedSize;
  if (g_selectedType == CIRCLE) {
    point.segments = g_selectedSegments;
  }
  g_shapesList.push(point);

  renderAllshapes();
}

function convertCoordinatesEventoGL(ev) {
  var x = ev.clientX;
  var y = ev.clientY;
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);
  return [x, y];
}

function renderAllshapes() {
  var startTime = performance.now();

  gl.clear(gl.COLOR_BUFFER_BIT);

  if (g_showPicture) {
    renderPicture();
  }

  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML(
    "numdot: " + len + " ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration) / 10,
    "numdot"
  );
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log("Failed to get " + htmlID + " from HTML");
    return;
  }
  htmlElm.innerHTML = text;
}

function drawColoredTriangle(vertices, rgba) {
  gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
  drawTriangle(vertices);
}

function renderPicture() {
  const skyColor = [0.60, 0.84, 0.98, 1.0];
  const grassColor = [0.30, 0.70, 0.28, 1.0];
  const sunColor = [1.00, 0.86, 0.20, 1.0];
  const mountainDark = [0.42, 0.43, 0.55, 1.0];
  const mountainLight = [0.55, 0.56, 0.68, 1.0];
  const houseWall = [0.91, 0.77, 0.58, 1.0];
  const roofColor = [0.62, 0.20, 0.18, 1.0];
  const doorColor = [0.40, 0.24, 0.12, 1.0];
  const windowColor = [0.76, 0.90, 0.98, 1.0];
  const trunkColor = [0.43, 0.27, 0.10, 1.0];
  const leafColor = [0.13, 0.52, 0.21, 1.0];

  const pictureTriangles = [
    { color: skyColor, vertices: [-1.0, 1.0, -1.0, -0.1, 1.0, 1.0] },
    { color: skyColor, vertices: [1.0, 1.0, -1.0, -0.1, 1.0, -0.1] },
    { color: grassColor, vertices: [-1.0, -0.1, -1.0, -1.0, 1.0, -0.1] },
    { color: grassColor, vertices: [1.0, -0.1, -1.0, -1.0, 1.0, -1.0] },

    { color: sunColor, vertices: [0.55, 0.88, 0.42, 0.72, 0.68, 0.72] },
    { color: sunColor, vertices: [0.55, 0.56, 0.42, 0.72, 0.68, 0.72] },
    { color: sunColor, vertices: [0.39, 0.64, 0.55, 0.56, 0.42, 0.72] },
    { color: sunColor, vertices: [0.71, 0.64, 0.55, 0.56, 0.68, 0.72] },

    { color: mountainDark, vertices: [-0.95, -0.1, -0.50, 0.52, -0.10, -0.1] },
    { color: mountainLight, vertices: [-0.58, 0.24, -0.50, 0.52, -0.34, 0.12] },
    { color: mountainLight, vertices: [-0.32, -0.1, 0.10, 0.45, 0.42, -0.1] },
    { color: mountainDark, vertices: [0.10, -0.1, 0.48, 0.58, 0.95, -0.1] },

    { color: houseWall, vertices: [-0.28, -0.18, -0.28, -0.70, 0.26, -0.18] },
    { color: houseWall, vertices: [0.26, -0.18, -0.28, -0.70, 0.26, -0.70] },
    { color: roofColor, vertices: [-0.34, -0.18, -0.01, 0.16, 0.32, -0.18] },
    { color: roofColor, vertices: [-0.02, 0.24, -0.10, 0.10, 0.06, 0.10] },

    { color: doorColor, vertices: [-0.06, -0.40, -0.06, -0.70, 0.06, -0.40] },
    { color: doorColor, vertices: [0.06, -0.40, -0.06, -0.70, 0.06, -0.70] },

    { color: windowColor, vertices: [-0.23, -0.28, -0.23, -0.46, -0.09, -0.28] },
    { color: windowColor, vertices: [-0.09, -0.28, -0.23, -0.46, -0.09, -0.46] },
    { color: windowColor, vertices: [0.09, -0.28, 0.09, -0.46, 0.23, -0.28] },
    { color: windowColor, vertices: [0.23, -0.28, 0.09, -0.46, 0.23, -0.46] },

    { color: trunkColor, vertices: [0.62, -0.24, 0.62, -0.70, 0.74, -0.24] },
    { color: trunkColor, vertices: [0.74, -0.24, 0.62, -0.70, 0.74, -0.70] },
    { color: leafColor, vertices: [0.68, 0.10, 0.48, -0.24, 0.88, -0.24] },
    { color: leafColor, vertices: [0.68, 0.34, 0.52, 0.00, 0.84, 0.00] },
    { color: leafColor, vertices: [0.56, 0.00, 0.48, -0.24, 0.68, -0.14] },
    { color: leafColor, vertices: [0.80, 0.00, 0.68, -0.14, 0.88, -0.24] }
  ];

  for (let i = 0; i < pictureTriangles.length; i++) {
    const triangle = pictureTriangles[i];
    drawColoredTriangle(triangle.vertices, triangle.color);
  }
}
