import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {ChatConversationalAgentOutputParser} from "./outputParser.js";

describe('ChatConversationalAgentOutputParser', () => {
  const toolAction = 'Toolname';
  const toolActionInput = 'ToolInput';
  const finalAction = "Final Answer";
  const finalActionInput = "Boooya!";

  let parser: ChatConversationalAgentOutputParser;
  let text: string;

  interface CreateAcionAndInputParams {
    action?: string,
    action_input?: string,
    prefix?: string,
    suffix?: string
  }

  function textWithActionAndInput({action, action_input, prefix = '', suffix = ''}: CreateAcionAndInputParams) {
    return `${prefix}${JSON.stringify({
      action,
      action_input
    })}${suffix}`;
  }

  beforeEach(() => {
    parser = new ChatConversationalAgentOutputParser();
  });

  test('handles final answer', async () => {
    text = textWithActionAndInput({
      action: finalAction,
      action_input: finalActionInput
    });
    const {returnValues, log} = await parser.parse(text);

    expect(returnValues).toEqual({output: finalAction});
    expect(log).toEqual(text);
  });

  test('handles tool action', async () => {
    text = textWithActionAndInput({
      action: toolAction,
      action_input: toolActionInput
    });
    const {tool, toolInput, log} = await parser.parse(text);

    expect(tool).toEqual(toolAction);
    expect(toolInput).toEqual(toolActionInput);
    expect(log).toEqual(text);
  });

  test('handles finding in JSON markdown', async () => {
    text = textWithActionAndInput({
      action: finalAction,
      action_input: finalActionInput,
      prefix: "```json\n",
      suffix: "```"
    });
    const {returnValues, log} = await parser.parse(text);

    expect(returnValues).toEqual({output: finalAction});
    expect(log).toEqual(text);
  });

  test('handles finding in markdown', async () => {
    text = textWithActionAndInput({
      action: finalAction,
      action_input: finalActionInput,
      prefix: "```\n",
      suffix: "```"
    });
    const {returnValues, log} = await parser.parse(text);

    expect(returnValues).toEqual({output: finalAction});
    expect(log).toEqual(text);
  });

  test('handles no action', async () => {
    text = textWithActionAndInput({
      action_input: finalActionInput
    });

    await expect(parser.parse(text)).rejects.toThrowError(`\`action\` could not be found in: ${text}`);
  });

  test('handles no action input', async () => {
    text = textWithActionAndInput({
      action: finalActionInput,
    });

    await expect(parser.parse(text)).rejects.toThrowError(`\`action_input\` could not be found in: ${text}`);
  });
});
