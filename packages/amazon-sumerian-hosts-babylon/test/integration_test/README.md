# Integration Tests

Each integration test contains an end to end example focusing on a single Host feature like animation, text-to-speech etc. These tests run in the browser and must be exercised manually.

## Prerequisites

In order for the integration tests to be runnable you will need to set up a few things in your AWS account. For step-by-step instructions on setting up this required infrastructure, see [AWS-Infrastructure-Setup.md](https://github.com/aws-samples/amazon-sumerian-hosts/tree/mainline2.0/AWS-Infrastructure-Setup.md) in the root of this repository.

## Local Environment Setup

In a terminal on your local machine, navigate to the repository root directory and run (if you haven't already)...

```
npm install
```

## Running the Tests

Run `npm run start-babylon` from the repository root. This will start a local web server and open two tabs in your browser. One will provide a list of demos (from the `packages/demos-babylon` package.) The other will be the list of available integration tests. From this tab you can access and exercise each test.

When you're finished runnin the tests, you can quit the local dev server by pressing CTRL-C in the same terminal in which you started the server.