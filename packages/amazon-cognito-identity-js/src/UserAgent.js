import { getUserAgent } from './Platform';
import { authCategory } from './Platform/constants';

// constructor
function UserAgent() {}
// public
UserAgent.prototype.userAgent = getUserAgent();

export const appendToCognitoUserAgent = content => {
	if (!content) {
		return;
	}
	if (
		UserAgent.prototype.userAgent &&
		!UserAgent.prototype.userAgent.includes(content)
	) {
		UserAgent.prototype.userAgent = UserAgent.prototype.userAgent.concat(
			' ',
			content
		);
	}
	if (!UserAgent.prototype.userAgent || UserAgent.prototype.userAgent === '') {
		UserAgent.prototype.userAgent = content;
	}
};

export const addAuthCategoryToCognitoUserAgent = () => {
	UserAgent.category = authCategory;
};

export const addFrameworkToCognitoUserAgent = framework => {
	UserAgent.framework = framework;
};

export const getAmplifyUserAgentString = action => {
	const uaCategoryAction = UserAgent.category ? ` ${UserAgent.category}` : '';
	const uaFramework = UserAgent.framework
		? ` framework/${UserAgent.framework}`
		: '';

	const userAgent = `${UserAgent.prototype.userAgent}${uaCategoryAction}${uaFramework}`;

	return userAgent;
};

// class for defining the amzn user-agent
export default UserAgent;
