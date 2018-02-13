var gl;
var program;

function init() {
  var canvas = document.getElementById('glCanvas');
  gl = canvas.getContext('webgl');

  if (!gl) {
    console.log('WebGL not supported, falling back on experimental-webgl');
    gl = canvas.getContext('experimental-webgl');
  }

  if (!gl) {
    alert('Your browser does not support WebGL');
  }
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
  // look up the location of the attributes for the program we just created
  var positionAttribLocation = gl.getAttribLocation(program, 'vertPosition');
  var colorAttribLocation = gl.getAttribLocation(program, 'vertColor');

  // Positions are given in a counter clockwise order
  // JS float are 64bits, they will need to be converted later to Float32
  var positions =
  [ // X, Y,        R, G, B
     0.0,  0.5,   1.0, 0.9, 0.0,
    -0.5, -0.5,   0.0, 0.8, 0.7,
     0.5, -0.5,   0.6, 0.0, 0.5
  ];

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW); // Automatically finds the latest bound buffer

  // Tell the attributes how to get data out of positionBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(
    positionAttribLocation, // Attribute location
    2, // Number of elements per attribute
    gl.FLOAT, // Type of elements
    gl.FALSE, // Don't normalize the data
    5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    0 // Offset from the beginning of a single vertex to this attribute
  );
  gl.vertexAttribPointer(
    colorAttribLocation, // Attribute location
    3, // Number of elements per attribute
    gl.FLOAT, // Type of elements
    gl.FALSE, // Don't normalize the data
    5 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
    2 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
  );

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.enableVertexAttribArray(colorAttribLocation);

}

function draw() {
  // First step is to clear the canvas with a given color
  gl.clearColor(0.1, 0.2, 0.3, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  // gl.TRIANGLES is the primitive type, could be points or lines among other examples
}

init();
createShaders();
createBuffers();
draw();
