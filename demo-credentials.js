// TODO: Update the value below to match a Cognito Identity Pool created in your
// AWS account. The unauthenticated IAM role for the pool (usually ending in the
// suffix "Unauth_Role") must have the following managed permissions policies
// assigned to it:
//   - AmazonPollyReadOnlyAccess
//   - AmazonLexRunBotsOnly
const cognitoIdentityPoolId = 'us-east-1:3d4c972a-ed4e-4760-8100-bec5e1746835';
module.exports = cognitoIdentityPoolId;
