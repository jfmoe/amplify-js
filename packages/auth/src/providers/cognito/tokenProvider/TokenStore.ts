import {
	AmplifyV6,
	KeyValueStorageInterface,
	assertTokenProviderConfig,
	asserts,
	decodeJWT,
} from '@aws-amplify/core';
import {
	AuthKeys,
	AuthStorageKeys,
	AuthTokenStore,
	CognitoAuthTokens,
} from './types';

export class DefaultTokenStore implements AuthTokenStore {
	constructor() {}
	keyValueStorage: KeyValueStorageInterface;

	setKeyValueStorage(keyValueStorage: KeyValueStorageInterface) {
		this.keyValueStorage = keyValueStorage;
		return;
	}

	async loadTokens(): Promise<CognitoAuthTokens> {
		const authConfig = AmplifyV6.getConfig().Auth;
		assertTokenProviderConfig(authConfig);

		// TODO(v6): migration logic should be here
		// Reading V5 tokens old format

		// Reading V6 tokens
		try {
			const name = 'Cognito'; // TODO(v6): update after API review for Amplify.configure
			const authKeys = createKeysForAuthStorage(
				name,
				authConfig?.userPoolWebClientId || 'cliendId'
			);

			const accessTokenString = await this.keyValueStorage.getItem(
				authKeys.accessToken
			);

			if (accessTokenString === null || accessTokenString === undefined) {
				throw new Error('No session');
			}

			const accessToken = decodeJWT(accessTokenString);
			const itString = await this.keyValueStorage.getItem(authKeys.idToken);
			const idToken = itString ? decodeJWT(itString) : undefined;

			const metadata = JSON.parse(
				(await this.keyValueStorage.getItem(authKeys.metadata)) || '{}'
			);

			const clockDriftString =
				(await this.keyValueStorage.getItem(authKeys.clockDrift)) || '0';
			const clockDrift = Number.parseInt(clockDriftString);

			return {
				accessToken,
				idToken,
				metadata,
				clockDrift,
			};
		} catch (err) {
			console.warn(err);
			// TODO(v6): validate partial results with mobile implementation
			throw new Error('No valid tokens');
		}
	}
	async storeTokens(tokens: CognitoAuthTokens): Promise<void> {
		const authConfig = AmplifyV6.getConfig().Auth;
		assertTokenProviderConfig(authConfig);
		asserts(!(tokens === undefined), {
			message: 'Invalid tokens',
			name: 'InvalidAuthTokens',
			recoverySuggestion: 'Make sure the tokens are valid',
		});

		const name = 'Cognito'; // TODO(v6): update after API review for Amplify.configure
		const authKeys = createKeysForAuthStorage(
			name,
			authConfig.userPoolWebClientId || 'clientId'
		);

		this.keyValueStorage.setItem(
			authKeys.accessToken,
			tokens.accessToken.toString()
		);

		if (!!tokens.idToken) {
			this.keyValueStorage.setItem(authKeys.idToken, tokens.idToken.toString());
		}

		this.keyValueStorage.setItem(
			authKeys.metadata,
			JSON.stringify(tokens.metadata)
		);

		this.keyValueStorage.setItem(authKeys.clockDrift, `${tokens.clockDrift}`);
	}

	async clearTokens(): Promise<void> {
		const authConfig = AmplifyV6.getConfig().Auth;
		assertTokenProviderConfig(authConfig);

		const name = 'Cognito'; // TODO(v6): update after API review for Amplify.configure
		const authKeys = createKeysForAuthStorage(
			name,
			authConfig?.userPoolWebClientId || 'clientId'
		);

		// Not calling clear because it can remove data that is not managed by AuthTokenStore
		await Promise.all([
			this.keyValueStorage.removeItem(authKeys.accessToken),
			this.keyValueStorage.removeItem(authKeys.idToken),
			this.keyValueStorage.removeItem(authKeys.clockDrift),
			this.keyValueStorage.removeItem(authKeys.metadata),
		]);
	}
}

const createKeysForAuthStorage = (provider: string, identifier: string) => {
	return getAuthStorageKeys(AuthStorageKeys)(
		`com.amplify.${provider}`,
		identifier
	);
};

export function getAuthStorageKeys<T extends Record<string, string>>(
	authKeys: T
) {
	const keys = Object.values({ ...authKeys });
	return (prefix: string, identifier: string) =>
		keys.reduce(
			(acc, authKey) => ({
				...acc,
				[authKey]: `${prefix}.${identifier}.${authKey}`,
			}),
			{} as AuthKeys<keyof T & string>
		);
}
