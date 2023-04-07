/**
 * General None HTTP-specific request interface
 */
export interface Request {
	url: URL;
	body?: unknown;
}

export interface Response {
	body: unknown;
}

export interface TransferHandler<
	Input extends Request,
	Output extends Response,
	TransferOptions
> {
	(request: Input, options: TransferOptions): Promise<Output>;
}

/**
 * A slimmed down version of the AWS SDK v3 middleware handler, only handling instantiated requests
 */
export type MiddlewareHandler<
	Input extends Request,
	Output extends Response
> = (request: Input) => Promise<Output>;

export type MiddlewareContext = {
	/**
	 * The number of times the request has been attempted. This is set by retry middleware
	 */
	attemptsCount?: number;
};

/**
 * A slimmed down version of the AWS SDK v3 middleware, only handling tasks after Serde.
 */
export type Middleware<
	Input extends Request,
	Output extends Response,
	MiddlewareOptions
> = (
	options: MiddlewareOptions
) => (
	next: MiddlewareHandler<Input, Output>,
	context: MiddlewareContext
) => MiddlewareHandler<Input, Output>;