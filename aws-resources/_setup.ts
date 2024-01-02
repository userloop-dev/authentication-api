import { Config } from '@pulumi/pulumi';
import { createIamRoles } from './aws-iam';
import { createCognitoResources } from './aws-cognito';
import { createApiGatewayResources } from './aws-apig';
import { createRoute } from './aws-apig-route';
import { avatarBucket, createDefaultAvatar } from './aws-s3';

const STACK_NAME = 'authentication-api';
const awsConfig = new Config('aws');
const authenticationConfig = new Config(STACK_NAME);

const region = awsConfig.require('region');
const stage = authenticationConfig.require('stage');
const domain = authenticationConfig.require('domain');
const dnsZone = authenticationConfig.require('dns-zone');
const allowOrigin = authenticationConfig.require('allow-origin');

export const _setup = async () => {
	const { lambdaRole } = await createIamRoles();
	const { userPool, userPoolClient } = await createCognitoResources();
	const { api } = await createApiGatewayResources(STACK_NAME, stage, region, domain, allowOrigin, dnsZone);
	const defaultAvatar = await createDefaultAvatar();

	const resources = {
		user_pool: userPool.id,
		user_pool_client: userPoolClient.id,
		avatar_bucket: avatarBucket.id,
		default_avatar_object: defaultAvatar.key,
	};

	createRoute('getUser', { api, type: 'POST', path: '/get-user' }, resources, lambdaRole);
	createRoute('sendEmailCode', { api, type: 'POST', path: '/code/send' }, resources, lambdaRole);
	createRoute('verifyEmailCode', { api, type: 'POST', path: '/code/verify' }, resources, lambdaRole);
	createRoute('sendForgotPassword', { api, type: 'POST', path: '/forgot-password/send' }, resources, lambdaRole);
	createRoute('verifyForgotPassword', { api, type: 'POST', path: '/forgot-password/verify' }, resources, lambdaRole);
	createRoute('signIn', { api, type: 'POST', path: '/sign-in' }, resources, lambdaRole);
	createRoute('signUp', { api, type: 'POST', path: '/sign-up' }, resources, lambdaRole);
};
