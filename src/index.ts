import { Headers as HttpHeaders, Options, Variables, GraphQLRequestContext } from './types'
import axios, { AxiosInstance } from 'axios';
import { extractFiles } from './files';

interface AxiosOptions extends Options {
	axios?: AxiosInstance;
}

export class GraphQLClient {
	private url: string
	private options: AxiosOptions;
	private axios: AxiosInstance;

	constructor(url: string, options?: AxiosOptions) {
		this.url = url;
		this.options = (options || {});
		this.options.headers = { 'content-type': 'application/json', ...(this.options.headers || {}) };
		this.axios = this.options.axios! || axios;
		delete this.options.axios;
	}

	async request<T extends any>(
		query: string,
		variables?: Variables,
		multipart: boolean = false,
	): Promise<T> {
		const { headers, ...others } = this.options
		const body = { query, variables: variables || undefined } as GraphQLRequestContext;
		const useMultipart = variables && (multipart || query.indexOf('Upload') > 0);

		let payload: FormData | GraphQLRequestContext = body;

		// if the request is flagged as having files, parse accordingly to the GraphQL multipart request spec:
		// https://github.com/jaydenseric/graphql-multipart-request-spec
		if (useMultipart) {
			const result = extractFiles(body);
			if (result && result.files.size) {
				const { clone, files } = result

				// ensure the browser does teh detection of the form data body to set the header correctly
				delete headers!['content-type']

				const form = new FormData();

				// operations - original graphql request with the files removed
				form.append('operations', JSON.stringify({ query, variables: clone }))

				const map = {}
				let i = 0

				// paths to files within the graphql request variables
				files.forEach((paths: any) => {
					(map as any)[++i] = paths
				})
				form.append('map', JSON.stringify(map))

				// actual files
				i = 0
				files.forEach((paths: any, file: any) => {
					form.append(`${++i}`, file, file.name)
				})

				payload = form;
			}
		}

		const response = await this.axios.post(this.url, payload, {
			headers,
			...others,
		} as any)

		// TODO: make sure this is the actual response, might randomly be nested again under data but hopefully not.
		return response.data;
	}

	setHeaders(headers: HttpHeaders): GraphQLClient {
		this.options.headers = headers

		return this
	}

	setHeader(key: string, value: string): GraphQLClient {
		const { headers } = this.options

		if (headers) {
			headers[key] = value
		} else {
			this.options.headers = { [key]: value }
		}
		return this
	}
}

export async function request<T extends any>(
	url: string,
	query: string,
	variables?: Variables,
	multipart: boolean = false,
): Promise<T> {
	const client = new GraphQLClient(url)

	return client.request<T>(query, variables, multipart)
}

export default request;
