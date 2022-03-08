// TODO: Update this value to match a Cognito Identity Pool created in your AWS
// account. The unauthenticated IAM role for the pool (usually ending in the
// suffix "Unauth_Role") must have the following managed permissions policies
// assigned to it:
//   - AmazonPollyReadOnlyAccess
//   - AmazonLexRunBotsOnly
const cognitoIdentityPoolId = 'us-east-1:xxx-xxx-xxx-xxx';
export default cognitoIdentityPoolId;