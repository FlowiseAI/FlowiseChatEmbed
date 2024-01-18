import { BubbleParams } from "./features/bubble/types";

export type BotProps = {
  chatflowConfig?: Record<string, unknown>;
};

export type BubbleProps = BotProps & BubbleParams;

export type ChatInfo = {
  apiHost?: string;
  apptoken: string;
  groupId: string;
  thirdUserId: string;
}