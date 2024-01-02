import { iam } from '@pulumi/aws';
import { getName } from './_utils';

export const createIamRoles = async () => {
	const lambdaRole = await new iam.Role(getName('lambdaRole'), {
		assumeRolePolicy: {
			Version: '2012-10-17',
			Statement: [
				{
					Action: 'sts:AssumeRole',
					Principal: { Service: 'lambda.amazonaws.com' },
					Effect: 'Allow',
					Sid: '',
				},
			],
		},
	});

	const cognitoPolicy = await new iam.Policy(getName('cognitoPolicy'), {
		path: '/',
		description: 'Cognito policy',
		policy: JSON.stringify({
			Version: '2012-10-17',
			Statement: [
				{
					Action: ['cognito-idp:ListUsers', 'cognito-idp:AdminInitiateAuth', 'cognito-idp:AdminGetUser'],
					Effect: 'Allow',
					Resource: '*',
				},
			],
		}),
	});

	new iam.RolePolicyAttachment(getName('lambdaRoleBasicAttachment'), {
		role: lambdaRole,
		policyArn: iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
	});

	new iam.RolePolicyAttachment(getName('lambdaRoleCognitoAttachment'), {
		role: lambdaRole,
		policyArn: cognitoPolicy.arn,
	});

	return { lambdaRole, cognitoPolicy };
};
