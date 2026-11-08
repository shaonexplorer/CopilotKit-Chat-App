"use client";

import * as React from "react";

import type { UIDataTypes, UIMessage } from "ai";
import {
  ArrowUpIcon,
  CircleCheckIcon,
  GlobeIcon,
  LoaderCircleIcon,
  MessageCircleDashedIcon,
  PaperclipIcon,
  PlusIcon,
  RotateCwIcon,
  TelescopeIcon,
  TerminalIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

// import { MESSAGE_ANIMATIONS } from "@/lib/message-animations";

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
import {
  useAgent,
  useCopilotKit,
  useHumanInTheLoop,
} from "@copilotkit/react-core/v2";

import z from "zod";
import { Appointment } from "@/app/page";

type ChatMessage = UIMessage<
  unknown,
  UIDataTypes,
  {
    runCommand: {
      input: { command: string };
      output: { stdout: string };
    };
  }
>;

type ChatPart = ChatMessage["parts"][number];

type ToolPart = Extract<ChatPart, { type: "tool-runCommand" }>;

// const initialMessages = chat.get(0);
// const transport = chat.transport({
//   delayMs: 16,
//   fallback:
//     "This demo only knows the scripted turns. Press reset to start over.",
// });

const MotionMessageScrollerItem = motion.create(MessageScrollerItem);

export function ChatDemo() {
  //   const { messages, sendMessage, setMessages, status } = useChat({
  //     messages: initialMessages,
  //     transport,
  //   });

  const { agent } = useAgent();

  console.log({ messages: agent.messages });

  const { copilotkit } = useCopilotKit();

  const [input, setInput] = React.useState("");

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

  const formRef = React.useRef<HTMLFormElement>(null);
  const shouldReduceMotion = useReducedMotion();
  //   const nextMessage = chat.next(messages);
  const busy = agent.isRunning;
  //   const text = draft ?? (nextMessage ? getMessageText(nextMessage) : "");
  const canSend = input.trim().length > 0 && !busy;

  const onSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || agent.isRunning) return;

      // 1. Add user message to agent state
      agent.addMessage({
        // id: randomUUID(),
        id: crypto.randomUUID(),
        role: "user",
        content: input,
      });

      setInput("");

      // 2. Stream execution from backend agent framework (e.g., LangGraph)
      await copilotkit.runAgent({ agent });
    },
    [input, agent, copilotkit],
  );

  const stopAgent = React.useCallback(() => {
    copilotkit.stopAgent({ agent });
  }, [agent, copilotkit]);

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
                    onClick={() => {}}
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
            {agent.messages.length === 0 ? (
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
                    {agent.messages.map((message) => {
                      if (message.role === "user") {
                        return (
                          <MotionMessageScrollerItem
                            key={message.id}
                            messageId={message.id}
                            scrollAnchor
                            // variants={MESSAGE_ANIMATIONS["slide-up"].variants}
                            initial={shouldReduceMotion ? false : "initial"}
                            animate="animate"
                          >
                            <Message align="end">
                              <MessageContent>
                                <Bubble align="end" variant="muted">
                                  <BubbleContent>
                                    {/* {getMessageText(message)} */}
                                    {message.content}
                                  </BubbleContent>
                                </Bubble>
                              </MessageContent>
                            </Message>
                          </MotionMessageScrollerItem>
                        );
                      }

                      //   const streaming = busy && message === messages.at(-1);
                      const streaming = agent.isRunning;

                      //   const steps = message?.content?.filter(
                      //     (part) =>
                      //       part.type === "reasoning" ||
                      //       part.type === "tool-runCommand",
                      //   );
                      //   const reply = getMessageText(message);

                      const reply =
                        (message?.toolCalls || message?.toolCallId) &&
                        message.role !== "tool" &&
                        message.content;

                      const steps = !message?.toolCalls && message;

                      //   const steps = message?.role == "reasoning" && message;

                      //   const reply = message.content;

                      return (
                        <MessageScrollerItem
                          key={message.id}
                          messageId={message.id}
                        >
                          <Message>
                            <MessageContent className="gap-3">
                              <Trace>
                                <ReasoningRow
                                  running={streaming}
                                  text={steps.content}
                                />
                              </Trace>

                              {reply && (
                                <Markdown remarkPlugins={[remarkGfm]}>
                                  {reply}
                                </Markdown>
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
                </InputGroupAddon>
              </InputGroup>
            </form>
          </div>
        </div>
      </div>
    </MessageScrollerProvider>
  );
}

function StepRow({ part, streaming }: { part: ChatPart; streaming: boolean }) {
  return <ToolRow part={part} streaming={streaming} />;

  return null;
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
        {text}
      </TraceCollapsibleContent>
    </TraceCollapsible>
  );
}

function ToolRow({ part, streaming }: { part: ToolPart; streaming: boolean }) {
  const command = part.name;

  return (
    <TraceLine status={streaming ? "running" : "error"}>
      <TraceIcon>
        <TerminalIcon />
      </TraceIcon>
      <TraceTitle>
        {streaming ? "Running" : "Failed to run"} {command}
      </TraceTitle>
    </TraceLine>
  );
}
