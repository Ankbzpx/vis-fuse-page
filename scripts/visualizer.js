import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Pane } from "tweakpane";

const light_data = [
  [
    [0.865754, 0.880196, 0.947154],
    [-0.205633, -0.211215, -0.250504],
    [0.349584, 0.365084, 0.463253],
    [-0.0789622, -0.0750734, -0.091405],
    [0.077691, 0.0810771, 0.0922284],
    [-0.402685, -0.40834, -0.462763],
    [0.328907, 0.328656, 0.370725],
    [-0.131815, -0.140992, -0.158298],
    [-0.0992293, -0.0983686, -0.107975],
  ],
  [
    [1.90437, 1.07481, 0.857633],
    [-0.0331074, -0.0478128, -0.0296945],
    [0.766105, 0.294044, 0.191198],
    [0.231872, 0.122125, 0.0905467],
    [0.0123723, -0.0041153, -0.00260202],
    [-0.028598, -0.0379158, -0.0262766],
    [0.0938688, 0.0643945, 0.0726383],
    [0.101804, -0.00522616, -0.0082345],
    [-0.272241, -0.111701, -0.0635506],
  ],
  [
    [0.941012, 0.934079, 0.922621],
    [0.27147, 0.249407, 0.184535],
    [0.224825, 0.232201, 0.25785],
    [0.295623, 0.271244, 0.200348],
    [0.398634, 0.370312, 0.28953],
    [0.211437, 0.196382, 0.149764],
    [-0.157615, -0.139511, -0.0819072],
    [0.213564, 0.19918, 0.153739],
    [0.0568231, 0.053088, 0.0474619],
  ],
  [
    [1.16273, 1.12557, 1.29516],
    [0.23754, 0.121926, 0.0586194],
    [0.19915, 0.263936, 0.43702],
    [0.381448, 0.252011, 0.200875],
    [0.299434, 0.151388, 0.0883712],
    [0.0996847, 0.0602041, 0.0310203],
    [-0.265275, -0.131498, -0.0271039],
    [0.149834, 0.107542, 0.0891161],
    [0.109078, 0.0394395, -0.0010838],
  ],
  [
    [1.04193, 0.844106, 0.603002],
    [0.549836, 0.321299, 0.048695],
    [0.0645036, 0.0496089, 0.0303306],
    [0.421742, 0.248284, 0.0405856],
    [0.726357, 0.416303, 0.0488588],
    [0.0930457, 0.0572625, 0.0129239],
    [-0.474425, -0.29132, -0.0699404],
    [0.0739008, 0.0469059, 0.0124285],
    [-0.186023, -0.096926, 0.00490653],
  ],
];

let light_shs = [];
for (let i = 0; i < light_data.length; i++) {
  let sh = [];
  for (let j = 0; j < light_data[i].length; j++) {
    sh[j] = new THREE.Vector3(
      light_data[i][j][0],
      light_data[i][j][1],
      light_data[i][j][2],
    );
  }
  light_shs[i] = sh;
}

const model_list = ["0277", "0309", "141311548775566", "141511558561737"];

// https://stackoverflow.com/questions/10214873/make-canvas-as-wide-and-as-high-as-parent
function fitToContainer(canvas) {
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}

const canvas = document.getElementById("visCanvas");
fitToContainer(canvas);

const camera = new THREE.PerspectiveCamera(
  75,
  canvas.width / canvas.height,
  0.1,
  1000,
);
camera.position.z = 0.7;
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(canvas.width, canvas.height);
renderer.setClearColor(0x777777, 1);

window.addEventListener(
  "resize",
  () => {
    fitToContainer(canvas);
    camera.aspect = canvas.width / canvas.height;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.width, canvas.height);
  },
  false,
);

const scene = new THREE.Scene();

const orbit_controls = new OrbitControls(camera, renderer.domElement);
orbit_controls.enablePan = false;
orbit_controls.minPolarAngle = Math.PI / 2;
orbit_controls.maxPolarAngle = Math.PI / 2;
orbit_controls.maxDistance = 0.7;
orbit_controls.minDistance = 0.7;

let render_light = false;
let current_sh_idx = 0;
let current_model = "0277";
let sh_rot_x = 0;
let sh_rot_y = 0;
let sh_rot_z = 0;

const light_material = new THREE.ShaderMaterial({
  uniforms: {
    R_sh: { value: new THREE.Matrix3() },
    env_sh: { value: light_shs[current_sh_idx] },
  },
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: document.getElementById("fragmentShaderLight").textContent,
  vertexColors: true,
});

