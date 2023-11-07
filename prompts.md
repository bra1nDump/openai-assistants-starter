Write me a typescript cloudfare worker that will use openai.beta assistant, threads and runs to create an example assistant and run it.

The worker well expose a single hardcoded assistant, to which you can submit messages.
At will exposed two endpoints:

POST /threads
It will simply return an idea of the thread created

POST /threads/:threadId/messages
Will accept plain text in the body and return the response from the assistant as plain text as well

# Thread creation
A thread will be created on a post, threads are not associated with a given assistant, they are just a way to group messages.

# Message submission

## Assistant retrieval and creation (will happen for sumbission of any message)
Internally the worker will list all the available assistants, check if the assistant with the hardcoded name is already created, use its identifier.
If the assistant is not created, it will create it with hardcoded parameters and use its identifier.

## Message submission

This is the tricky one, let's start coding up a assistant without custom tools to start with.

Use the documentation in [](./assistants-documentation/) to use the openai node apis.
Use the [playground assistants log](./assistants-documentation/playground%20assistants%20log.md) to understand how to sequence the calls.
