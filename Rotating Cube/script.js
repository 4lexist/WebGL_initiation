var gl;
var program;
var canvas;
var nbIndices;

function init() {
  canvas = document.getElementById('glCanvas');
  gl = canvas.getContext('webgl');

  if (!gl) {
    console.log('WebGL not supported, falling back on experimental-webgl');
    gl = canvas.getContext('experimental-webgl');
  }

  if (!gl) {
    alert('Your browser does not support WebGL');
  }

  gl.clearColor(0.1, 0.2, 0.3, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // If several pixels are drawn on the same place, keep the one closer to the camera
  gl.enable(gl.DEPTH_TEST);

  // Discards calculations for triangles that are not visible
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW); // Counter ClockWise
  gl.cullFace(gl.BACK);
}

// Vertex shader provides the clipspace coordinates
// Fragment shader provides the color
function createShaders() {
  var vertexShaderText = document.getElementById('2d-vertex-shader').text;
  var fragmentShaderText = document.getElementById('2d-fragment-shader').text;

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  // Giving them source so gl can know which one is vertex and which one is fragment
  gl.shaderSource(vertexShader, vertexShaderText);
  gl.shaderSource(fragmentShader, fragmentShaderText);

  // Compilation
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);

  // Tests to explicit the errors that might happen and
  // that would not be raised otherwise
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
    return;
  }

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
    return;
  }

  // Kind of as in C, after compilation comes linking
  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.validateProgram(program);

  // Tests again for errors that would be silent otherwise
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('ERROR linking program!', gl.getProgramInfoLog(program));
    return;
  }

  if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
    console.error('ERROR validating program!', gl.getProgramInfoLog(program));
    return;
  }
}

// Now that we have a GLSL program on the GPU, we need to supply data to it
// Theses programs are given attributes whose data come from buffers
function createBuffers() {
  // Tell OpenGL state machine which program should be active for the following actions.
  gl.useProgram(program);

  // Look up the location of the attributes for the program we just created
  var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
  var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

  var mViewUniformLocation = gl.getUniformLocation(program, 'mView');
  var mProjUniformLocation = gl.getUniformLocation(program, 'mProj');

  var randomColor1 = performance.now() % 1;
  var randomColor2 = (randomColor1 + 1/3) % 1;
  var randomColor3 = (randomColor1 + 2/3) % 1;

  // Positions are given in a counter clockwise order
  // JS float are 64bits, they will need to be converted later to Float32
  var cubeVertices =
  [ // X, Y, Z           R, G, B
    // Top
    -1.0, 1.0, -1.0,   randomColor1, randomColor2, randomColor3,
    -1.0, 1.0, 1.0,    randomColor1, randomColor2, randomColor3,
    1.0, 1.0, 1.0,     randomColor1, randomColor2, randomColor3,
    1.0, 1.0, -1.0,    randomColor1, randomColor2, randomColor3,

    // Left
    -1.0, 1.0, 1.0,    randomColor1, randomColor3, randomColor2,
    -1.0, -1.0, 1.0,   randomColor1, randomColor3, randomColor2,
    -1.0, -1.0, -1.0,  randomColor1, randomColor3, randomColor2,
    -1.0, 1.0, -1.0,   randomColor1, randomColor3, randomColor2,

    // Right
    1.0, 1.0, 1.0,    randomColor2, randomColor1, randomColor3,
    1.0, -1.0, 1.0,   randomColor2, randomColor1, randomColor3,
    1.0, -1.0, -1.0,  randomColor2, randomColor1, randomColor3,
    1.0, 1.0, -1.0,   randomColor2, randomColor1, randomColor3,

    // Front
    1.0, 1.0, 1.0,    randomColor2, randomColor3, randomColor1,
    1.0, -1.0, 1.0,   randomColor2, randomColor3, randomColor1,
    -1.0, -1.0, 1.0,  randomColor2, randomColor3, randomColor1,
    -1.0, 1.0, 1.0,   randomColor2, randomColor3, randomColor1,

    // Back
    1.0, 1.0, -1.0,     randomColor3, randomColor1, randomColor2,
    1.0, -1.0, -1.0,    randomColor3, randomColor1, randomColor2,
    -1.0, -1.0, -1.0,   randomColor3, randomColor1, randomColor2,
    -1.0, 1.0, -1.0,    randomColor3, randomColor1, randomColor2,

    // Bottom
    -1.0, -1.0, -1.0,   randomColor3, randomColor2, randomColor1,
    -1.0, -1.0, 1.0,    randomColor3, randomColor2, randomColor1,
    1.0, -1.0, 1.0,     randomColor3, randomColor2, randomColor1,
    1.0, -1.0, -1.0,    randomColor3, randomColor2, randomColor1
  ];

  // A cube face is composed of two triangles so 6 vertices, but some of them
  // are redundant since a square has only 4 vertices. Then we can give the
  // triangles an order of going through the vertices.
  // These indices will need to be converted to uInt 16 of bits
  var cubeIndices =
  [
    // Top
    0, 1, 2,
    0, 2, 3,

    // Left
    5, 4, 6,
    6, 4, 7,

    // Right
    8, 9, 10,
    8, 10, 11,

    // Front
    13, 12, 14,
    15, 14, 12,

    // Back
    16, 17, 18,
    16, 18, 19,

    // Bottom
    21, 20, 22,
    22, 20, 23
  ];
  nbIndices = cubeIndices.length;

  var cubeVertexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexBufferObject);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cubeVertices), gl.STATIC_DRAW);

  var cubeIndexBufferObject = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBufferObject);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices), gl.STATIC_DRAW);

  // Tell the attributes how to get data out of positionBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(
    positionAttribLocation, // Attribute location
    3, // Number of elements per attribute
    gl.FLOAT, // Type of elements
    gl.FALSE, // Don't normalize the data
    6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    0 // Offset from the beginning of a single vertex to this attribute
  );
  gl.vertexAttribPointer(
    colorAttribLocation, // Attribute location
    3, // Number of elements per attribute
    gl.FLOAT, // Type of elements
    gl.FALSE, // Don't normalize the data
    6 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
  );

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);

  var viewMatrix = new Float32Array(16);
  // (target matrix, position viewer, point looked at, up axis)
  mat4.lookAt(viewMatrix, [0, 0, -8], [0, 0, 0], [0, 1, 0]);
  gl.uniformMatrix4fv(mViewUniformLocation, gl.FALSE, viewMatrix);

  var projMatrix = new Float32Array(16);
  // (target matrix, field of view, aspect ratio, nearest point, farthest point)
  mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 1000.0);
  gl.uniformMatrix4fv(mProjUniformLocation, gl.FALSE, projMatrix);

}

function draw() {
  var mWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');

  var worldMatrix = new Float32Array(16);
  var xRotationMatrix = new Float32Array(16);
  var yRotationMatrix = new Float32Array(16);

  var identityMatrix = new Float32Array(16);
  mat4.identity(identityMatrix);

  var angle = 0;
  // Variable allocation is time consuming so we create them all before loop

  var loop = function () {
    angle = performance.now() / 1000 * 2 * Math.PI;
    mat4.rotate(yRotationMatrix, identityMatrix, angle / 7, [0, 1, 0]);
    mat4.rotate(xRotationMatrix, identityMatrix, angle / 8, [1, 0, 0]);
    mat4.mul(worldMatrix, yRotationMatrix, xRotationMatrix);
    gl.uniformMatrix4fv(mWorldUniformLocation, gl.FALSE, worldMatrix);

    gl.clearColor(0.1, 0.2, 0.3, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, nbIndices, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
};

init();
createShaders();
createBuffers();
draw();
