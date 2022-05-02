# Sumerian Host Babylon.js Demos

This directory contains a number of demonstrations, each focused on a different feature of the Sumerian Hosts API.

## Prerequisites

Before you can run the demos, you will need to set up a few thing in your AWS account. For step-by-step instructions on setting up this required infrastructure, see [AWS-Infrastructure-Setup.md](../../../../AWS-Infrastructure-Setup.md) in the root of this repository.

## Local Environment Setup

In a terminal on your local machine, navigate to the repository root directory and run (if you haven't already)...

```
npm install
```

Open the `demo-credentials.js` file in the root of the repository for editing.

Set the `cognitoIdentityPoolId` value to the Cognito Identity Pool you created above. 

Save the edits you made to the `demo-credentials.js` file.


## Running the demos

In a terminal, navigate to repository root directory.

Start the demo server by running...

```
npm run start-babylon
```

This starts a local web server and launches two new browser tabs. The tab that will have focus will be titled **"BabylonJS Sumerian Host Demos"**. Click on any demo to give it a try. (The other tab that opens contains integration test files. You can ignore that tab.)

When you're finished with the demos, you can quit the local dev server by pressing CTRL-C in the same terminal in which you started the server.

