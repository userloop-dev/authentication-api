import { Output, asset, interpolate } from '@pulumi/pulumi';
import { apigatewayv2, lambda, iam } from '@pulumi/aws';
import { getName } from './_utils';

interface Route {
	api: apigatewayv2.Api;
	type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
	path: string;
}

const lambdaLayer = new lambda.LayerVersion(getName('lambdaLayer'), {
	layerName: getName('lambdaLayer-utils'),
	code: new asset.AssetArchive({
		'nodejs/_utils': new asset.FileAsset('./build/aws-lambda-layers/_utils.js'),
	}),
	compatibleRuntimes: ['nodejs18.x'],
});

const lambdaLayerAvatars = new lambda.LayerVersion(getName('lambdaLayer-avatars'), {
	layerName: getName('lambdaLayer-utils'),
	code: new asset.AssetArchive({
		'nodejs/avatars': new asset.FileAsset('./build/aws-lambda-layers/_utils.js'),
	}),
	compatibleRuntimes: ['nodejs18.x'],
});

export const createRoute = (handler: string, route: Route, resources: Record<string, Output<string>>, lambdaRole: iam.Role) => {
	const f: lambda.Function = new lambda.Function(getName(handler), {
		code: new asset.AssetArchive({
			'__index.js': new asset.FileAsset(`./build/aws-lambda/${handler}.js`),
		}),
		layers: [lambdaLayer.arn],
		runtime: 'nodejs18.x',
		role: lambdaRole.arn,
		handler: '__index.handler',
		environment: {
			variables: resources,
		},
	});

	const integration = new apigatewayv2.Integration(getName(`${handler}-integration`), {
		apiId: route.api.id,
		integrationType: 'AWS_PROXY',
		integrationUri: f.arn,
		integrationMethod: route.type,
	});

	const permission = new lambda.Permission(
		getName(`${handler}-permission`),
		{
			action: 'lambda:InvokeFunction',
			principal: 'apigateway.amazonaws.com',
			function: f,
			sourceArn: interpolate`${route.api.executionArn}/*/*`,
		},
		{
			dependsOn: [route.api, f],
		}
	);

	const apiRoute = new apigatewayv2.Route(getName(`${handler}-route`), {
		apiId: route.api.id,
		routeKey: `${route.type} ${route.path}`,
		target: interpolate`integrations/${integration.id}`,
	});

	return apiRoute;
};
