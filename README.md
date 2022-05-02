# Amazon Sumerian Hosts

Amazon Sumerian Hosts is an experimental open source project that aims to make it easy to create interactive animated 3D characters that can be rendered on the Web and leverage AWS Services such as [Amazon Polly](https://aws.amazon.com/polly/) and [Amazon Lex](https://aws.amazon.com/lex/). 

It defines a Javascript API for managing animations, synthesizing and playing speech with Amazon Polly, generating lipsync animation at runtime in sync with Polly generated audio and interacting with Amazon Lex bot. Amazon Sumerian Hosts is divided up into four packages:
* [@amazon-sumerian-hosts/core](packages/amazon-sumerian-hosts-core) is the core API that can be extended to support the Web rendering engine of your choice
* [@amazon-sumerian-hosts/three](packages/amazon-sumerian-hosts-three) is an integration of the core library with [three.js](https://threejs.org/)
* [@amazon-sumerian-hosts/babylon](packages/amazon-sumerian-hosts-babylon) is an integration of the core library with [Babylon.js](https://www.babylonjs.com/)
* [Demos-Babylon](packages/demos-babylon) contains a number of demonstrations with [Babylon.js](https://www.babylonjs.com/), each focused on a different feature of the Sumerian Hosts API 


# License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file. The assets within examples folders are licensed under the CC-BY-4.0 License. See the [LICENSE](packages/demo-babylon/src/character-assets/LICENSE) file.

# Usage

There are a number of ways to use Amazon Sumerian Hosts in your own projects.

The easiest way to get started using the hosts is by using Babylon.JS Editor with open-source-host plugin for importing Amazon Sumerian Hosts into Babylon.js project and aws-amplify-publisher plugin for publishing to the web. More details can be found in [aws-tools-for-babylonjs-editor](https://github.com/aws-samples/aws-tools-for-babylonjs-editor/blob/main/README.md) repo.

## Integrating into a three.js or Babylon.js project

If you do not wish to use the Babylon.JS Editor, you may install the integration for three.js or Babylon.js using one of the following commands:

`npm install --save @amazon-sumerian-hosts/three` for three.js

`npm install --save @amazon-sumerian-hosts/babylon` for Babylon.js

Alternatively, with these integrations each using package.json exports to publish both ESM modules and a bundled CommonJS module for broad compatibility, you can directly include build files in the `dist` directory for each package in your project. See [Building the Repository](#Building-the-Repository) for prerequisites and instructions on how to do that.

The integration test and demos in this repository will get you started in using these libraries.

See the Getting Started guide in either [three.js](packages/amazon-sumerian-hosts-three/README.md#getting-started) or [Babylon.js](packages/amazon-sumerian-hosts-babylon/README.md#getting-started) packages for a walkthrough using this method and the [API Documentation](https://aws-samples.github.io/amazon-sumerian-hosts/) for more detailed information on the classes and methods available. 

## Integrating into your own web 3d engine.

The @amazon-sumerian-hosts/core package provides the core host functionality that can be integrated into any engine.

If you'd like to extend hosts to support another Javascript rendering engine, create a new folder inside `packages` with the name of the engine you're adding support for. 
Extend any host modules that need to use resources specific to your rendering engine. See the [@amazon-sumerian-hosts/three](packages/amazon-sumerian-hosts-three) and [@amazon-sumerian-hosts/babylon](packages/amazon-sumerian-hosts-babylon) package folders for examples of files you'll likely need to include. Generally you will need to extend `Messenger` if your engine has an event/messaging system, `HostObject` if your engine keeps track of time and delta time, `AnimationFeature` and `SingleState` if your engine has an animation system, and `TextToSpeechFeature` and `Speech` if your engine has an audio system. Update `webpack.config.js` to add a new config for the engine you're adding support for.

# Demos and Graphical Assets

[Demos-Babylon](packages/demos-babylon) contains a number of demonstrations with [Babylon.js](https://www.babylonjs.com/), each focused on a different feature of the Sumerian Hosts API. See [README](packages/demos-babylon/README.md) for more details.


You can clone the repository to obtain glTF character and animation assets (located in the [character-assets](/packages/demos-babylon/src/character-assets/) within Demos-Babylon package) tailored to work well with Demos and the Host API. You can use them as-is, modify them in DCC software such as [Blender](https://www.blender.org/) or use them as a guide to develop your own 3D assets.

If you'd like to pull the gitub repository and create your own build, see [Building the Repository](#Building-the-Repository) for prerequisites and instructions on how to do that.


# [Building the Repository](#Building-the-Repository)

## Prerequisites  

- Install [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- Windows only - [Install Windows Subsystem for Linux (WSL)](https://docs.microsoft.com/en-us/windows/wsl/install-win10)
- Install [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
 - At least Node.js 15 and npm 7, but is tested with Node.js 16 and npm 8. 


## Cloning

1. Create and cd into the folder you want to clone the repository to.
```
mkdir amazon-sumerian-hosts
cd amazon-sumerian-hosts
```

2. Clone the host repository  
```
git clone https://github.com/aws-samples/amazon-sumerian-hosts.git
```

3. Install dependencies
```
npm install
```

## Build Instructions
Generate build files using the following command
```
npm run build
```
This will simultaenously build all of the packages in the repository. You will now have new build files in the `dist` directory for each package. 

## Testing
This repository has three methods of testing: unit tests, integration tests, and example file validation.

### Unit Tests
To verify unit tests are passing, you will need to run the unit test runner. To run unit tests for all packages:
```
npm run test
```

This command can also run alongside a build first:
```
npm run build-test
```

### Integration Tests
Each package with integration tests has their own instructions for running:
- [Core](packages/amazon-sumerian-hosts-core/test/integration_test/README.md)
- [Babylon.js](packages/amazon-sumerian-hosts-babylon/test/integration_test/README.md)
- [Three.js](packages/amazon-sumerian-hosts-three/test/integration_test/README.md)

### Examples and Demos
Each of the integration packages have their own examples or demos attached to them. Each of these files contain enough code to stand up and verify the code is working properly. See [Babylon.js Demos](packages/demos-babylon/README.md) [Three.js Demos](packages/amazon-sumerian-hosts-three/README.md) for more details about how to run examples and demos.