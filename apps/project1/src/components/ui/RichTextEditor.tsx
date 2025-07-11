import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, Node, Text, BaseEditor } from 'slate';
import { Slate, Editable, withReact, useSlate, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import {
    Bold, Italic, Underline, List, Link, Image as ImageIcon,
} from 'lucide-react';
import { AIResponse } from './Platform';

// Define allowed block types more strictly
const BLOCK_TYPES = [
    'paragraph',
    'heading-one',
    'heading-two',
    'block-quote',
    'numbered-list',
    'bulleted-list',
    'list-item',
    'image',
    'link'
] as const;

// Define formatting marks
const TEXT_FORMATS = ['bold', 'italic', 'underline'] as const;

type BlockType = typeof BLOCK_TYPES[number];
type TextFormat = typeof TEXT_FORMATS[number];

// Custom types for our editor
type CustomElement = {
    type: BlockType;
    align?: string;
    url?: string;
    children: CustomText[];
    [key: string]: any; // Allow index signature for dynamic property access
};

type CustomText = {
    text: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    [key: string]: any; // Allow index signature for dynamic property access
};

declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor;
        Element: CustomElement;
        Text: CustomText;
    }
}

const withImages = (editor: Editor) => {
    const { isVoid } = editor;

    editor.isVoid = element => {
        return element.type === 'image' ? true : isVoid(element);
    };

    return editor;
};


// Define our own custom toolbar button component
const ToolbarButton = ({ active, onMouseDown, children }: {
    active: boolean;
    onMouseDown: (event: React.MouseEvent) => void;
    children: React.ReactNode;
}) => {
    return (
        <button
            className={`p-2 rounded hover:bg-gray-200 ${active ? 'bg-gray-200 text-blue-600' : 'text-gray-700'}`}
            onMouseDown={onMouseDown}
        >
            {children}
        </button>
    );
};

// Helper to check if current selection has a specific format
const isFormatActive = (editor: Editor, format: TextFormat) => {
    const [match] = Editor.nodes(editor, {
        match: n => Text.isText(n) && n[format] === true,
        mode: 'all',
    });
    return !!match;
};

// Toggle a format on the current selection
const toggleFormat = (editor: Editor, format: TextFormat) => {
    const isActive = isFormatActive(editor, format);
    Transforms.setNodes(
        editor,
        { [format]: isActive ? null : true },
        { match: n => Text.isText(n), split: true }
    );
};

// Check if block is active
const isBlockActive = (editor: Editor, format: BlockType, blockType = 'type') => {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Editor.nodes(editor, {
        match: n =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            n[blockType] === format,
    });

    return !!match;
};

// Toggle block type
const toggleBlock = (editor: Editor, format: BlockType) => {
    const isActive = isBlockActive(editor, format);
    const isList = ['numbered-list', 'bulleted-list'].includes(format);

    Transforms.unwrapNodes(editor, {
        match: n =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            (['numbered-list', 'bulleted-list'] as BlockType[]).includes(n.type as BlockType),
        split: true,
    });

    const newProperties: Partial<CustomElement> = {
        type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
    Transforms.setNodes<CustomElement>(editor, newProperties);

    if (!isActive && isList) {
        const block: CustomElement = { type: format, children: [] };
        Transforms.wrapNodes(editor, block);
    }
};

// Insert image
const insertImage = (editor: Editor, url: string) => {
    const image: CustomElement = {
        type: 'image',
        url,
        children: [{ text: '' }]
    };
    Transforms.insertNodes(editor, image);
};

// Insert link
const insertLink = (editor: Editor, url: string) => {
    if (!url) return;

    const { selection } = editor;
    const link: CustomElement = {
        type: 'link',
        url,
        children: selection ? [] : [{ text: url }],
    };

    if (selection) {
        Transforms.wrapNodes(editor, link, { split: true });
    } else {
        Transforms.insertNodes(editor, link);
    }
};

// Format Buttons Components
const FormatButton = ({ format, icon }: { format: TextFormat; icon: React.ReactNode }) => {
    const editor = useSlate();
    return (
        <ToolbarButton
            active={isFormatActive(editor, format)}
            onMouseDown={(event) => {
                event.preventDefault();
                toggleFormat(editor, format);
            }}
        >
            {icon}
        </ToolbarButton>
    );
};

const BlockButton = ({ format, icon }: { format: BlockType; icon: React.ReactNode }) => {
    const editor = useSlate();
    return (
        <ToolbarButton
            active={isBlockActive(editor, format)}
            onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, format);
            }}
        >
            {icon}
        </ToolbarButton>
    );
};

