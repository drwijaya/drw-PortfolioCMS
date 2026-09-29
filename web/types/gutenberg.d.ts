// Public surface used by the standalone editor. block-editor does not ship declarations.
declare module "@wordpress/block-editor" {
  import type { ComponentType, ReactNode, HTMLAttributes } from "react";
  import type { Block } from "@wordpress/blocks";
  export const BlockEditorProvider: ComponentType<{
    useSubRegistry?: boolean;
    value: Block[];
    onInput: (blocks: Block[]) => void;
    onChange: (blocks: Block[]) => void;
    settings?: Record<string, unknown>;
    children?: ReactNode;
  }>;
  export const BlockList: ComponentType<Record<string, unknown>>;
  export const BlockTools: ComponentType<{ children?: ReactNode }>;
  export const WritingFlow: ComponentType<{ children?: ReactNode }>;
  export const ObserveTyping: ComponentType<{ children?: ReactNode }>;
  export const BlockInspector: ComponentType<Record<string, unknown>>;
  export const Inserter: ComponentType<Record<string, unknown>>;
  export const __experimentalListView: ComponentType<Record<string, unknown>>;
  export const InspectorControls: ComponentType<{ children?: ReactNode }>;
  export const RichText: ComponentType<{
    tagName?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    allowedFormats?: string[];
    identifier?: string;
  }>;
  export const InnerBlocks: ComponentType<{
    allowedBlocks?: string[];
    template?: unknown[];
    templateLock?: boolean | string;
    renderAppender?: ComponentType;
  }>;
  export function useBlockProps(
    props?: HTMLAttributes<HTMLDivElement>,
  ): HTMLAttributes<HTMLDivElement>;
}
