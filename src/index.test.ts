import { describe, expect, it, beforeAll, afterAll } from "vitest";

// Large to be able to breakpoint without the test timing out
const timeout = 20_000_000

/**
 * These tests assume you are running the compound launch.json in VSCode
 * that starts the Worker and runs these tests.
 * You can set breakpoints in the worker only, more setup needed with vitest to work with breakpoints.
 */
describe("Assistant can reply", () => {
  beforeAll(async () => {
    // We need to wait a bit to let the worker start
    await new Promise((resolve) => setTimeout(resolve, 2_000));
  })

  beforeAll(async () => {
    // TODO: Check the server is running run /health or something
  });

  // Sanity check, the assistant is able to reply to a very simple message
  it("I can get the assistant to say Hi to me", async () => {
    const response = await fetch("http://localhost:8787/threads", {
      method: "POST",
    });
    const threadJSON: any = await response.json();
    const threadId = threadJSON.threadId;

    const assistantResponse = await fetch(`http://localhost:8787/threads/${threadId}/messages`, {
      method: "POST",
      body: 'Hi there! (Respond with just a "Hi", its a test message)',
    });
    const assistantResponseText = await assistantResponse.text();

    expect(assistantResponseText).toBe("Hi");
  }, {
    timeout
  });

  // Makes sure it actually uses the tool
  it("Assistant can add two large numbers", async () => {
    const num1 = Math.floor(Math.random() * 1e9);
    const num2 = Math.floor(Math.random() * 1e9);

    const response = await fetch("http://localhost:8787/threads", {
      method: "POST",
    });
    const threadJSON: any = await response.json();
    const threadId = threadJSON.threadId;

    const assistantResponse = await fetch(`http://localhost:8787/threads/${threadId}/messages`, {
      method: "POST",
      body: `Add ${num1} and ${num2}. Reply only with the answer.`,
    });
    const assistantResponseText = await assistantResponse.text();

    expect(assistantResponseText).toBe((num1 + num2).toString());
  }, {
    timeout
  });
});
