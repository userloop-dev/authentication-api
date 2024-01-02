import { UserPool, UserPoolClient } from '@pulumi/aws/cognito';
import { getName } from './_utils';

export const createCognitoResources = async () => {
	const userPool = await new UserPool(getName('userPool'), {
		usernameAttributes: ['email'],
		autoVerifiedAttributes: ['email'],
		verificationMessageTemplate: {
			defaultEmailOption: 'CONFIRM_WITH_CODE',
			emailMessage: 'Enter the code {####} to verify your account.',
			emailSubject: 'Verify your Userloop account',
		},
		passwordPolicy: {
			minimumLength: 8,
			requireLowercase: true,
			requireNumbers: true,
			requireUppercase: true,
			requireSymbols: false,
		},
		accountRecoverySetting: {
			recoveryMechanisms: [
				{
					name: 'verified_email',
					priority: 1,
				},
			],
		},
	});

	const userPoolClient = await new UserPoolClient(getName('userPoolClient'), {
		userPoolId: userPool.id,
		explicitAuthFlows: ['ADMIN_NO_SRP_AUTH'],
		tokenValidityUnits: {
			accessToken: 'hours',
			refreshToken: 'hours',
		},
		accessTokenValidity: 12,
		refreshTokenValidity: 12,
	});

	return { userPool, userPoolClient };
};
