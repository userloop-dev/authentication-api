import { Provider, route53, acm, apigatewayv2, Region } from '@pulumi/aws';
import { getName } from './_utils';

export const createApiGatewayResources = async (stackName: string, stage: string, region: string, domain: string, allowOrigin: string, dnsZone: string) => {
	const awsRegion = new Provider(`${stackName}-${stage}-provider-${region}`, { region: region as Region });
	const zone = route53.getZoneOutput({ name: dnsZone });

	const sslCertificate = await new acm.Certificate(getName('sslCert'), { domainName: domain, validationMethod: 'DNS' }, { provider: awsRegion });

	const sslCertificateValidationDnsRecord = await new route53.Record(getName('sslCertValidationDnsRecord'), {
		zoneId: zone.id,
		name: sslCertificate.domainValidationOptions[0].resourceRecordName,
		type: sslCertificate.domainValidationOptions[0].resourceRecordType,
		records: [sslCertificate.domainValidationOptions[0].resourceRecordValue],
		ttl: 10 * 60,
	});

	const validatedCertificate = await new acm.CertificateValidation(
		getName('sslCertValidation'),
		{ certificateArn: sslCertificate.arn, validationRecordFqdns: [sslCertificateValidationDnsRecord.fqdn] },
		{ provider: awsRegion }
	);

	const apiDomain = await new apigatewayv2.DomainName(getName('domainName'), {
		domainName: domain,
		domainNameConfiguration: {
			certificateArn: validatedCertificate.certificateArn,
			endpointType: 'REGIONAL',
			securityPolicy: 'TLS_1_2',
		},
	});

	await new route53.Record(getName('record'), {
		zoneId: zone.id,
		type: 'A',
		name: domain,
		aliases: [
			{
				name: apiDomain.domainNameConfiguration.apply((domainNameConfiguration) => domainNameConfiguration.targetDomainName),
				zoneId: apiDomain.domainNameConfiguration.apply((domainNameConfiguration) => domainNameConfiguration.hostedZoneId),
				evaluateTargetHealth: false,
			},
		],
	});

	const accessControlAllowOrigins = [allowOrigin];
	if (stage === 'beta') accessControlAllowOrigins.push('http://localhost:4200');

	const api = await new apigatewayv2.Api(getName('api'), {
		protocolType: 'HTTP',
		corsConfiguration: {
			allowCredentials: true,
			allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
			allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			allowOrigins: accessControlAllowOrigins,
		},
	});

	const apiStage = await new apigatewayv2.Stage(getName('api-stage'), {
		apiId: api.id,
		name: stage,
		autoDeploy: true,
	});

	await new apigatewayv2.ApiMapping(getName('api-mapping'), {
		apiId: api.id,
		domainName: apiDomain.domainName,
		stage: apiStage.id,
	});

	return { api };
};