const LinkButton = () => {
    const editor = useSlate();

    const handleInsertLink = (event: React.MouseEvent) => {
        event.preventDefault();
        const url = prompt('Enter a URL:');
        if (!url) return;
        insertLink(editor, url);
    };

    return (
        <ToolbarButton
            active={isBlockActive(editor, 'link')}
            onMouseDown={handleInsertLink}
        >
            <Link size={16} />
        </ToolbarButton>
    );
};

const ImageButton = () => {
    const editor = useSlate();

    const handleInsertImage = (event: React.MouseEvent) => {
        event.preventDefault();
        const url = prompt('Enter image URL:');
        if (!url) return;
        insertImage(editor, url);
    };

    return (
        <ToolbarButton
            active={false}
            onMouseDown={handleInsertImage}
        >
            <ImageIcon size={16} />
        </ToolbarButton>
    );
};

// Our main editor component
const RichTextEditor = ({
    value,
    onChange
}: {
    value: Descendant[];
    onChange: (value: Descendant[], updatedAIResponse: AIResponse | null) => void;
}) => {
    const renderElement = useCallback((props: any) => <Element {...props} />, []);
    const renderLeaf = useCallback((props: any) => <Leaf {...props} />, []);
    const editor = useMemo(() => withImages(withHistory(withReact(createEditor()))), []);
    const isInitialMount = useRef(true);


    // Create local state to track editor value changes
    // const [internalValue, setInternalValue] = useState<Descendant[]>([]);


    // // Sync internal state with props
    // useEffect(() => {
    //     if (value && value.length > 0) {
    //         setInternalValue(value);
    //         // onChange(value)
    //     }
    // }, [value])

    console.log(JSON.stringify(value))
    useEffect(() => {
        // Compare the current editor content with the incoming value
        const currentContent = JSON.stringify(editor.children);
        const newContent = JSON.stringify(value);

        if (currentContent !== newContent) {
            // Clear existing content
            Transforms.delete(editor, {
                at: {
                    anchor: Editor.start(editor, []),
                    focus: Editor.end(editor, []),
                },
            });
            // Insert new content
            Transforms.insertNodes(editor, value, { at: [0] });
        }
    }, [value, editor]);

    // Handle changes from user input or editor updates
    const handleChange = (newValue: Descendant[]) => {
        // Only call onChange if the content has actually changed
        if (JSON.stringify(newValue) !== JSON.stringify(value)) {
            onChange(newValue, null);
        }
    };

    // Handle image paste
    const handlePaste = useCallback(
        (event: React.ClipboardEvent<HTMLDivElement>) => {
            const pastedData = event.clipboardData;
            const pastedFiles = pastedData.files;

            if (pastedFiles.length === 0) return;

            const file = pastedFiles[0];
            if (!file.type.match(/^image\/(gif|jpe?g|png)$/i)) return;

            event.preventDefault();

            const reader = new FileReader();

            // Ensure we only insert once
            reader.onload = () => {
                const url = reader.result as string;
                const { selection } = editor;

                if (selection) {
                    insertImage(editor, url);
                }
            };

            reader.readAsDataURL(file);
        },
        [editor]
    );
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const { selection } = editor;

        if (event.key === 'Enter') {
            const [match] = Editor.nodes(editor, {
                match: n => SlateElement.isElement(n) && Editor.isVoid(editor, n),
            });

            if (match) {
                event.preventDefault();
                Transforms.insertNodes(editor, {
                    type: 'paragraph',
                    children: [{ text: '' }],
                });
                return;
            }
        }
    };

    const initialEditorValue = value.length > 0 ? value : initialValue;

    return (
        <div className="border border-gray-300 rounded-md bg-white">
            {/* {internalValue.length > 0 && <Slate editor={editor} initialValue={safeValue} onChange={handleChange}>
                <div className="flex flex-wrap items-center p-2 border-b border-gray-300 bg-gray-50">
                    <FormatButton format="bold" icon={<Bold size={16} />} />
                    <FormatButton format="italic" icon={<Italic size={16} />} />
                    <FormatButton format="underline" icon={<Underline size={16} />} />
                    <div className="w-px h-6 mx-2 bg-gray-300" />
                    <BlockButton format="bulleted-list" icon={<List size={16} />} />
                    <LinkButton />
                    <ImageButton />
                </div>
                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder="Write your content here..."
                    className="p-4 min-h-[200px] prose max-w-none"
                    spellCheck
                    autoFocus
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                />
            </Slate>} */}
            <Slate editor={editor} initialValue={initialEditorValue} onChange={handleChange}>
                <div className="flex flex-wrap items-center p-2 border-b border-gray-300 bg-gray-50">
                    <FormatButton format="bold" icon={<Bold size={16} />} />
                    <FormatButton format="italic" icon={<Italic size={16} />} />
                    <FormatButton format="underline" icon={<Underline size={16} />} />
                    <div className="w-px h-6 mx-2 bg-gray-300" />
                    <BlockButton format="bulleted-list" icon={<List size={16} />} />
                    <LinkButton />
                    <ImageButton />
                </div>
                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder="Write your content here..."
                    className="p-4 min-h-[200px] prose max-w-none"
                    spellCheck
                    autoFocus
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                />
            </Slate>
            
        </div>
    );
};

