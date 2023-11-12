# beta openai example: assistants + threads + runs

- TypeScript
- Cloudflare Workers
- OpenAI node.js SDK

## This project includes:
- VSCode debugging with breakpoints for both the worker and the unit tests
- Unit tests
- 2 endpoints
  - `POST /threads` that creates a new thread and returns the thread id
  - `POST /threads/:threadId/messages`
    - Reads user message from the request body as plain text
    - Adds a message to a thread
    - Creats an assistant if it doesn't exist
    - Runs the assistant on the thread
    - Polls the run until it's completed
    - Returns the assistant response as plain text

## Running
1. Clone the repo and run `npm install`
2. Copy `wrangler.example.toml` to `wrangler.toml` and fill in the OpenAI API key
3. Assuming you are using VSCode, press F5 to start the worker
   1. You can also select `Worker + Test` to run the unit tests and see the worker in action (all breakpoitable!)

## Other goodies
I have included assistant-documentation that you can simply paste into chatgpt to answer any questions about the new beta.assistants API. I have actually used this to build the initial version of the code.

- [all documents](./assistants-documentation/)
- [logs from playground (lets you understand how OpenAI implemented their playgrounds roughly)](assistants-documentation/4. playground assistants log.md)
- [prompt to create the index.ts](./assistants-documentation/6.%20prompt%20to%20bootstrap%20this%20project.md)
- [overall prompt I submitted to ChatGPT to generate the index.ts (did reasonably well)](assistants-documentation/7. prompt with all the files above in it.md)