import { Response, genericHandler } from '/opt/nodejs/_utils';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
const cognitoIdentityServiceProvider = new CognitoIdentityProvider({ region: 'us-west-2' });

export const handler = async (event: any): Promise<Response> =>
	genericHandler(event, ['email'], async (body: any) => {
		const response = await cognitoIdentityServiceProvider.resendConfirmationCode({
			ClientId: process.env.user_pool_client,
			Username: body.email,
		});
		return { statusCode: 200, body: JSON.stringify(response) };
	});
