import { test, expect } from "@jest/globals";
import { ChatConversationalAgentOutputParser } from "../chat_convo/outputParser.js";

test("Can parse JSON with text in front of it", async () => {
  const testCases = [
    {
      input: `Based on the information from the search, I can provide you with a query to get all the orders for the email \`example@gmail.com\`. Here's the query:\n\n\`\`\`sql\nSELECT * FROM orders\nJOIN users ON users.id = orders.user_id\nWHERE users.email = 'example@gmail.com'\n\`\`\`\n\nPlease make any necessary modifications depending on your database schema and table structures. Run this query on your database to retrieve the orders made by the specified user.\n\n\`\`\`json\n{\n  "action": "Final Answer",\n  "action_input": "To get all the orders for a user with the email \`example@gmail.com\`, you can use the following query:\\n\\n\`\`\`\\nSELECT * FROM orders\\nJOIN users ON users.id = orders.user_id\\nWHERE users.email = 'example@gmail.com'\\n\`\`\`\\n\\nPlease make any necessary modifications depending on your database schema and table structures. Run this query on your database to retrieve the orders made by the specified user."\n}\n\`\`\``,
      output: `{\n  "action": "Final Answer",\n  "action_input": "To get all the orders for a user with the email \`example@gmail.com\`, you can use the following query:\\n\\n\`\`\`\\nSELECT * FROM orders\\nJOIN users ON users.id = orders.user_id\\nWHERE users.email = 'example@gmail.com'\\n\`\`\`\\n\\nPlease make any necessary modifications depending on your database schema and table structures. Run this query on your database to retrieve the  made by the specifsredroied user."\n}`,
      tool: "Final Answer",
      toolInput: "To get all the orders for a user with the email ",
    },

    {
      input:
        'Here is an example of a valid JSON object matching the provided spec:\n\n```json\n{\n  "action": "metabase",\n  "action_input": ["GET", "/api/table/1"]\n}\n```\n\nIn this example, the "action" key has a string value of "metabase", and the "action_input" key has an array value containing two elements: a string value of "GET" and a string value of "/api/table/1". This JSON object could be used to make a request to a Metabase API endpoint with the specified method and arguments.',
      output: `{ "action": "metabase", "action_input": ["GET", "/api/table/1"] } `,
      tool: "metabase",
      toolInput: ["GET", "/api/table/1"],
    },
    {
      input:
        '```\n{\n  "action": "metabase",\n  "action_input": ["GET", "/api/table/1"]\n}\n```',
      output: `{ "action": "metabase", "action_input": ["GET", "/api/table/1"] } `,
      tool: "metabase",
      toolInput: ["GET", "/api/table/1"],
    },
    {
      input:
        'Here we have some boilerplate nonsense```\n{\n "action": "blogpost",\n  "action_input": "```sql\\nSELECT * FROM orders\\nJOIN users ON users.id = orders.user_id\\nWHERE users.email = \'bud\'```"\n}\n``` and at the end there is more nonsense',
      output:
        '{"action":"blogpost","action_input":"```sql\\nSELECT * FROM orders\\nJOIN users ON users.id = orders.user_id\\nWHERE users.email = \'bud\'```"}',
      tool: "blogpost",
      toolInput:
        "```sql\nSELECT * FROM orders\nJOIN users ON users.id = orders.user_id\nWHERE users.email = 'bud'```",
    },
    {
      input:
        'Here we have some boilerplate nonsense```json\n{\n \t\r\n"action": "blogpost",\n\t\r  "action_input": "```sql\\nSELECT * FROM orders\\nJOIN users ON users.id = orders.user_id\\nWHERE users.email = \'bud\'```"\n\t\r}\n\n\n\t\r``` and at the end there is more nonsense',
      output:
        '{"action":"blogpost","action_input":"```sql\\nSELECT * FROM orders\\nJOIN users ON users.id = orders.user_id\\nWHERE users.email = \'bud\'```"}',
      tool: "blogpost",
      toolInput:
        "```sql\nSELECT * FROM orders\nJOIN users ON users.id = orders.user_id\nWHERE users.email = 'bud'```",
    },
    {
      input:
        '{"action":"ToolWithJson","action_input":"The tool input ```json\\n{\\"yes\\":true}\\n```"}',
      output:
        '{"action":"ToolWithJson","action_input":"The tool input ```json\\n{\\"yes\\":true}\\n```"}',
      tool: "ToolWithJson",
      toolInput: 'The tool input ```json\n{"yes":true}\n```',
    },
  ];

  const p = new ChatConversationalAgentOutputParser();
  for (const message of testCases) {
    const parsed = await p.parse(message.input);
    expect(parsed).toBeDefined();
    if (message.tool === "Final Answer") {
      expect(parsed.returnValues).toBeDefined();
    } else {
      expect(parsed.tool).toEqual(message.tool);

      if (typeof message.toolInput === "object") {
        expect(message.toolInput).toEqual(parsed.toolInput);
      }
      if (typeof message.toolInput === "string") {
        expect(message.toolInput).toContain(parsed.toolInput);
      }
    }
  }
});

test("will throw exceptions if action or action_input are not found", async () => {
  const parser = new ChatConversationalAgentOutputParser();

  type MissingItem = "action" | "action_input";
  type TestCase = { message: string; missing: MissingItem };

  const testCases: TestCase[] = [
    {
      message: "",
      missing: "action",
    },
    {
      message: '{"action": "Final Answer"}',
      missing: "action_input",
    },
    {
      message: '{"action_input": "I have no action"}',
      missing: "action",
    },
    {
      message:
        'I have a prefix ```json\n{"action_input": "I have no action"}```',
      missing: "action",
    },
    {
      message: 'I have a prefix ```{"action_input": "I have no action"}```',
      missing: "action",
    },
    {
      message:
        'I have a prefix ```json\n{"action_input": "I have no action"}\n```',
      missing: "action",
    },
    {
      message: 'I have a prefix ```\n{"action_input": "I have no action"}\n```',
      missing: "action",
    },

    {
      message: 'I have a prefix ```json\n{"action": "ToolThing"}```',
      missing: "action_input",
    },
    {
      message: 'I have a prefix ```{"action": "ToolThing"}```',
      missing: "action_input",
    },
    {
      message: 'I have a prefix ```json\n{"action": "ToolThing"}\n```',
      missing: "action_input",
    },
    {
      message: 'I have a prefix ```\n{"action": "ToolThing"}\n```',
      missing: "action_input",
    },
  ];

  for (const { message, missing } of testCases) {
    await expect(parser.parse(message)).rejects.toThrow(
      `\`${missing}\` could not be found in: "${message}"`
    );
  }
});
