import type { Message, SubAgentStep, AgentEvent } from "./types";

// ── State ─────────────────────────────────────────────────────────────────────
export interface ConversationState {
  messages: Message[];
  busy: boolean;
  agentSteps: SubAgentStep[];
}

// ── Actions ───────────────────────────────────────────────────────────────────
export type ConversationAction =
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "SET_BUSY"; payload: boolean }
  | { type: "SET_AGENT_STEPS"; payload: SubAgentStep[] }
  | { type: "AGENT_EVENT"; payload: AgentEvent };

// ── Reducer ───────────────────────────────────────────────────────────────────
export function conversationReducer(
  state: ConversationState,
  action: ConversationAction,
): ConversationState {
  switch (action.type) {
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "SET_BUSY":
      return { ...state, busy: action.payload };

    case "SET_AGENT_STEPS":
      return { ...state, agentSteps: action.payload };

    case "AGENT_EVENT": {
      const event = action.payload;
      switch (event.type) {
        case "delta": {
          const msgs = state.messages;
          const last = msgs[msgs.length - 1];
          if (!last?.streaming) return state;
          return {
            ...state,
            messages: [...msgs.slice(0, -1), { ...last, content: last.content + event.content }],
          };
        }

        case "tool_start": {
          const msgs = state.messages;
          const last = msgs[msgs.length - 1];
          if (!last?.streaming) return state;
          return {
            ...state,
            messages: [
              ...msgs.slice(0, -1),
              { ...last, toolCalls: [...(last.toolCalls ?? []), event.toolCall] },
            ],
          };
        }

        case "tool_done": {
          const msgs = state.messages;
          const last = msgs[msgs.length - 1];
          if (!last?.streaming || !last.toolCalls) return state;
          return {
            ...state,
            messages: [
              ...msgs.slice(0, -1),
              {
                ...last,
                toolCalls: last.toolCalls.map((tc) =>
                  tc.id === event.toolCall.id ? event.toolCall : tc,
                ),
              },
            ],
          };
        }

        case "graph_node": {
          const msgs = state.messages;
          const last = msgs[msgs.length - 1];
          if (!last?.streaming) return state;
          const existingNodes = last.graphNodes ?? [];
          const idx = existingNodes.findIndex((n) => n.id === event.node.id);
          const updatedNodes =
            idx >= 0
              ? existingNodes.map((n, i) => (i === idx ? event.node : n))
              : [...existingNodes, event.node];
          return {
            ...state,
            messages: [...msgs.slice(0, -1), { ...last, graphNodes: updatedNodes }],
          };
        }

        case "step": {
          const filtered = state.agentSteps.filter((s) => s.id !== event.step.id);
          return { ...state, agentSteps: [...filtered, event.step] };
        }

        case "done": {
          const msgs = state.messages;
          const last = msgs[msgs.length - 1];
          const updatedMsgs = last?.streaming
            ? [...msgs.slice(0, -1), { ...last, streaming: false }]
            : msgs;
          return { ...state, messages: updatedMsgs, busy: false, agentSteps: [] };
        }

        case "error": {
          const msgs = state.messages;
          const last = msgs[msgs.length - 1];
          const updatedMsgs = last?.streaming
            ? [
                ...msgs.slice(0, -1),
                {
                  ...last,
                  streaming: false,
                  error: event.error,
                  content: last.content || "Something went wrong.",
                },
              ]
            : msgs;
          return { ...state, messages: updatedMsgs, busy: false };
        }

        default: {
          const _exhaustiveCheck: never = event;
          return state;
        }
      }
    }

    default: {
      const _exhaustiveCheck: never = action;
      return state;
    }
  }
}

export const INITIAL_CONVERSATION_STATE: ConversationState = {
  messages: [],
  busy: false,
  agentSteps: [],
};
