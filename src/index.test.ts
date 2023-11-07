import { describe, expect, it, beforeAll, afterAll } from "vitest";

/**
 * These tests assume you are running the compound launch.json in VSCode
 * that starts the Worker and runs these tests.
 * You can set breakpoints in both!
 */
describe("Assistant can reply", () => {
	beforeAll(async () => {
		// We need to wait a bit to let the worker start
		await new Promise((resolve) => setTimeout(resolve, 2_000));
	})

	beforeAll(async () => {
		// TODO: Check the server is running run /health or something
	});

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
	});
});
