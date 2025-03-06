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
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
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
  
  // Add upper ground
  const upperGroundYellow = createUpperGround(new Vector3(0, 5.0, 0), "yellowMaterial", new Color3(1, 1, 0), scene);
  const uppperGroundGreen = createUpperGround(new Vector3(10.0, 13.0, 10.0), "greenMaterial", new Color3(0, 1, 0), scene);

   
  // Add a camera for the non-VR view in browser
  const camera = new ArcRotateCamera("Camera", -(Math.PI / 4) * 3, Math.PI / 4, 10, new Vector3(0, 0, 0), scene);
  camera.attachControl(true);

  // Clock
  const clock = createClock(scene);
  
  // 3dgs
  const gaussianSplatting = await loadAssetContainerAsync("https://raw.githubusercontent.com/sentomo/3dgs-castle-viewer/master/3dgs-castle-webxr/src/assets/KakegawaCastle.spz", scene);
  gaussianSplatting.meshes[0].position = new Vector3(76.0, 28.5, 66.0);
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
    floorMeshes: [envHelper.ground as Mesh, upperGroundYellow, uppperGroundGreen],
  });
   
   
  // Run render loop
  babylonEngine.runRenderLoop(() => {
    scene.render();
  });
}
 
main();

function createUpperGround(position: Vector3, materialName: string, color: Color3, scene: Scene) {
  const extraGround = MeshBuilder.CreateGround(`extraGround_${materialName}`, { width: 30, height: 30 }, scene);
  extraGround.position = position;
  const extraGroundMaterial = new StandardMaterial(materialName, scene);
  extraGroundMaterial.diffuseColor = color;
  extraGroundMaterial.alpha = 0.5;
  extraGround.material = extraGroundMaterial;

  return extraGround;
}