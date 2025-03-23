import "./style.css";
import { createClock } from "./components/clock";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera.js";
import { Color3 } from "@babylonjs/core/Maths/math.color.js";
import { Engine } from "@babylonjs/core/Engines/engine.js";
import { EnvironmentHelper } from "@babylonjs/core/Helpers/environmentHelper.js";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight.js";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder.js";
import { loadAssetContainerAsync } from "@babylonjs/core";
import { Scene } from "@babylonjs/core/scene.js";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.js";
import { Vector3 } from "@babylonjs/core/Maths";
import { WebXRDefaultExperience } from "@babylonjs/core/XR/webXRDefaultExperience.js";
  
// Required for EnvironmentHelper
import "@babylonjs/core/Materials/Textures/Loaders";
  
// Enable GLTF/GLB loader for loading controller models from WebXR Input registry
import "@babylonjs/loaders/glTF";
  
// Without this next import, an error message like this occurs loading controller models:
//  Build of NodeMaterial failed" error when loading controller model
//  Uncaught (in promise) Build of NodeMaterial failed: input rgba from block
//  FragmentOutput[FragmentOutputBlock] is not connected and is not optional.
import "@babylonjs/core/Materials/Node/Blocks";
  
// XR ボタンを右下に表示させるために必須
import "@babylonjs/core/Helpers/sceneHelpers";
import { mainUVVaryingDeclaration } from "@babylonjs/core/Shaders/ShadersInclude/mainUVVaryingDeclaration";

// Enable Gaussian Splatting loader
import "@babylonjs/loaders/SPLAT";

const main = async () => {
  // Create a canvas element for rendering
  const app = document.querySelector<HTMLDivElement>("body");
  const canvas = document.createElement("canvas");
  app?.appendChild(canvas);
   
  // Create engine and a scene
  const babylonEngine = new Engine(canvas, true);
  const scene = new Scene(babylonEngine);
   
  // Add a basic light
  new HemisphericLight("light1", new Vector3(0, 2, 0), scene);
   
  // Create a default environment (skybox, ground mesh, etc)
  
  const envHelper = new EnvironmentHelper(
    {
      skyboxSize: 200,
      groundSize: 100,
      groundColor: new Color3(0.5, 0.5, 0.5),
    },
    scene,
  );
   
  // Add a camera for the non-VR view in browser
  const camera = new ArcRotateCamera("Camera", -(Math.PI / 4) * 3, Math.PI / 4, 10, new Vector3(0, 0, 0), scene);
  camera.attachControl(true);

  // Clock
  const clock = createClock(scene);
  
  // 3dgs
  const gaussianSplatting = await loadAssetContainerAsync("https://raw.githubusercontent.com/sentomo/3dgs-castle-viewer/master/3dgs-castle-webxr/src/assets/KakegawaCastle.spz", scene);
  gaussianSplatting.meshes[0].position = new Vector3(40.0, 38.5, 30.0);
  gaussianSplatting.meshes[0].rotation.y = 45.0;
  gaussianSplatting.meshes[0].scaling = new Vector3(2.0, 2.0, 2.0);

  // Setup default WebXR experience
  // Use the enviroment floor to enable teleportation
  /*
  WebXRDefaultExperience.CreateAsync(scene, {
    floorMeshes: [envHelper?.ground as Mesh],
    optionalFeatures: true,
  });
  */
   
  const xr = await scene.createDefaultXRExperienceAsync({
    uiOptions: {
      sessionMode: "immersive-vr",
    },
    optionalFeatures: true,
    floorMeshes: [],
  });

  // HMD Camera
  const xrCamera = xr.baseExperience.camera;

  // Movement settings
  const flySpeed = 1.0;
  const moveThreshold = 0.7;

  // Horizontal rotation settings
  const rotationAngle = Math.PI / 4; // 45°
  const rotationCooldown = 500; // Vection sickness prevention
  const rotationThreshold = 0.7;
  let canRotate = true;
   
  // Controller Input
  xr.input.onControllerAddedObservable.add((controller) => {
    controller.onMotionControllerInitObservable.add((motionController) => {
      const thumbstick = motionController.getComponent("xr-standard-thumbstick");

      if (thumbstick) {
        thumbstick.onAxisValueChangedObservable.add(() => {
          const yValue = thumbstick.axes.y;
          const xValue = thumbstick.axes.x;

          const forward = xrCamera.getForwardRay().direction;
          
          if (yValue < -moveThreshold) {
            xrCamera.position.addInPlace(forward.scale(flySpeed));
          }

          if (yValue > moveThreshold) {
            xrCamera.position.addInPlace(forward.scale(-flySpeed));
          }

          if (canRotate) {
            if (xValue < -rotationThreshold) {
              xrCamera.rotation.y -= rotationAngle;
              canRotate = false;
              setTimeout(() => canRotate = true, rotationCooldown);
            }
            else if (xValue > rotationThreshold) {
              xrCamera.rotation.y += rotationAngle;
              canRotate = false;
              setTimeout(() => canRotate = true, rotationCooldown);
            }
          }
        });
      }
    });
  });

  // Run render loop
  babylonEngine.runRenderLoop(() => {
    scene.render();
  });
}
 
main();