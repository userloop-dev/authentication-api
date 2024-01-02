import { randomBytes } from 'crypto';
import { s3 } from '@pulumi/aws';
import { FileAsset } from '@pulumi/pulumi/asset';
import { getName } from './_utils';

export const avatarBucket = new s3.Bucket(getName('avatarBucket'), {
	// Generate random ID to avoid bucket name conflicts
	bucket: getName(`avatar-bucket`),
	acl: 'private',
});

export const createDefaultAvatar = async () => {
	const defaultAvatar = new FileAsset('./avatars/avatar-default.png');
	return new s3.BucketObject(getName('avatarDefault'), {
		bucket: avatarBucket.id,
		key: 'defaultAvatar.png',
		source: defaultAvatar,
	});
};
