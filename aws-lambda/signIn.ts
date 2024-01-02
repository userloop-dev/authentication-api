import { Response, genericHandler } from '/opt/nodejs/_utils';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
const cognitoIdentityServiceProvider = new CognitoIdentityProvider({ region: 'us-west-2' });

export const handler = async (event: any): Promise<Response> =>
	genericHandler(event, ['email', 'password'], async (body: any) => {
		try {
			const response = await cognitoIdentityServiceProvider.adminInitiateAuth({
				UserPoolId: process.env.user_pool,
				ClientId: process.env.user_pool_client,
				AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
				AuthParameters: {
					USERNAME: body.email,
					PASSWORD: body.password,
				},
			});
			return { statusCode: 200, body: JSON.stringify(response) };
		} catch (e) {
			if (e.name === 'UserNotConfirmedException') {
				await cognitoIdentityServiceProvider.resendConfirmationCode({
					ClientId: process.env.user_pool_client,
					Username: body.email,
				});
				return { statusCode: 500, body: JSON.stringify({ message: e }) };
			}
			// Return custom error message to client
			if (e.name === 'NotAuthorizedException' || e.name === 'UserNotFoundException') {
				return { statusCode: 500, body: JSON.stringify({ message: 'Invalid email or password' }) };
			}
			throw e;
		}
	});
