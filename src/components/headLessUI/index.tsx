"use client";

import * as React from "react";
import {
  useAgent,
  useComponent,
  useCopilotKit,
  useCopilotChatConfiguration,
  useFrontendTool,
  useRenderTool,
  useRenderToolCall,
} from "@copilotkit/react-core/v2";
import type {
  Message as AgentMessage,
  ToolCall,
  ToolMessage,
} from "@ag-ui/core";
import {
  ArrowUpIcon,
  CircleCheckIcon,
  GlobeIcon,
  LoaderCircleIcon,
  MessageCircleDashedIcon,
  PaperclipIcon,
  PlusIcon,
  RotateCwIcon,
  SquareIcon,
  TelescopeIcon,
  TerminalIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { CodeBlock, CodeBlockContent } from "@/components/ui/code-block";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { useHumanInTheLoop } from "@copilotkit/react-core/v2";

import z from "zod";
import { Appointment, WeatherCard } from "@/app/page";

type ReasoningStep = { kind: "reasoning"; id: string; text: string };
type ToolStep = {
  kind: "tool";
  id: string;
  name: string;
  args: Record<string, unknown>;
  output?: string;
  toolCall: ToolCall; // raw call, needed by renderToolCall
  toolMessage?: ToolMessage; // raw result, once it exists
};
type Step = ReasoningStep | ToolStep;
type Turn =
  | { kind: "user"; id: string; text: string }
  | { kind: "assistant"; id: string; steps: Step[]; reply: string };

function getText(m: AgentMessage): string {
  const c = (m as { content?: unknown }).content;
  if (typeof c === "string") return c;
  if (Array.isArray(c))
    return c.map((p) => (p?.type === "text" ? p.text : "")).join("");
  return "";
}

function safeParse(json: string) {
  try {
    return JSON.parse(json || "{}");
  } catch {
    return {}; // partial JSON while args are still streaming
  }
}

function toTurns(messages: AgentMessage[]): Turn[] {
  const turns: Turn[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      turns.push({ kind: "user", id: m.id, text: getText(m) });
      continue;
    }
    if (m.role === "system" || m.role === "developer" || m.role === "activity")
      continue;

    let turn = turns.at(-1);
    if (!turn || turn.kind !== "assistant") {
      turn = { kind: "assistant", id: m.id, steps: [], reply: "" };
      turns.push(turn);
    }

    if (m.role === "reasoning") {
      turn.steps.push({ kind: "reasoning", id: m.id, text: getText(m) });
    } else if (m.role === "assistant") {
      for (const call of m.toolCalls ?? []) {
        turn.steps.push({
          kind: "tool",
          id: call.id,
          name: call.function.name,
          args: safeParse(call.function.arguments),
          toolCall: call,
        });
      }
      const t = getText(m);
      if (t) turn.reply += (turn.reply ? "\n\n" : "") + t;
    } else if (m.role === "tool") {
      const step = turn.steps.find(
        (s): s is ToolStep => s.kind === "tool" && s.id === m.toolCallId,
      );
      if (step) {
        step.output = getText(m);
        step.toolMessage = m as ToolMessage;
      }
    }
  }
  return turns;
}

const MotionMessageScrollerItem = motion.create(MessageScrollerItem);

