import { TElement } from '@udecode/plate-common';
import { z } from 'zod';
export declare enum BubbleBlockType {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    EMBED = "embed",
    AUDIO = "audio"
}
declare const typingEmulation: z.ZodObject<{
    enabled: z.ZodBoolean;
    speed: z.ZodNumber;
    maxDelay: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    speed: number;
    maxDelay: number;
}, {
    enabled: boolean;
    speed: number;
    maxDelay: number;
}>;
export type TypingEmulation = z.infer<typeof typingEmulation>;
declare const textBubbleBlockSchema: z.ZodObject<{
    type: z.ZodEnum<[BubbleBlockType.TEXT]>;
    content: z.ZodObject<{
        html: z.ZodOptional<z.ZodString>;
        richText: z.ZodArray<z.ZodAny, "many">;
        plainText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        richText: any[];
        html?: string | undefined;
        plainText?: string | undefined;
    }, {
        richText: any[];
        html?: string | undefined;
        plainText?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: BubbleBlockType.TEXT;
    content: {
        richText: any[];
        html?: string | undefined;
        plainText?: string | undefined;
    };
}, {
    type: BubbleBlockType.TEXT;
    content: {
        richText: any[];
        html?: string | undefined;
        plainText?: string | undefined;
    };
}>;
type TextBubbleBlock = Omit<z.infer<typeof textBubbleBlockSchema>, 'content'> & {
    content: {
        richText: TElement[];
        html?: string;
        plainText?: string;
    };
};
export type TextBubbleContent = TextBubbleBlock['content'];
declare const chatMessageSchema: z.ZodIntersection<z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>, z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<BubbleBlockType.TEXT>;
    content: z.ZodObject<{
        html: z.ZodOptional<z.ZodString>;
        richText: z.ZodArray<z.ZodAny, "many">;
        plainText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        richText: any[];
        html?: string | undefined;
        plainText?: string | undefined;
    }, {
        richText: any[];
        html?: string | undefined;
        plainText?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    type: BubbleBlockType.TEXT;
    content: {
        richText: any[];
        html?: string | undefined;
        plainText?: string | undefined;
    };
}, {
    type: BubbleBlockType.TEXT;
    content: {
        richText: any[];
        html?: string | undefined;
        plainText?: string | undefined;
    };
}>]>>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export {};
//# sourceMappingURL=index.d.ts.map