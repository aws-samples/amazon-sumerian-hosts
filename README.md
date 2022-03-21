# Amazon Sumerian Hosts

Amazon Sumerian Hosts is an experimental open source project that aims to make it easy to create interactive animated 3D characters that can be rendered on the Web and leverage AWS Services such as [Amazon Polly](https://aws.amazon.com/polly/). 
It defines a Javascript API for managing animations, synthesizing and playing speech with Amazon Polly, and generating lipsync animation at runtime in sync with Polly generated audio. Amazon Sumerian Hosts is divided up into three packages:
* [Amazon-Sumerian-Hosts-Core](packages/amazon-sumerian-hosts-core) is the core API that can be extended to support the Web rendering engine of your choice
* [Amazon-Sumerian-Hosts-Three](packages/amazon-sumerian-hosts-three) is an integration of the core library with [three.js](https://threejs.org/)
* [Amazon-Sumerian-Hosts-Babylon](packages/amazon-sumerian-hosts-babylon) is an integration of the core library with [Babylon.js](https://www.babylonjs.com/)

You can clone the repository to obtain glTF character animation assets (located in the [examples](packages/amazon-sumerian-hosts-babylon/examples/assets/glTF/)) tailored to work well with the Host API. You can use them as-is, modify them in DCC software such as [Blender](https://www.blender.org/) or use them as a guide to develop your own 3D assets.

The easiest way to start using the API is to include the build file that corresponds with the rendering engine you are using. See the Getting Started guide in either [three.js](packages/amazon-sumerian-hosts-three/README.md#getting-started) or [Babylon.js](packages/amazon-sumerian-hosts-babylon/README.md#getting-started) packages for a walkthrough using this method and the [API Documentation](https://aws-samples.github.io/amazon-sumerian-hosts/) for more detailed information on the classes and methods available. Amazon Sumerian Hosts has all three of its packages published to [npm](https://www.npmjs.com/), so alternatively you can install in an existing Node.js project by running `npm install --save @amazon-sumerian-hosts/core @amazon-sumerian-hosts/three @amazon-sumerian-hosts/babylon`.

If you'd like to pull the gitub repository and create your own build, see [Building the Repository](#Building-the-Repository) for prerequisites and instructions on how to do that.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file. The assets within examples folders are licensed under the CC-BY-4.0 License. See the [LICENSE](packages/amazon-sumerian-hosts-babylon/examples/assets/LICENSE) file.
<br/><br/>

# [Building the Repository](#Building-the-Repository)

## Prerequisites  

- Install [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Windows only - [Install Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl/install-win10)
- Install [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
 - At least Node.js 15 and npm 7, but is tested with Node.js 16 and npm 8. 

## Installation

1. Create and cd into the folder you want to clone the repository to.
```
mkdir amazon-sumerian-hosts
cd amazon-sumerian-hosts
```

2. Clone the host repository  
```
git clone https://github.com/aws-samples/amazon-sumerian-hosts.git
```

3. Install dev dependencies
```
npm install
```

## Build Instructions
Generate build files using the following command
```
npm run build
```
This will simultaenously build all of the packages in the repository. You will now have new build files in the `dist` directory for each package. 

To build only a certain package:
```
npm run workspaces=./packages/amazon-sumerian-hosts-{package} build
```

If you'd like to extend hosts to support another Javascript rendering engine, create a new folder inside `packages` with the name of the engine you're adding support for. 
Extend any host modules that need to use resources specific to your rendering engine. See the [`Amazon-Sumerian-Hosts-Three`](packages/amazon-sumerian-hosts-three/src/three.js/) and [`Amazon-Sumerian-Hosts-Babylon`](packages/amazon-sumerian-hosts-babylon/src/Babylon.js/) package folders for examples of files you'll likely need to include. Generally you will need to extend `Messenger` if your engine has an event/messaging system, `HostObject` if your engine keeps track of time and delta time, `AnimationFeature` and `SingleState` if your engine has an animation system, and `TextToSpeechFeature` and `Speech` if your engine has an audio system. Update `webpack.common.js` to add a new config for the engine you're adding support for.

## Testing
This repository has three methods of testing: unit tests, integration tests, and example file validation.

### Unit Tests
To verify unit tests are passing, you will need to run the unit test runner. To run unit tests for all packages:
```
npm run test
```
* Note if running this command for all of the packages, a failure in one will not stop the test runner. 

To run for a specific package only, inside of the directory you can use the command
```
npm run test
```
or within the root directory, you can run
```
npm run --workspaces=./packages/amazon-sumerian-hosts-{package} test
```

This command can also run alongside a build first:
```
npm run build-test
```

### Integration Tests
Each package with integration tests has their own instructions for running:
- [Babylon.js](packages/amazon-sumerian-hosts-babylon/test/integration_test/README.md)
- [Three.js](packages/amazon-sumerian-hosts-three/test/integration_test/README.md)

### Examples Folder
Each of the implementation packages have their own examples attached to them. Each of these files contain enough code to stand up and verify the code is working properly. To verify, open up a local server for the package you are modifying:
```
npm run --workspaces=./packages/amazon-sumerian-hosts-{package} start
```

Then open the browser location for the server, and then the example file. Open up the developer console for the browser, and verify that the scene properly loads without errors. 