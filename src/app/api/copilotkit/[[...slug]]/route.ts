import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

const runtime = new CopilotRuntime({
  agents: {
    default: new LangGraphAgent({
      deploymentUrl:
        process.env.LANGGRAPH_DEPLOYMENT_URL || "http://localhost:2024",
      graphId: "default",
    }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
