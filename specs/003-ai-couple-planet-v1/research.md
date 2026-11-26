# V1-S1 rendering

Expo GL with React Three Fiber and three.js follows the P01 candidate and the K02 loader example. It supports the native scene and GLB swap in the Expo development build. A pre-rendered turntable cannot support free camera movement or future surface objects; a separate game engine would add a second runtime. Device performance remains to be measured before accepting the stack.

The owner has not supplied `aroomi-v1-tpose.glb`. `Aroomi` is a temporary primitive model, and T104 stays open. The real model and its mobile optimization must replace it later.

On iOS 26.5 simulator, the GL context was created and frame callbacks ran at 402×874 points, but a red, unlit cube at the origin was invisible with or without the background layer. The simulator evidence does not establish that the planet renders or that drag and zoom work. Device performance and rendering remain owner checkpoints. Three.js 0.187's CommonJS entry calls `process.emitWarning`, unavailable on Hermes; the local compatibility shim runs before the scene import.
