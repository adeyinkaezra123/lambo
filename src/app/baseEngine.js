import * as THREE from "three";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper";
import Stats from "three/examples/jsm/libs/stats.module";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib";
import { MathUtils } from "./utilities";
import { EXR_FILE, EXR_PATH } from "./config";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader";

//Whether to show fps counter or not
const IS_DEBUG = true;

//Scene background color
const SCENE_COLOR = 0x000000;

//Area Light Dimension
const LIGHT_SIZE = new THREE.Vector2(12, 6);
//Area Light Intensity
const LIGHT_INTENSITY = 8;
//Area Light Color
const LIGHT_COLOR = 0xffffff;

const LIGHT_POS_LEFT = new THREE.Vector3(0, 16, -18);
const LIGHT_ROTATION_LEFT = MathUtils.vector3DegToRadian({
  x: -135,
  y: 0,
  z: -180,
});
//Area Light - Right
const LIGHT_POS_RIGHT = new THREE.Vector3(0, 16, 18);
const LIGHT_ROTATION_RIGHT = MathUtils.vector3DegToRadian({
  x: -45,
  y: 0,
  z: 0,
});

//------------------------------------------------------------ PRIVATE HELPER METHODS ------------------------------------------------------------

//Create an AreaLight with Helper
const createAreaLight = (color, intensity, size, visible) => {
  //Create an area light with parameters
  var rectLight = new THREE.RectAreaLight(color, intensity, size.x, size.y);

  //Create a light helper if set to visible
  if (visible) {
    const rectHelper = new RectAreaLightHelper(rectLight, 0xffffff);
    rectLight.add(rectHelper);
  }

  //Return the resultant light object
  return rectLight;
};

//------------------------------------------------------------ ENGINE ABSTRACT CLASS ------------------------------------------------------------

export default class BaseEngine {
  constructor() {
    RectAreaLightUniformsLib.init();

    //Create engine renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      logarithmicDepthBuffer: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(SCENE_COLOR, 1);
    this.renderer.sortObjects = false;
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    document.body.appendChild(this.renderer.domElement);

    // Create a root scene
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(SCENE_COLOR, 30, 100);

    // Create a Left Light
    const mLeftLight = createAreaLight(
      LIGHT_COLOR,
      LIGHT_INTENSITY,
      LIGHT_SIZE,
      IS_DEBUG
    );
    mLeftLight.position.copy(LIGHT_POS_LEFT);
    mLeftLight.rotation.copy(LIGHT_ROTATION_LEFT);
    this.scene.add(mLeftLight);

    //Add a Right Light
    const mRightLight = createAreaLight(
      LIGHT_COLOR,
      LIGHT_INTENSITY,
      LIGHT_SIZE,
      IS_DEBUG
    );
    mRightLight.position.copy(LIGHT_POS_RIGHT);
    mRightLight.rotation.copy(LIGHT_ROTATION_RIGHT);
    this.scene.add(mRightLight);

    // Create a loading manager
    this.manager = new THREE.LoadingManager();

    //Pre-Filtered, Mipmapped Radiance Environment Generator
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    //Precompile to use equirectangular shader to support equirectangular HDR maps
    pmremGenerator.compileEquirectangularShader();

    //Create an RGBE Loader to handle PBR Rendering
    new THREE.TextureLoader(this.manager)
      .setPath(EXR_PATH)
      .load("/scifi_monochrome_lights_empty_large.jpg", (envMap) => {
        envMap.mapping = THREE.EquirectangularReflectionMapping;
        envMap.colorSpace = THREE.SRGBColorSpace;

        this.scene.environment = envMap;
        this.scene.background = envMap;
        envMap.dispose();
      });

    // new EXRLoader(this.manager).setPath(EXR_PATH).load(EXR_FILE, (exr) => {
    //   //Generate environment CubeMap from HDR texture
    //   const envMap = pmremGenerator.fromEquirectangular(exr).texture;

    //   //Set scene environment to use generated CubeMap for PBR lighting
    //   this.scene.environment = envMap;
    //   this.scene.background = envMap;

    //   //Cleanup EXR HDR texture and helper
    //   exr.dispose();
    //   pmremGenerator.dispose();
    // });

    //If FPS enabled, add the stats profile
    if (IS_DEBUG) {
      //Create new profiler object
      this.profiler = Stats();
      //Append profiler to body context
      document.body.appendChild(this.profiler.dom);
    }
  }
  //Update method
  update() {
    //Update profiler if enabled

    if (IS_DEBUG && this.profiler) this.profiler.update();
  }
}
