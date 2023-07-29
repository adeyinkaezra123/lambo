import BaseEngine from "./baseEngine";
import { CameraController } from "./cameraController";
import { ACTIVE_PATH } from "./config";
import { Interface } from "./interface";
import { SceneManager } from "./sceneManager";
import { AnimUtils, NetworkUtils } from "./utilities";

//App Class
class App extends BaseEngine {
  //App Constructor
  constructor() {
    //Base class constructor
    super();

    //Whether any load error set
    this.loadErrorSet = false;
    //Whether demo started
    this.demoStarted = false;

    //Meta configuration object
    this.meta = {};

    //Load the Audio track
    this.audioTrack = new Audio("assets/audio_track.mp3");
    this.audioTrack.volume = 0;

    //Create camera controller
    this.cameraController = new CameraController(
      this.renderer,
      window.innerWidth / window.innerHeight
    );
    //Initialize SceneManager
    SceneManager.init(this.manager);

    //Event listener  - Loading Manager Progress
    this.manager.onProgress = this.onLoadProgress.bind(this);
    //Event listener  - Loading Manager Error
    this.manager.onError = this.onLoadError.bind(this);
    //Event listener  - Loading Manager Completed
    this.manager.onLoad = this.onLoadCompleted.bind(this);

    //Event Listener - Window resize
    window.addEventListener("resize", this.onContextResized.bind(this), true);
    //Event Listener - Start Demo Button Click
    document
      .querySelector("#btn-start-demo")
      .addEventListener("click", this.startDemo.bind(this));
    //Event Listener  - Skip Intro button click
    document
      .querySelector("#btn-skip-intro")
      .addEventListener("click", this.skipIntro.bind(this));
    //Event Listener - Cinematic shots completed
    this.cameraController.setOnCineComplete(this.skipIntro.bind(this));

    //Event Listener - Entity color change
    Interface.setOnEntityColor(SceneManager.setEntityColor);
    //Event Listener - Entity visibility change
    Interface.setOnEntityVisible(SceneManager.setEntityVisible);

    //Intialize the scene
    this.setupScene();

    //Recalculate context
    this.onContextResized();

    //Start update routine
    this.update();
  }

  //Initialize the configurator scene
  setupScene() {
    //Load the stage model
    SceneManager.loadStage(this.scene);

    //Load the Active model post meta data fetch
    NetworkUtils.fetchMeta(ACTIVE_PATH, (meta) => {
      //Get reference to the meta
      this.meta = meta;

      //Load the Active model through model manager
      SceneManager.loadActiveModel(this.scene, this.meta);
    });
  }

  //Event - LoaderManager error
  onLoadError(item) {
    //Remove Loader Icon
    const icon = document.querySelector("#preloader .icon");
    icon && icon.remove();
    //Display load error
    document.querySelector("#preloader .title").textContent = "ERROR LOADING";
    //Display the load error item
    document.querySelector("#preloader .desc").textContent = item;

    //Set error flag
    this.loadErrorSet = true;
  }

  //Event - LoaderManager progress
  onLoadProgress(item, loaded, total) {
    //Ignore if any load error occured
    if (this.loadErrorSet) return;

    //Update preloader description with error item name
    document.querySelector("#preloader .desc").textContent = item;
  }

  //Event - LoaderManager finished
  onLoadCompleted() {
    //Ignore if any load error occured
    if (this.loadErrorSet) return;

    //Update preloader content
    const icon = document.querySelector("#preloader .icon");
    icon && icon.remove();
    document.querySelector("#preloader .title").textContent =
      "Automobile Configurator";
    document.querySelector("#preloader .desc").innerHTML =
      "A ThreeJS based car configurator. This app is intented for demo purposes only.";

    document.querySelector("#preloader .btn-main").style.display = "initial";
  }

  //Event - Render context resized
  onContextResized() {
    //Set new renderer size
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    //Set new camera projection
    this.cameraController.setAspect(window.innerWidth / window.innerHeight);
  }

  //Method - Start the demo with cinematic sequence
  startDemo() {
    //Ignore if any load error set or demo already started
    if (this.loadErrorSet || this.demoStarted) return;

    //State demo started
    this.demoStarted = true;

    //Fade Out Preloader
    AnimUtils.fadeElementOut(
      document.querySelector("#preloader"),
      900,
      (element) => {
        //Remove Preloader element
        element.remove();

        //Fade In Welcome screen
        AnimUtils.fadeElementIn(
          document.querySelector("#welcome-screen"),
          900,
          {
            display: "flex",
          }
        );
      }
    );

    //Start cinematic shots seuqnce
    this.cameraController.startCinematic();

    //Start audio track with fade-in the audio
    AnimUtils.fadeAudioIn(this.audioTrack, 2000, { max: 0.5 });
  }

  //Skip cinematic intro
  skipIntro() {
    //Fade Audio Track and remove
    AnimUtils.fadeAudioOut(this.audioTrack, 2000, (audio) => audio.remove());

    //Start fading in the screen
    AnimUtils.fadeElementIn(
      document.querySelector("#screen-fader"),
      900,
      { display: "flex" },
      (fader) => {
        //Stop the cinematic camera movement
        this.cameraController.stopCinematic();
        //Set orbit camera as current camera
        this.cameraController.mainCamera = this.cameraController.orbitCamera;
        //Set new camera projection
        this.cameraController.setAspect(window.innerWidth / window.innerHeight);
        //Remove the welcome screen
        const welcomeScreen = document.querySelector("#welcome-screen");
        welcomeScreen && welcomeScreen.remove();
        //Initialize configurator interface
        Interface.initialize(this.meta);
        //Fade out screen fader
        AnimUtils.fadeElementOut(fader, 900);
      }
    );
  }

  //App Update
  update() {
    //Parent
    super.update();
    //Update Camera Controller
    this.cameraController.update();
    //Render scene through main camera
    this.renderer.render(this.scene, this.cameraController.mainCamera);
    //Request updation to next frame
    requestAnimationFrame(this.update.bind(this));
  }
}
new App();
export default new App();
