# hackerati
At a high level, this codebase is broken down into two primary parts: actions and schemas. Schemas are used
to define and validate data types. Actions are what manages store CRUDing. For the store, I went with redis.
All redis client functionality is wrapped by actions.

In theory, this code would be integrated into an existing app. Actions act as route, or -- in the case
that the auction app uses Graphql, resolver handlers. Every action returns a promise, so when they are consumed,
they require a final then and catch to handle the action's result or any errors.

The data types adhere to a normalized architecture. I believed that the relationships between these data types
warranted a relational design, as opposed to denormalized.

To setup your environment to run this codebase's tests you need the following (for installation details please reference provided links):

Node v6.9.1 or greater: https://nodejs.org/en/download/
NPM: is installed with Node
Redis: v3.2.0 https://redis.io/download

Once you've finished setting up your environment, cd into the directory where you cloned this repo and run npm install.
At this point, you should be ready to go! The last step before you can run the tests, is starting redis by executing redis-server in your terminal.

You should now pop a new terminal and run the tests by executing npm run test!

I've also included my implementation of consecutiveRuns in src/lib/utils.js. Its tests are in src/lib/utils.test.js.
