# hackerati
At a high level, this codebase is broken down into two primary parts: actions and schemas. Schemas are used
to define and validate data types. Actions manage store CRUDing. For the store, I went with redis.
All redis client functionality is wrapped by actions.

In theory, this code would be integrated into an existing app. Actions act as route, or--in the case
that the auction app uses Graphql--resolver handlers and would be imported into those domains.
Every action returns a promise, so when they are consumed, they require a final then and catch to handle the action's result or any errors.

The data types adhere to a normalized architecture. I believed that the relationships between these data types
warranted a relational design, as opposed to a denormalized one.

To setup your environment to run this codebase's tests you need the following (for installation details please reference provided links):

Node v6.9.1 or greater: https://nodejs.org/en/download/
NPM: is installed with Node
Redis: v3.2.0 https://redis.io/download

Once you've finished setting up your environment, cd into the directory where you cloned this repo and run npm install.
The last step before you can run the tests, is starting redis by executing redis-server in your terminal.

If you'd like, you can place .env.[environment_name] files in the root dir of the app, which will set env vars on process.env (https://www.npmjs.com/package/dotenv). For example, I use two: .env.development and .env.test. In each, I set REDIS_DB to different zero-indexed integers. If you choose to skip this step, no worries! Redis client will default to db number 0. 

You should now pop a new terminal and run the tests by executing npm run test!

I've also included my implementation of consecutiveRuns in src/lib/utils.js. Its tests are in src/lib/utils.test.js.
