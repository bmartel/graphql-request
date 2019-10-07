export type Variables = { [key: string]: any }

export interface Headers {
	[key: string]: string
}

export interface Options {
	method?: RequestInit['method']
	headers?: Headers
	mode?: RequestInit['mode']
	credentials?: RequestInit['credentials']
	cache?: RequestInit['cache']
	redirect?: RequestInit['redirect']
	referrer?: RequestInit['referrer']
	referrerPolicy?: RequestInit['referrerPolicy']
	integrity?: RequestInit['integrity']
}

export interface GraphQLError {
	message: string
	locations: { line: number, column: number }[]
	path: string[]
}

export interface GraphQLResponse {
	data?: any
	errors?: GraphQLError[]
	extensions?: any
	status: number
	[key: string]: any
}

export interface GraphQLRequestContext {
	query?: string
	variables?: Variables
	operations?: string;
	map?: string;
	[key: string]: any;
}
