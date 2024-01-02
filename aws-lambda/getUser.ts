import { Response, genericHandler } from '/opt/nodejs/_utils';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
const cognitoIdentityServiceProvider = new CognitoIdentityProvider({ region: 'us-west-2' });

export const handler = async (event: any): Promise<Response> =>
	genericHandler(event, ['access_token'], async (body: any) => {
		const response = await cognitoIdentityServiceProvider.getUser({
			AccessToken: body.access_token,
		});
		return { statusCode: 200, body: JSON.stringify(response) };
	});
