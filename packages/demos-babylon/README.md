# Sumerian Host Babylon JS Demos

This directory contains a number of demonstrations, each focused on a different feature of the Sumerian Hosts API.

## Demo setup

In a terminal, navigate to the repository root directory and run (if you haven't already)...

```
npm install
```

In the folder `/packages/demos-babylon/src/common/`, open the `demo-credentials.js` file for editing.

Set the `cognitoIdentityPoolId` value to a Cognito Identity Pool ID created in your own AWS account. The unauthenticated IAM role associated with the pool (usually ending in the suffix "Unauth_Role") must have the following managed permissions policies assigned to it:
- AmazonPollyReadOnlyAccess
- AmazonLexRunBotsOnly

Save the edits you made to the `demo-credentials.js` file.


## Running the demos

In a terminal, navigate to repository root directory.

Start the demo server by running...

```
npm run start-babylon-demos
```

This starts a local web server and launches a web browser displaying the list of available demos. Click on any demo to give it a try.

When you're finished with the demos, you can quite the local dev server by pressing CTRL-C in the same terminal in which you started the server.