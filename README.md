# Express List Endpoints 2

[![NPM](https://nodei.co/npm/express-list-endpoints-2.png)](https://nodei.co/npm/express-list-endpoints-2/)

Original package by [albertofdzm](https://www.npmjs.com/~albertofdzm)

Express endpoint parser to retrieve a list of the routes and methods with their given request handlers.

## Example of use

Warning: In contrast to the original package, this package does not merge endpoints which are initialized in different chains.

```javascript
const listEndpoints = require('express-list-endpoints-2')
const app = require('express')();

app.route('/')
    .all(function namedMiddleware(req, res) {
        // Handle request
    })
    .get((req, res) => {
        // Handle request
    })
    .post((req, res) => {
        // Handle request
    });

app.route('/')
    .all(function namedMiddleware2(req, res) {
        // Handle request
    })
    .post((req, res) => {
        // Handle request
    });

app.route('/about')
    .get((req, res) => {
        // Handle request
    })

console.log(listEndpoints(app))

/* It omits the 'all' verbs.
[
  {
    path: '/',
    methods: [ 'GET', 'POST' ],
    middlewares: [
      [Function: namedMiddleware],
      [Function (anonymous)],
      [Function (anonymous)]
    ]
  },
  {
    path: '/',
    methods: [ 'POST' ],
    middlewares: [ [Function: namedMiddleware2], [Function (anonymous)] ]
  },
  {
    path: '/about',
    methods: [ 'GET' ],
    middlewares: [ [Function (anonymous)] ]
  }
]
*/
```

## Arguments

### `app` - Express `app` or `router` instance

Your router instance (`router`) or your app instance (`app`).

_**Note:** Pay attention that before you call this script the router or app must have the endpoints registered first._

## License

Express List Endpoints 2 is [MIT licensed](./LICENSE).
