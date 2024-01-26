import express from 'express'

const regExpToParseExpressPathRegExp = /^\/\^\\\/(?:(:?[\w\\.-]*(?:\\\/:?[\w\\.-]*)*)|(\(\?:\(\[\^\\\/]\+\?\)\)))\\\/.*/
const regExpToReplaceExpressPathRegExpParams = /\(\?:\(\[\^\\\/]\+\?\)\)/
const regexpExpressParamRegexp = /\(\?:\(\[\^\\\/]\+\?\)\)/g

const EXPRESS_ROOT_PATH_REGEXP_VALUE = '/^\\/?(?=\\/|$)/i'
const STACK_ITEM_VALID_NAMES: string[] = [
    'router',
    'bound dispatch',
    'mounted_app'
]

interface Endpoint {
    path: string
    methods: string[]
    middlewares: express.RequestHandler[]
}

/**
 * Returns all the verbs detected for the passed route
 */
const getRouteMethods = function (route: any): string[] {
    let methods = Object.keys(route.methods)

    methods = methods.filter((method) => method !== '_all')
    methods = methods.map((method) => method.toUpperCase())

    return methods
}

/**
 * Returns the names (or anonymous) of all the middlewares attached to the
 * passed route
 */
const getRouteMiddlewares = function (route: any): express.RequestHandler[] {
    return route.stack.map((item: any) => {
        return item.handle
    })
}

/**
 * Returns true if found regexp related with express params
 */
const hasParams = function (expressPathRegExp: string): boolean {
    return regexpExpressParamRegexp.test(expressPathRegExp)
}

const parseExpressRoute = function (route: any, basePath: string): Endpoint[] {
    const paths: string[] = []

    if (Array.isArray(route.path)) {
        paths.push(...route.path)
    } else {
        paths.push(route.path)
    }

    const endpoints = paths.map((path) => {
        const completePath = basePath && path === '/'
            ? basePath
            : `${basePath}${path}`

        const endpoint = {
            path: completePath,
            methods: getRouteMethods(route),
            middlewares: getRouteMiddlewares(route)
        }

        return endpoint
    })

    return endpoints
}

const parseExpressPath = function (expressPathRegExp: RegExp, params: any[]): string {
    let expressPathRegExpExec = regExpToParseExpressPathRegExp.exec(expressPathRegExp.toString())
    let parsedRegExp = expressPathRegExp.toString()
    let paramIndex = 0

    while (hasParams(parsedRegExp)) {
        const paramName = params[paramIndex].name
        const paramId = `:${paramName}`

        parsedRegExp = parsedRegExp
            .replace(regExpToReplaceExpressPathRegExpParams, paramId)

        paramIndex++
    }

    if (parsedRegExp !== expressPathRegExp.toString()) {
        expressPathRegExpExec = regExpToParseExpressPathRegExp.exec(parsedRegExp)
    }

    const parsedPath = expressPathRegExpExec![1].replace(/\\\//g, '/')

    return parsedPath
}

const parseEndpoints = function (app: express.Express, basePath?: string, endpoints?: Endpoint[]): Endpoint[] {
    const stack = app.stack || (app._router && app._router.stack)

    endpoints = endpoints || []
    basePath = basePath || ''

    if (stack)
        endpoints = parseStack(stack, basePath, endpoints)

    return endpoints
}

const parseStack = function (stack: any[], basePath: string, endpoints: Endpoint[]): any[] {
    stack.forEach((stackItem) => {
        if (stackItem.route) {
            const newEndpoints = parseExpressRoute(stackItem.route, basePath)

            endpoints.push(...newEndpoints)
        } else if (STACK_ITEM_VALID_NAMES.includes(stackItem.name)) {
            const isExpressPathRegexp = regExpToParseExpressPathRegExp.test(stackItem.regexp)

            let newBasePath = basePath

            if (isExpressPathRegexp) {
                const parsedPath = parseExpressPath(stackItem.regexp, stackItem.keys)

                newBasePath += `/${parsedPath}`
            } else if (!stackItem.path && stackItem.regexp && stackItem.regexp.toString() !== EXPRESS_ROOT_PATH_REGEXP_VALUE) {
                const regExpPath = ` RegExp(${stackItem.regexp}) `

                newBasePath += `/${regExpPath}`
            }

            endpoints = parseEndpoints(stackItem.handle, newBasePath, endpoints)
        }
    })

    return endpoints
}

/**
 * Returns an array of strings with all the detected endpoints
 */
const getEndpoints = function (app: express.Express): Endpoint[] {
    const endpoints = parseEndpoints(app)

    return endpoints
}

export = getEndpoints