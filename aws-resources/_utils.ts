import { Config } from '@pulumi/pulumi';

const STACK_NAME = 'authentication-api';

const authenticationConfig = new Config(STACK_NAME);
const stage = authenticationConfig.require('stage');

export function getName(suffix: string): string {
	return `${STACK_NAME}-${stage}-${suffix}`;
}
