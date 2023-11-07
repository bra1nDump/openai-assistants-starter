import { RequestLike, Router } from "itty-router";
import { OpenAI } from "openai";

interface Env {
  OPENAI_API_KEY: string;
}

// Hardcoded assistant details
const ASSISTANT_NAME = "My Assistant with a custom tool to add two numbers";
const ASSISTANT_MODEL = "gpt-4-1106-preview";
const ASSISTANT_DESCRIPTION =
  "A friendly assistant to help you with your queries.";

// Router setup using itty-router
const router = Router();

// Endpoint to create a new thread
router.post("/threads", async (request: RequestLike, openai: OpenAI) => {
  const thread = await openai.beta.threads.create({});
  return new Response(JSON.stringify({ threadId: thread.id }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Your tool (a fancy name for a function)
async function addNumbers(a: number, b: number): Promise<number> {
  // An actual tool will likely do some asynchronous stuff, like calling an API
  await new Promise((resolve) => setTimeout(resolve, 100));
  return a + b;
}

// Endpoint to post a message to a thread and get a response from the assistant
router.post(
  "/threads/:threadId/messages",
  async (request: RequestLike, openai: OpenAI) => {
    const url = new URL(request.url);
    const threadId = url.pathname.split("/")[2]; //
    const requestBody = await request.text();

    // Retrieve or create the assistant
    let assistant = (await openai.beta.assistants.list()).data.find(
      (a) => a.name === ASSISTANT_NAME
    );

    // If the assistant doesn't exist, create it
    if (!assistant) {
      assistant = await openai.beta.assistants.create({
        name: ASSISTANT_NAME,
        model: ASSISTANT_MODEL,
        instructions: ASSISTANT_DESCRIPTION,
        // Adding an example tool
        tools: [
          {
            type: "function",
            function: {
              name: "addNumbers",
              description: "Add two numbers",
              parameters: {
                type: "object",
                properties: {
                  a: { type: "number", description: "First number" },
                  b: { type: "number", description: "Second number" },
                },
                required: ["a", "b"],
              },
            },
          },
        ],
      });
    }

    // Create a message in the thread
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: requestBody,
    });

    // Run the assistant on the thread to get a response
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistant.id,
    });

    // Poll for the completion of the run
    let completedRun;
    do {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Delay for 1 second
      completedRun = await openai.beta.threads.runs.retrieve(threadId, run.id);

      // KEY Check if status requires action then run our custom function
      if (
        completedRun.status === "requires_action" &&
        completedRun.required_action
      ) {
        const toolCalls =
          completedRun.required_action.submit_tool_outputs.tool_calls;
        for (const toolCall of toolCalls) {
          if (toolCall.function.name === "addNumbers") {
            // KEY Actually call the tool

            // TODO: Add zod validation later
            const args = JSON.parse(toolCall.function.arguments);
            const result = await addNumbers(args.a, args.b);

            // KEY Submit the output back to the run
            await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
              tool_outputs: [
                {
                  tool_call_id: toolCall.id,
                  output: JSON.stringify({ result }),
                },
              ],
            });
          }
        }

        // Continue polling for completion
        continue;
      }

      // Return if the run appears dead
      if (
        completedRun.status === "cancelled" ||
        completedRun.status === "cancelling" ||
        completedRun.status === "failed" ||
        completedRun.status === "expired"
      ) {
        return new Response(
          `Run stopped due to status: ${completedRun.status}`,
          {
            headers: { "Content-Type": "text/plain" },
          }
        );
      }
    } while (completedRun.status !== "completed");

    // Retrieve the messages added by the Assistant to the Thread after the Run completes
    const messages = await openai.beta.threads.messages.list(threadId);

    // A bunch of boring safety checks
    const lastMessage = messages.data.at(0);
    if (lastMessage?.role !== "assistant") {
      return new Response("Last message not from the assistant", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    const assistantMessageContent = lastMessage.content.at(0);
    if (!assistantMessageContent) {
      return new Response("No assistant message found", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (assistantMessageContent.type !== "text") {
      return new Response(
        "Assistant message is not text, only text supported in this demo",
        {
          headers: { "Content-Type": "text/plain" },
        }
      );
    }

    // Return the assistant's response
    return new Response(assistantMessageContent.text.value, {
      headers: { "Content-Type": "text/plain" },
    });
  }
);

router.all("*", () => new Response("Not found", { status: 404 }));

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Set up OpenAI configuration with the API key
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    return router.handle(request, openai);
  },
};
