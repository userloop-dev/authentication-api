export type Response = { statusCode: number; body: string };

export const genericHandler = async (event: any, paramsCheck: string[], f: (body: any) => Promise<Response>): Promise<Response> => {
	try {
		const body = JSON.parse(event.body);
		if (!paramsCheck.every((key: string) => key in body))
			return { statusCode: 500, body: JSON.stringify({ message: `Invalid Params: ${paramsCheck.join(', ')}` }) };
		return await f(body);
	} catch (error) {
		return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error', error }) };
	}
};