// Define a React component renderer for our custom elements
const Element = ({ attributes, children, element }: {
    attributes: any;
    children: React.ReactNode;
    element: CustomElement;
}) => {
    switch (element.type) {
        case 'paragraph':
            return <p {...attributes}>{children}</p>;
        case 'block-quote':
            return <blockquote {...attributes}>{children}</blockquote>;
        case 'bulleted-list':
            return <ul {...attributes}>{children}</ul>;
        case 'heading-one':
            return <h1 {...attributes}>{children}</h1>;
        case 'heading-two':
            return <h2 {...attributes}>{children}</h2>;
        case 'list-item':
            return <li {...attributes}>{children}</li>;
        case 'numbered-list':
            return <ol {...attributes}>{children}</ol>;
        case 'link':
            return (
                <a
                    {...attributes}
                    href={element.url}
                    className="text-blue-500 underline"
                >
                    {children}
                </a>
            );
        case 'image':
            return (
                <div {...attributes}>
                    <div contentEditable={false} className="my-2">
                        <img
                            src={element.url}
                            alt=""
                            className="max-w-full h-auto rounded"
                        />
                    </div>
                    {children}
                </div>
            );
        default:
            return <p {...attributes}>{children}</p>;
    }
};

// Define a React component renderer for text leaf formatting
const Leaf = ({ attributes, children, leaf }: {
    attributes: any;
    children: React.ReactNode;
    leaf: CustomText;
}) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (leaf.italic) {
        children = <em>{children}</em>;
    }

    if (leaf.underline) {
        children = <u>{children}</u>;
    }

    return <span {...attributes}>{children}</span>;
};

// Default initial value for the editor
export const initialValue: Descendant[] = [
    {
        type: 'paragraph' as BlockType,
        children: [{ text: '' }],
    },
];

export default RichTextEditor;