export function ChatDemo() {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();

  const [input, setInput] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const renderToolCall = useRenderToolCall();

  useFrontendTool({
    name: "view_weather_card",
    description:
      "Display a weather card to the user. Call this ONCE per city. After it is called, the card is already visible, so do not call it again.",
    parameters: z.object({
      city: z.string().describe("the name of the city"),
    }),
    handler: async ({ city }) =>
      `Weather card for ${city} is now displayed to the user.`,
    render: ({ args }) => <WeatherCard city={args.city!} />,
    // followUp: false, // if your version supports it, this stops the agent re-running after the tool
  });

  useHumanInTheLoop({
    agentId: "default",
    name: "book_appointment",
    description:
      "Ask the user to pick a available time slot for appointment. The picker UI presents available slots; the user's choice is returned to the agent.",
    parameters: z.object({
      slots: z
        .array(z.string())
        .describe("available time slots for appointment"),
    }),
    render: ({ args, status, respond }) => (
      <Appointment args={args} status={status} respond={respond} />
    ),
  });

  const busy = agent.isRunning;
  const turns = toTurns(agent.messages);
  const canSend = input.trim().length > 0 && !busy;

  // console.log(agent.isRunning);
  console.log(agent.messages);
  console.log({ turns });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend) return;
    const content = input.trim();
    setInput("");
    agent.addMessage({ id: crypto.randomUUID(), role: "user", content });
    try {
      await copilotkit.runAgent({ agent });
    } catch (err) {
      console.error("runAgent failed", err);
    }
  }

  function onReset() {
    if (agent.isRunning) agent.abortRun?.(); // stop an in-flight run first
    agent.setMessages([]); // clear the UI
    agent.threadId = crypto.randomUUID(); // fresh LangGraph thread
  }

  return (
    <MessageScrollerProvider>
      <div className="relative flex max-w-2xl w-full flex-col gap-4 [[data-slot=preview]:has(&)]:bg-background [[data-slot=preview]:has(&)>div]:p-0!">
        <div className="flex h-200 w-full flex-col gap-4">
          <div className="flex items-start justify-between gap-4 p-8 pb-4">
            <div className="flex flex-col gap-1">
              <div className="font-medium">New Thread</div>
              <div className="text-sm text-muted-foreground">
                Ask the agent to change your code.
              </div>
            </div>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Reset conversation"
                    onClick={onReset}
                    disabled={busy}
                  >
                    <RotateCwIcon />
                  </Button>
                }
              />
              <TooltipContent>
                <p>Reset</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="min-h-0 flex-1">
            {turns.length === 0 ? (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageCircleDashedIcon />
                  </EmptyMedia>
                  <EmptyTitle>What should we build?</EmptyTitle>
                  <EmptyDescription>
                    The agent can read your code, run commands and make changes.
                    Press send to start.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <MessageScroller>
                <MessageScrollerViewport>
                  <MessageScrollerContent
                    aria-busy={busy}
                    className="gap-6 px-8 py-0"
                  >
                    {turns.map((turn, i) => {
                      if (turn.kind === "user") {
                        return (
                          <MotionMessageScrollerItem
                            key={turn.id}
                            messageId={turn.id}
                            scrollAnchor
                            initial={shouldReduceMotion ? false : "initial"}
                            animate="animate"
                          >
                            <Message align="end">
                              <MessageContent>
                                <Bubble align="end" variant="muted">
                                  <BubbleContent>{turn.text}</BubbleContent>
                                </Bubble>
                              </MessageContent>
                            </Message>
                          </MotionMessageScrollerItem>
                        );
                      }
                      const streaming = busy && i === turns.length - 1;
                      return (
                        <MessageScrollerItem key={turn.id} messageId={turn.id}>
                          <Message>
                            <MessageContent className="gap-3">
                              <Trace>
                                <ReasoningRow
                                  text={"Thinking"}
                                  running={streaming}
                                />
                              </Trace>

                              {turn.steps.length > 0 && (
                                <Trace>
                                  {turn.steps.map((step, j) => (
                                    <StepRow
                                      key={step.id}
                                      step={step}
                                      streaming={streaming}
                                      isLast={
                                        j === turn.steps.length - 1 &&
                                        !turn.reply
                                      }
                                    />
                                  ))}
                                </Trace>
                              )}
                              {turn.reply && (
                                <Markdown remarkPlugins={[remarkGfm]}>
                                  {turn.reply}
                                </Markdown>
                              )}

                              {turn.steps.map((step) =>
                                step.kind === "tool" ? (
                                  <React.Fragment key={step.id}>
                                    {renderToolCall({
                                      toolCall: step.toolCall,
                                      toolMessage: step.toolMessage,
                                    })}
                                  </React.Fragment>
                                ) : null,
                              )}
                            </MessageContent>
                          </Message>
                        </MessageScrollerItem>
                      );
                    })}
                  </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
              </MessageScroller>
            )}
          </div>
          <div className="p-8 pt-0">
            <form ref={formRef} onSubmit={onSubmit} className="w-full">
              <InputGroup>
                <InputGroupTextarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask the agent..."
                  aria-label="Message"
                  className="min-h-14"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      formRef.current?.requestSubmit();
                    }
                  }}
                />
                <InputGroupAddon align="block-end" className="pt-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <InputGroupButton
                          aria-label="Add context"
                          type="button"
                          size="icon-sm"
                          variant="outline"
                        >
                          <PlusIcon />
                        </InputGroupButton>
                      }
                    />
                    <DropdownMenuContent
                      align="start"
                      side="top"
                      className="w-44"
                    >
                      <DropdownMenuItem>
                        <PaperclipIcon />
                        Add Photos & Files
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <TelescopeIcon />
                        Deep Research
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <GlobeIcon />
                        Web Search
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {busy ? (
                    <InputGroupButton
                      type="button"
                      size="icon-sm"
                      className="ml-auto"
                      onClick={() => copilotkit.stopAgent({ agent })}
                    >
                      <SquareIcon />
                    </InputGroupButton>
                  ) : (
                    <InputGroupButton
                      type="submit"
                      variant="default"
                      size="icon-sm"
                      disabled={!canSend}
                      className="ml-auto"
                    >
                      <ArrowUpIcon />
                      <span className="sr-only">Send</span>
                    </InputGroupButton>
                  )}
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

function StepRow({
  step,
  streaming,
  isLast,
}: {
  step: Step;
  streaming: boolean;
  isLast: boolean;
}) {
  if (step.kind !== "tool")
    return (
      <ReasoningRow
        text={step.text ?? "Thinking"}
        running={streaming && isLast}
      />
    );

  return <ToolRow step={step} streaming={streaming} />;
}

function ToolRow({ step, streaming }: { step: ToolStep; streaming: boolean }) {
  const label =
    typeof step.args.command === "string" ? step.args.command : step.name;

  // console.log({ [label]: step.output });

  return (
    <TraceCollapsible>
      <TraceCollapsibleTrigger>
        <TraceLine>
          <TraceIcon>
            <TerminalIcon />
          </TraceIcon>
          <TraceTitle>Ran {label}</TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        {step.output && (
          <CodeBlock size="sm">
            <CodeBlockContent wrap className="max-h-64">
              {step.output}
            </CodeBlockContent>
          </CodeBlock>
        )}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function ReasoningRow({ text, running }: { text: string; running: boolean }) {
  const [open, setOpen] = React.useState<boolean>(false);

  return (
    <TraceCollapsible open={open ?? running} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>
        <TraceLine status={running ? "running" : undefined}>
          <TraceIcon>
            {running ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <CircleCheckIcon />
            )}
          </TraceIcon>
          <TraceTitle>{running ? "Thinking" : "Thought"}</TraceTitle>
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent className="whitespace-pre-wrap">
        {/* {text} */}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}
