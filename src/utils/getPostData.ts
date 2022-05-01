import type { IncomingMessage } from "http"

export function getPostData(params: { req: IncomingMessage }) {

	const { req } = params;

	return new Promise<string>((resolve, reject) => {

		try {
			let body = "";

			req.on("data", chunk => {
				body += chunk.toString();
			});

			req.on("end", () => {
				resolve(body);
			})

		} catch (err) {
			reject(err);
		}

	})
}