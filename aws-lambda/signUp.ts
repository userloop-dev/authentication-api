import { Response, genericHandler } from '/opt/nodejs/_utils';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
const cognitoIdentityServiceProvider = new CognitoIdentityProvider({ region: 'us-west-2' });

export const handler = async (event: any): Promise<Response> =>
	genericHandler(event, ['email', 'given_name', 'family_name', 'password', 'confirm_password'], async (body: any) => {
		if (body.password !== body.confirm_password) return { statusCode: 400, body: JSON.stringify({ message: 'Passwords do not match.' }) };
		const response = await cognitoIdentityServiceProvider.signUp({
			ClientId: process.env.user_pool_client,
			Username: body.email,
			Password: body.password,
			UserAttributes: [
				{ Name: 'email', Value: body.email },
				{ Name: 'given_name', Value: body.given_name },
				{ Name: 'family_name', Value: body.family_name },
			],
		});

		return { statusCode: 200, body: JSON.stringify(response) };
	});
