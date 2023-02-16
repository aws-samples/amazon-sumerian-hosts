# Amazon Sumerian Hosts

Amazon Sumerian Hosts (Hosts) is an experimental open source project that aims to make it easy to create interactive animated 3D characters for Babylon.js, three.js, and other web 3D frameworks. It leverages AWS services including [Amazon Polly](https://aws.amazon.com/polly/) (text-to-speech) and [Amazon Lex](https://aws.amazon.com/lex/) (chatbot).

> **Compatibility**
>
> ⚠️ Hosts is currently compatible with **BabylonJS v4** (4.2.1+). There are know issues if you try to use Hosts with BabylonJS v5. If you would like to see support for BabylonJS v5 added, comment on [this enhancement request issue](https://github.com/aws-samples/amazon-sumerian-hosts/issues/155).
>
> ✏️ Hosts have been tested with **Three.js v0.127.0**.

![Hosts](docs_template/static/images/hosts_cover.jpg)

Hosts provides a Javascript API for managing animations, synthesizing and playing speech with Amazon Polly, generating lipsync animation at runtime, and interacting with an Amazon Lex chatbot. The project is divided into four packages:
* [@amazon-sumerian-hosts/core](packages/amazon-sumerian-hosts-core) is the core API that can be extended to support the web rendering engine of your choice
* [@amazon-sumerian-hosts/babylon](packages/amazon-sumerian-hosts-babylon) is an integration of the core library with [Babylon.js](https://www.babylonjs.com/)
* [@amazon-sumerian-hosts/three](packages/amazon-sumerian-hosts-three) is an integration of the core library with [three.js](https://threejs.org/)
* [demos-babylon](packages/demos-babylon) contains a number of demo applications built with Babylon.js, each focused on a different feature of the Hosts API


## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file. The assets within examples folders are licensed under the CC-BY-4.0 License. See the [LICENSE](packages/demo-babylon/src/character-assets/LICENSE) file.

## Usage

There are a number of ways to start using Hosts in your own projects.

#### Using plugins for the Babylon.JS Editor

The easiest way to get started using the hosts is by using plugins we provide for the [Babylon.JS Editor](http://editor.babylonjs.com/):

- "Open Source Hosts plugin" for importing Amazon Sumerian Hosts into Babylon.JS Editor projects
- "AWS Amplify Publisher plugin" for easily publishing to the web directly from the editor. 

Visit the [aws-tools-for-babylonjs-editor](https://github.com/aws-samples/aws-tools-for-babylonjs-editor/blob/main/README.md) repository for more details.

#### Using pre-built NPM modules

If you are creating applications outside of the Babylon.JS Editor, you can easily install the relevant Hosts module using NPM.

For Babylon.js projects use:

```
npm install @amazon-sumerian-hosts/babylon
```

For three.js projects use:

```
npm install @amazon-sumerian-hosts/three
```

For further details on how to integrate Hosts into your own projects, reference the included demo applications.

For full detail on the classes and methods available, see the [API Documentation](https://aws-samples.github.io/amazon-sumerian-hosts/)

#### Building from source

Building from source is considered an advanced option. It is not recommended unless you need to heavily customize the core Hosts functionality. Instructions on how to build from source can be found in the [CONTRIBUTING](CONTRIBUTING.md) document.

## Demos

The included demos are the easiest way understand the capabilities of Hosts and to start learning to build your own Hosts applications.

#### For Babylon.js

The [packages/demos-babylon/](packages/demos-babylon/) folder contains a number of demo applications built with Babylon.js, each focused on a different feature of the Hosts API. Instructions for running the demos can be found in the folder's README.

#### For three.js

The [packages/amazon-sumerian-hosts-three/examples/](packages/amazon-sumerian-hosts-three/examples/) folder contains a demo application built with three.js.

## Graphical Assets

This repository contains 3D character and animation assets (glTF format) tailored to work well with the Hosts API. You can use them as-is, modify them in digital content creation software such as [Blender](https://www.blender.org/) or use them as a guide to develop your own 3D assets. You'll find the assets under `packages/demos-babylon/src/character-assets/`.

## Integrating with other 3D engines

The `@amazon-sumerian-hosts/core` package provides the core host functionality that can be integrated into any engine. You will need to extend any host modules/classes that need to use resources or capabilities unique to your rendering engine. See the [@amazon-sumerian-hosts/three](packages/amazon-sumerian-hosts-three) and [@amazon-sumerian-hosts/babylon](packages/amazon-sumerian-hosts-babylon) package folders for examples of files you'll likely need to include. Generally you will need to extend `Messenger` if your engine has an event/messaging system, `HostObject` if your engine keeps track of time and delta time, `AnimationFeature` and `SingleState` if your engine has an animation system, and `TextToSpeechFeature` and `Speech` if your engine has an audio system.