const color_material = new THREE.ShaderMaterial({
  uniforms: {
    R_sh: { value: new THREE.Matrix3() },
    env_sh: { value: light_shs[current_sh_idx] },
  },
  vertexShader: document.getElementById("vertexShader").textContent,
  fragmentShader: document.getElementById("fragmentShaderColor").textContent,
  vertexColors: true,
});

async function load_model(model_name) {
  let promises = [
    fetch(`${model_name}_V.json`).then((response) => response.json()),
    fetch(`${model_name}_F.json`).then((response) => response.json()),
    fetch(`${model_name}_VC.json`).then((response) => response.json()),
    fetch(`${model_name}_prt1.json`).then((response) => response.json()),
    fetch(`${model_name}_prt2.json`).then((response) => response.json()),
    fetch(`${model_name}_prt3.json`).then((response) => response.json()),
  ];

  const data = await Promise.all(promises);

  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(data[0]);
  const vertex_colors = new Float32Array(data[2]);
  const prts_1 = new Float32Array(data[3]);
  const prts_2 = new Float32Array(data[4]);
  const prts_3 = new Float32Array(data[5]);

  geometry.setIndex(data[1]);
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(vertex_colors, 3));
  geometry.setAttribute("prt1", new THREE.BufferAttribute(prts_1, 3));
  geometry.setAttribute("prt2", new THREE.BufferAttribute(prts_2, 3));
  geometry.setAttribute("prt3", new THREE.BufferAttribute(prts_3, 3));

  const mesh = new THREE.Mesh(
    geometry,
    render_light ? light_material : color_material,
  );
  mesh.name = "mesh";
  scene.add(mesh);
}

function update_sh_rot() {
  let rot_matrix = new THREE.Matrix3().setFromMatrix4(
    new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(sh_rot_x, sh_rot_y, sh_rot_z),
    ),
  );
  color_material.uniforms.R_sh.value = rot_matrix;
  light_material.uniforms.R_sh.value = rot_matrix;
}

load_model(current_model);

function animate() {
  requestAnimationFrame(animate);
  orbit_controls.update();
  renderer.render(scene, camera);
}

const pane = new Pane({
  title: "Panel",
  container: document.getElementById("gui_container"),
});

pane
  .addBlade({
    view: "list",
    label: "models",
    options: [
      { text: "sample 1", value: model_list[0] },
      { text: "sample 2", value: model_list[1] },
      { text: "sample 3", value: model_list[2] },
      { text: "sample 4", value: model_list[3] },
    ],
    value: model_list[0],
  })
  .on("change", (ev) => {
    scene.remove(scene.getObjectByName("mesh"));
    current_model = ev.value;
    load_model(current_model);
  });

pane
  .addBlade({
    view: "list",
    label: "lights",
    options: [
      { text: "light 1", value: 0 },
      { text: "light 2", value: 1 },
      { text: "light 3", value: 2 },
      { text: "light 4", value: 3 },
      { text: "light 5", value: 4 },
    ],
    value: 0,
  })
  .on("change", (ev) => {
    current_sh_idx = ev.value;
    color_material.uniforms.env_sh.value = light_shs[current_sh_idx];
    light_material.uniforms.env_sh.value = light_shs[current_sh_idx];
  });

pane
  .addInput(
    {
      light_color: false,
    },
    "light_color",
  )
  .on("change", (ev) => {
    render_light = ev.value;
    if (render_light) {
      scene.getObjectByName("mesh").material = light_material;
    } else {
      scene.getObjectByName("mesh").material = color_material;
    }
  });

pane
  .addInput(
    {
      x: 0,
    },
    "x",
    {
      min: 0,
      max: 360,
    },
  )
  .on("change", (ev) => {
    sh_rot_x = (ev.value / 180) * Math.PI;
    update_sh_rot();
  });

pane
  .addInput(
    {
      y: 0,
    },
    "y",
    {
      min: 0,
      max: 360,
    },
  )
  .on("change", (ev) => {
    sh_rot_y = (ev.value / 180) * Math.PI;
    update_sh_rot();
  });

pane
  .addInput(
    {
      z: 0,
    },
    "z",
    {
      min: 0,
      max: 360,
    },
  )
  .on("change", (ev) => {
    sh_rot_z = (ev.value / 180) * Math.PI;
    update_sh_rot();
  });

animate();
