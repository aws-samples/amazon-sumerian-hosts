# Running Integration/Stress Test

Each integration test contains an end to end example focusing on a single Host feature like animation, text-to-speech etc. 

## Walkthrough

1. Replace any ```<Enter Cognito Identity Pool ID here>``` with your own AWS IdentityPoolId or create your own AWS credential if you're testing texttospeech feature. Follow tutorial [here](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-started-browser.html) if you need to set up your own cognito identity pool.
2. Run ```npm run start-babylon``` from the repository root to launch the web server and navigate to the corresponding test page.