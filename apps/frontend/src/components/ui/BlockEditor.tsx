import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import { Slash, Bold, Italic, List, ListOrdered, Heading1, Heading2, Code, Quote, Check, Grip, Plus, Image as ImageIcon, Video, Link as LinkIcon, X } from 'lucide-react';

const NotionLikeEditor = () => {
    const [, setShowBubbleMenu] = useState(false);
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const [blockMenuPosition, setBlockMenuPosition] = useState({ top: 0, left: 0 });
    const [showLinkMenu, setShowLinkMenu] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [showImageMenu, setShowImageMenu] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [showVideoMenu, setShowVideoMenu] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const linkInputRef = useRef<HTMLInputElement | null>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: 'Type "/" for commands...',
            }),
            Image.configure({
                inline: false,
                allowBase64: true,
            }),
            Link.configure({
                openOnClick: true,
                linkOnPaste: true,
            }),
            Youtube.configure({
                controls: true,
                nocookie: true,
            }),
        ],
        content: '<p>Welcome to the Notion-like editor! Try typing "/" to access the block menu.</p>',
        onSelectionUpdate: ({ editor }) => {
            setShowBubbleMenu(!editor.state.selection.empty);
        },
        onUpdate: ({ editor }) => {
            // Check for '/' at the start of a paragraph to show block menu
            const selection = editor.state.selection;
            const text = editor.getText();

            if (text.trim() === '/') {
                const node = editor.view.domAtPos(selection.from);

                // Access the DOM node correctly and check if it exists
                if (node && node.node && node.node instanceof HTMLElement) {
                    const rect = node.node.getBoundingClientRect();
                    setBlockMenuPosition({
                        top: rect.bottom,
                        left: rect.left,
                    });
                    setShowBlockMenu(true);
                }
            } else {
                setShowBlockMenu(false);
            }
        }
    });

    const blockTypes = [
        { icon: <Heading1 size={18} />, title: 'Heading 1', action: () => toggleBlock('h1') },
        { icon: <Heading2 size={18} />, title: 'Heading 2', action: () => toggleBlock('h2') },
        { icon: <List size={18} />, title: 'Bullet List', action: () => toggleBlock('bulletList') },
        { icon: <ListOrdered size={18} />, title: 'Ordered List', action: () => toggleBlock('orderedList') },
        { icon: <Code size={18} />, title: 'Code Block', action: () => toggleBlock('codeBlock') },
        { icon: <Quote size={18} />, title: 'Blockquote', action: () => toggleBlock('blockquote') },
        { icon: <Check size={18} />, title: 'Task List', action: () => toggleBlock('taskList') },
        { icon: <ImageIcon size={18} />, title: 'Image', action: () => toggleBlock('image') },
        { icon: <Video size={18} />, title: 'Video', action: () => toggleBlock('video') },
        { icon: <LinkIcon size={18} />, title: 'Link', action: () => toggleBlock('link') },
    ];

    const toggleBlock = (blockType: string) => {
        if (!editor) return;

        editor.commands.deleteRange({
            from: editor.state.selection.from - 1,
            to: editor.state.selection.from
        });

        switch (blockType) {
            case 'h1':
                editor.chain().focus().toggleHeading({ level: 1 }).run();
                break;
            case 'h2':
                editor.chain().focus().toggleHeading({ level: 2 }).run();
                break;
            case 'bulletList':
                editor.chain().focus().toggleBulletList().run();
                break;
            case 'orderedList':
                editor.chain().focus().toggleOrderedList().run();
                break;
            case 'codeBlock':
                editor.chain().focus().toggleCodeBlock().run();
                break;
            case 'blockquote':
                editor.chain().focus().toggleBlockquote().run();
                break;
            case 'taskList':
                // Simple paragraph with checkbox for demo purposes
                editor.chain().focus().insertContent('☐ Task item').run();
                break;
            case 'image':
                setShowImageMenu(true);
                break;
            case 'video':
                setShowVideoMenu(true);
                break;
            case 'link':
                setShowLinkMenu(true);
                setTimeout(() => {
                    if (linkInputRef.current) {
                        linkInputRef.current.focus();
                    }
                }, 0);
                break;
            default:
                break;
        }

        setShowBlockMenu(false);
    };

    const addImage = () => {
        if (imageUrl && editor) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
            setImageUrl('');
            setShowImageMenu(false);
        }
    };

    const addVideo = () => {
        if (videoUrl && editor) {
            editor.chain().focus().setYoutubeVideo({ src: videoUrl }).run();
            setVideoUrl('');
            setShowVideoMenu(false);
        }
    };

    const addLink = () => {
        if (linkUrl && editor) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
            setLinkUrl('');
            setShowLinkMenu(false);
        }
    };

    // Handle keyboard navigation in block menu
    const handleBlockMenuKeyDown = useCallback((event: { key: string; }) => {
        if (!showBlockMenu) return;

        if (event.key === 'Escape') {
            setShowBlockMenu(false);
        }
    }, [showBlockMenu]);

    useEffect(() => {
        window.addEventListener('keydown', handleBlockMenuKeyDown);
        return () => {
            window.removeEventListener('keydown', handleBlockMenuKeyDown);
        };
    }, [handleBlockMenuKeyDown]);

    if (!editor) {
        return null;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 min-h-96 border border-gray-200">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                        <h1 className="text-xl font-semibold text-gray-800">Notion-like Editor</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-500 hover:text-gray-700">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {editor && (
                        <BubbleMenu
                            editor={editor}
                            tippyOptions={{ duration: 100 }}
                            shouldShow={({ editor }) => !editor.state.selection.empty}
                        >
                            <div className="flex bg-white shadow-md rounded-md border border-gray-200">
                                <button
                                    onClick={() => editor.chain().focus().toggleBold().run()}
                                    className={`p-2 hover:bg-gray-100 ${editor.isActive('bold') ? 'text-blue-500' : 'text-gray-600'}`}
                                >
                                    <Bold size={16} />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().toggleItalic().run()}
                                    className={`p-2 hover:bg-gray-100 ${editor.isActive('italic') ? 'text-blue-500' : 'text-gray-600'}`}
                                >
                                    <Italic size={16} />
                                </button>
                                <button
                                    onClick={() => editor.chain().focus().toggleCode().run()}
                                    className={`p-2 hover:bg-gray-100 ${editor.isActive('code') ? 'text-blue-500' : 'text-gray-600'}`}
                                >
                                    <Code size={16} />
                                </button>
                                <button
                                    onClick={() => setShowLinkMenu(true)}
                                    className={`p-2 hover:bg-gray-100 ${editor.isActive('link') ? 'text-blue-500' : 'text-gray-600'}`}
                                >
                                    <LinkIcon size={16} />
                                </button>
                            </div>
                        </BubbleMenu>
                    )}

                    {showLinkMenu && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Add Link</h3>
                                    <button onClick={() => setShowLinkMenu(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                    <input
                                        type="text"
                                        ref={linkInputRef}
                                        value={linkUrl}
                                        onChange={(e) => setLinkUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                addLink();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => setShowLinkMenu(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={addLink}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                    >
                                        Add Link
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showImageMenu && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Add Image</h3>
                                    <button onClick={() => setShowImageMenu(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                    <input
                                        type="text"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                addImage();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => setShowImageMenu(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={addImage}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                    >
                                        Add Image
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showVideoMenu && (
                        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-lg p-6 w-96">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Add YouTube Video</h3>
                                    <button onClick={() => setShowVideoMenu(false)} className="text-gray-500 hover:text-gray-700">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">YouTube URL</label>
                                    <input
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                addVideo();
                                            }
                                        }}
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => setShowVideoMenu(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={addVideo}
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
                                    >
                                        Add Video
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showBlockMenu && (
                        <div
                            className="absolute z-10 bg-white shadow-xl rounded-md border border-gray-200 min-w-56"
                            style={{
                                top: blockMenuPosition.top + 'px',
                                left: blockMenuPosition.left + 'px'
                            }}
                        >
                            <div className="p-2 border-b border-gray-200">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Slash size={14} />
                                    <span>Insert block</span>
                                </div>
                            </div>
                            <div className="py-1">
                                {blockTypes.map((block, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                        onClick={block.action}
                                    >
                                        <div className="mr-2 text-gray-600">{block.icon}</div>
                                        <div className="text-sm">{block.title}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="notion-editor prose max-w-none">
                        {!editor.isEmpty && (
                            <div className="flex group">
                                <div className="pt-1 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Grip size={16} className="text-gray-400" />
                                </div>
                                <div className="flex-grow">
                                    <EditorContent editor={editor} />
                                </div>
                            </div>
                        )}
                        {editor.isEmpty && (
                            <EditorContent editor={editor} />
                        )}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500">
                    Type <span className="px-1 py-0.5 bg-gray-100 rounded text-gray-700 font-mono">/</span> for commands
                </div>
            </div>
        </div>
    );
};

export default NotionLikeEditor;