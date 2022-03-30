# Sumerian Host Babylon JS Demos

This directory contains a number of demonstrations, each focused on a different feature of the Sumerian Hosts API.

### AWS Setup

In order for the demos to be runnable you will need to set up a few things in your AWS account. The steps below will guide you through creating a **Cognito Identity Pool** that allows the demo applications to talk to two AWS services—Amazon Polly and Amazon Lex. You'll also create the actual **Amazon Lex chatbot** that powers one of the demos.

#### App Credentials Setup

In order to allow our front-end application to make API calls to Amazon Lex and Amazon Polly we must create authorization credentials that it can use.

In the AWS console, navigate to the Cognito service.

Confirm that the Cognito console is set to your desired AWS region. (Example, "us-east-1")

Click **Manage Identity Pools**.

If you've never created an identity pool before you will be taken directly to the "Getting started wizard". If instead you see a dashboard view with a "Create new identity pool" button, click that button to be taken to the "Getting started wizard".

Give the identity pool a meaningful name specific to your application. We'll use the name *"Demo_SumHostSeating"* for these instructions.

Tick the **"Enable access to unauthenticated identites"** checkbox to *ON*. This will allow anonymous web visitors to use our application.

Click the **Create Pool** button at the bottom of the page.

You will be presented with a page informing you that some IAM roles will be created on your behalf. If you expand the "View Details" section you'll see that two IAM roles will be created for you—one representing logged-in (authenticated) users of your app and one representing anonymous (unauthenticated) users. Click the **"Allow"** button at the bottom of the page.

You will be presented with a "Sample code" page. While you don't need most of the sample code presented, you ***must*** ✏️ copy the Identity pool ID value shown in the code, and save it for use later in these instructions. The value will look similar to `"us-east-1:1ab23f45-6789-8cde-7654-f1g0549h0cce"`

Use the AWS console search bar to navigate to the IAM service.

Click the **Roles** tab in the left nav.

Use the IAM Roles search field to search for the name you gave your Cognito Identity Pool (ex. *"Demo_SumHostSeating"*). You should get two results—one with an "Unauth_Role" suffix and one with an "Auth_Role" suffix.

Click the role name of the "Unauth_Role" entry to access that IAM role.

Select **Add permissions > Attach policies**.

In the search box, search for *"AmazonLexRunBotsOnly"*. Tick the checkbox next to that policy to select it. This policy will allow our application to access Amazon Lex.

Click the **Clear filters** button, and use the search box again and search for *"AmazonPollyReadOnlyAccess"*. Tick the checkbox next to that policy to select it. This policy will allow our application to access Amazon Polly.

Now that you've selected the two permissions policies required by our application, click the **Attach policies** button.

In the resulting screen, confirm that both polices have been added to the list of permissions policies for the role.

Your app credentials setup is now complete! 🎉

#### Lex Bot Setup

From the AWS console, navigate to the Amazon Lex service.

Confirm that the Lex console is set to your desired AWS region. This must be the same region you chose when creating your Cognito Identity Pool.

If presented with a **Get Started** button, click it.

> ⚠️ By default you will be taken to the Lex V2 console. However, the bot used in this demo is only compatible with Lex V1. In the left-hand navigation, select "Return to the V1 console" before proceeding.

From the Bots tab, select **Create**.

Select the **"BookTrip"** sample bot (the default).

Set the **"Language"** property to the launguage you expect your users to speak with interacting with the chatbot.

Set the **"COPPA"** property to either option.

Click the **Create** button at the bottom of the page. You will be taken to the the **Settings > Aliases** page for your new chatbot. 

Create a new alias for your bot by setting **"Alias name"** to *"Dev"*, setting **"Bot version"** to *"Latest"*, then clicking the **(+)** button.

Click the **Publish** button at the top of the screen.

In the dialog that appears, choose the **Dev** bot alias and click **Publish**.

Your Lex bot setup is now complete! 🎉

## Local setup

In a terminal on your local machine, navigate to the repository root directory and run (if you haven't already)...

```
npm install
```

In the folder `/packages/demos-babylon/src/common/`, open the `demo-credentials.js` file for editing.

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

