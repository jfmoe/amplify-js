// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Amplify } from '@aws-amplify/core';
import { assertTokenProviderConfig } from '@aws-amplify/core/internals/utils';
import { fetchAuthSession } from '../../../';
import { getRegion } from '../utils/clients/CognitoIdentityProvider/utils';
import { assertAuthTokens } from '../utils/types';
import { deleteUser as serviceDeleteUser } from '../utils/clients/CognitoIdentityProvider';
import { DeleteUserException } from '../types/errors';
import { tokenOrchestrator } from '../tokenProvider';
import { signOut } from '..';

/**
 * Deletes a user from the user pool while authenticated.
 *
 * @throws - {@link DeleteUserException}
 * @throws AuthTokenConfigException - Thrown when the token provider config is invalid.
 */
export async function deleteUser(): Promise<void> {
	const authConfig = Amplify.getConfig().Auth?.Cognito;
	assertTokenProviderConfig(authConfig);

	const { tokens } = await fetchAuthSession();
	assertAuthTokens(tokens);

	try {
		await serviceDeleteUser(
			{ region: getRegion(authConfig.userPoolId) },
			{
				AccessToken: tokens.accessToken.toString(),
			}
		);
	} catch (error) {
		if (
			error instanceof SyntaxError &&
			error.message === 'Unexpected end of JSON input'
		) {
			// TODO: fix this error and remove try/catch block
			// this error is caused when parsing empty client response.
			// Swallow error as a workaround
		} else {
			throw error;
		}
	}
	await signOut();
	await tokenOrchestrator.clearDeviceMetadata();
}