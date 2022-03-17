// TODO: Update the value below to match a Cognito Identity Pool created in your
// AWS account. The unauthenticated IAM role for the pool (usually ending in the
// suffix "Unauth_Role") must have the following managed permissions policies
// assigned to it:
//   - AmazonPollyReadOnlyAccess
//   - AmazonLexRunBotsOnly
const cognitoIdentityPoolId = 'us-west-2:3eb8a906-3615-4894-8b5f-582420fe8e49';
export default cognitoIdentityPoolId;
