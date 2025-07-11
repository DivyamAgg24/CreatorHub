import { useState, useEffect, useRef, MouseEvent, KeyboardEvent, ChangeEvent } from "react";
import { useIdeas, Idea, statusOptions } from "../../context/IdeasContext";
import RichTextEditor, { initialValue } from "./RichTextEditor";
import { Descendant } from "slate";
import { useAIContentStream, textToSlateNodes } from "../../context/AIContentStream";
import PlatformSpecificContent, { AIResponse } from "./Platform";

type CreateIdeaProps = {
    onClose: () => void;
    ideaToEdit: Idea | null;
};

const CreateIdea = ({ onClose, ideaToEdit }: CreateIdeaProps) => {
    const { addIdea, updateIdea, getStatusColor, getTagColor } = useIdeas();

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const tagInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState<string>("");
    const [content, setContent] = useState<Descendant[]>(initialValue);
    const [status, setStatus] = useState<string>("Not Started");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState<string>("");
    const [showAIInput, setShowAIInput] = useState(false);
    const [AIPrompt, setAIPrompt] = useState("");

    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState<boolean>(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

    const [rawAIResponse, setRawAIResponse] = useState<string>("");
    // Flag to determine whether to show platform-specific content
    const [showPlatformContent, setShowPlatformContent] = useState<boolean>(false);

    const [fullAIResponse, setFullAIResponse] = useState<AIResponse | null>(null);
    // Store original content before AI generation
    const [originalContent, setOriginalContent] = useState<Descendant[] | null>(null);

    // AI streaming functionality
    const {
        generateContent,
        cancelGeneration,
        error
    } = useAIContentStream({
        onContentUpdate: (streamedText: string) => {
            // Store the raw AI response instead of converting to Slate nodes immediately
            setRawAIResponse(streamedText);
        },
        onComplete: (fullContent: string) => {
            setIsGeneratingAI(false);

            // Store the complete AI response
            setRawAIResponse(fullContent);

            try {
                // Check if content is platform-specific JSON
                let cleanedResponse = fullContent.trim();

                // Remove opening code block identifier
                cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/i, '');

                // Remove closing code block marker
                cleanedResponse = cleanedResponse.replace(/\s*```$/g, '');
                const parsedContent = JSON.parse(cleanedResponse);
                if (parsedContent.platforms) {
                    // This is platform-specific content
                    setShowPlatformContent(true);
                    // setFullAIResponse(parsedContent)
                } else {
                    // Not platform-specific, treat as regular content
                    setShowPlatformContent(false);
                    if (originalContent) {
                        const slateNodes = textToSlateNodes(fullContent);
                        setContent([...originalContent, ...slateNodes]);
                    } else {
                        const slateNodes = textToSlateNodes(fullContent)
                        setContent([...slateNodes])
                    }
                }
            } catch (e) {
                // If not parseable as JSON, treat as regular content
                setShowPlatformContent(false);
                if (originalContent) {
                    const slateNodes = textToSlateNodes(fullContent);
                    setContent([...originalContent, ...slateNodes]);
                } else {
                    const slateNodes = textToSlateNodes(fullContent);
                    setContent([...slateNodes]);
                }
            }
        },
        onError: (errorMsg: any) => {
            console.error("AI generation error:", errorMsg);
            setIsGeneratingAI(false);
            if (originalContent) {
                setContent([...originalContent]);
            }
        }
    });

    // Load existing idea data if editing
    useEffect(() => {
        if (ideaToEdit) {
            console.log(ideaToEdit)
            setTitle(ideaToEdit.title);
            setContent(ideaToEdit.content);
            setStatus(ideaToEdit.status);
            setTags([...ideaToEdit.tags]);

            try {
                if (typeof ideaToEdit.platformContent === 'object' &&
                    ideaToEdit.platformContent !== null &&
                    'platforms' in ideaToEdit.platformContent) {
                        console.log(ideaToEdit.platformContent)
                    setShowPlatformContent(true);
                    setFullAIResponse(ideaToEdit.platformContent as AIResponse);
                }
            } catch (e) {
                console.log("No platform content found in ideaToEdit");
            }
        }
    }, [ideaToEdit]);

    // Auto-resize the title textarea as content changes
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [title]);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent): void => {
            const target = event.target as Node;

            const statusButton = document.getElementById('status-button');
            const statusDropdown = document.getElementById('status-dropdown');

            const tagContainer = document.getElementById('tag-container');
            const tagDropdown = document.getElementById('tag-dropdown');

            // Close status dropdown if clicked outside
            if (isStatusDropdownOpen &&
                statusDropdown &&
                !statusDropdown.contains(target) &&
                statusButton &&
                !statusButton.contains(target)) {
                setIsStatusDropdownOpen(false);
            }

            // Close tag dropdown if clicked outside
            if (isTagDropdownOpen &&
                tagDropdown &&
                !tagDropdown.contains(target) &&
                tagContainer &&
                !tagContainer.contains(target)) {
                setIsTagDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isStatusDropdownOpen, isTagDropdownOpen]);

    const handleInputTextChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
        setTitle(e.target.value);
    };

    const handleContentChange = (value: Descendant[], _updatedAIResponse: AIResponse | null): void => {
        setContent(value);
        // if (updatedAIResponse) {
        //     setFullAIResponse(updatedAIResponse);
        // }
    };

    const handleUseAI = () => {
        setShowAIInput(!showAIInput);
        setAIPrompt("");

        // If we're turning off AI mode and generating, cancel it
        if (showAIInput && isGeneratingAI) {
            cancelGeneration();
            setIsGeneratingAI(false);

            if (originalContent) {
                setContent([...originalContent]);
                setOriginalContent(null);
            }
        }
    };

    const handleAIInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setAIPrompt(e.target.value);
    };

    const handleAIInputKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter' && AIPrompt.trim()) {
            e.preventDefault();
            generateAIContent();
        }
    };

    const generateAIContent = () => {
        if (!AIPrompt.trim() || isGeneratingAI) return;

        setIsGeneratingAI(true);
        setShowAIInput(false);

        // Initialize with a loading message in the editor
        // const loadingSlate = textToSlateNodes("Generating content...");
        // setShowPlatformContent(false); // Reset platform content display
        // setRawAIResponse("");
        setOriginalContent(content.length > 0 ? [...content] : null);
        // setContent(prev => [...prev, ...loadingSlate]);

        // Generate content with the prompt
        generateContent(AIPrompt.trim());
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        setIsStatusDropdownOpen(false);
    };

    const toggleStatusDropdown = (e: MouseEvent<HTMLButtonElement>): void => {
        e.stopPropagation();
        setIsTagDropdownOpen(false);
        setIsStatusDropdownOpen(!isStatusDropdownOpen);
    };

    const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setTagInput(e.target.value);
    };

    const handleTagInputKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
        if (e.key === 'Enter' && tagInput.trim()) {
            addTag(tagInput.trim());
            e.preventDefault();
        }
    };

    const addTag = (tag: string): void => {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
        }
        setTagInput("");
        if (tagInputRef.current) {
            tagInputRef.current.focus();
        }
    };

    const removeTag = (tagToRemove: string): void => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const toggleTagDropdown = (e: MouseEvent<HTMLInputElement>): void => {
        e.stopPropagation();
        setIsStatusDropdownOpen(false);
        setIsTagDropdownOpen(!isTagDropdownOpen);
    };

    const handleSave = () => {
        const userString = JSON.parse(localStorage.getItem("user")!);

        if (!title.trim()) return;

        const ideaPlatformContent = fullAIResponse

        if (ideaToEdit) {
            console.log("idea to edit content: ", ideaToEdit.content)
            // Update existing idea
            const updatedIdea: Idea = {
                ...ideaToEdit,
                title: title.trim(),
                content: content,
                status: status,
                tags: tags,
                platformContent: ideaPlatformContent || undefined
            };
            updateIdea(updatedIdea);
        } else {
            // Create new idea
            const newIdea: Idea = {
                id: Date.now().toString(),
                title: title.trim(),
                status: status,
                tags: tags,
                content: content,
                userId: userString.id,
                platformContent: ideaPlatformContent || undefined
            };
            addIdea(newIdea);
        }

        onClose();
    };

    useEffect(() => {
        return () => {
            if (isGeneratingAI) {
                cancelGeneration();
            }
        };
    }, [isGeneratingAI, cancelGeneration]);

    return (
        <div id="idea-page" className="flex fixed inset-0 items-center justify-center bg-opacity-50 z-50">
            <div id="create-idea" className="bg-neutral-200 shadow-lg h-3/4 w-3/4 rounded-lg overflow-y-auto">
                <div className="m-8">
                    <div>
                        <textarea
                            id="idea_title"
                            ref={textareaRef}
                            value={title}
                            onChange={handleInputTextChange}
                            autoFocus
                            placeholder="New Idea Title..."
                            className="w-full bg-transparent text-black text-2xl overflow-hidden resize-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {/* Status and Tags section */}
                    <div className="mt-6 space-y-4">
                        {/* Status selector */}
                        <div className="grid grid-cols-4 items-center">
                            <span className="text-sm font-medium col-span-1 mr-2">Status:</span>
                            <div className="relative col-span-3">
                                <button
                                    id="status-button"
                                    onClick={toggleStatusDropdown}
                                    className="flex items-center space-x-1 px-3 py-1 rounded-md text-white"
                                    style={{
                                        backgroundColor: getStatusColor(status) === 'bg-gray-500' ? '#6b7280' :
                                            getStatusColor(status) === 'bg-yellow-600' ? '#ca8a04' :
                                                getStatusColor(status) === 'bg-green-600' ? '#16a34a' : '#6b7280'
                                    }}
                                >
                                    <span>{status}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m6 9 6 6 6-6" />
                                    </svg>
                                </button>

                                {isStatusDropdownOpen && (
                                    <div id="status-dropdown" className="absolute mt-1 w-40 bg-white rounded-md shadow-lg z-10">
                                        <ul className="py-1">
                                            {statusOptions.map((option) => (
                                                <li
                                                    key={option.label}
                                                    className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                    onClick={() => handleStatusChange(option.label)}
                                                >
                                                    <div className={`w-3 h-3 rounded-full ${option.color} mr-2`}></div>
                                                    <span>{option.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags selector */}
                        <div className="grid grid-cols-4">
                            <span className="text-sm col-span-1 font-medium mb-2 block">Tags:</span>
                            <div className="relative col-span-3">
                                <div id="tag-container" className="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-md bg-white">
                                    {tags.map((tag, index) => (
                                        <div
                                            key={index}
                                            className={`${getTagColor(tag)} text-white px-2 py-1 rounded-md flex items-center text-sm`}
                                        >
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="ml-1 text-white hover:text-gray-200"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex-grow">
                                        <input
                                            ref={tagInputRef}
                                            type="text"
                                            value={tagInput}
                                            onChange={handleTagInputChange}
                                            onKeyDown={handleTagInputKeyDown}
                                            placeholder="Select an option or create one"
                                            className="w-full bg-transparent outline-none text-sm"
                                            onClick={toggleTagDropdown}
                                        />
                                    </div>
                                </div>

                                {isTagDropdownOpen && (
                                    <div id="tag-dropdown" className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-10">
                                        {tagInput && !tags.includes(tagInput) && (
                                            <div
                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                                                onClick={() => addTag(tagInput)}
                                            >
                                                <span className="text-gray-800">+ Add "{tagInput}"</span>
                                            </div>
                                        )}
                                        {tags.length > 0 && (
                                            <ul className="py-1 max-h-40 overflow-y-auto">
                                                {tags.map((tag, index) => (
                                                    <li
                                                        key={index}
                                                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                                    >
                                                        <div className="flex items-center">
                                                            <div className={`w-3 h-3 rounded-full ${getTagColor(tag)} mr-2`}></div>
                                                            <span>{tag}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => removeTag(tag)}
                                                            className="text-gray-500 hover:text-gray-700"
                                                        >
                                                            ×
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-3">
                        <button
                            className={`flex border rounded-lg px-2 py-1 items-center gap-x-2 cursor-pointer hover:bg-neutral-400 ${isGeneratingAI ? 'bg-red-100' : ''}`}
                            onClick={handleUseAI}
                        >
                            <img src="/sparkles-svgrepo-com.svg" height={13} width={13} alt="ai"></img>
                            <div>{isGeneratingAI ? 'Cancel AI' : 'Use AI'}</div>
                        </button>
                    </div>

                    {showAIInput && (
                        <div className="mt-3">
                            <div className="flex gap-2">
                                <input
                                    placeholder="Enter your prompt here..."
                                    value={AIPrompt}
                                    onKeyDown={handleAIInputKeyDown}
                                    onChange={handleAIInputChange}
                                    autoFocus
                                    className="rounded px-2 py-1 w-full overflow-hidden focus-visible:outline-none focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                                <button
                                    onClick={generateAIContent}
                                    disabled={!AIPrompt.trim() || isGeneratingAI}
                                    className="bg-blue-600 text-white rounded-md px-3 py-1 hover:bg-blue-700 disabled:bg-blue-300"
                                >
                                    Generate
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-3 p-2 bg-red-100 text-red-700 rounded">
                            Error: {error}
                        </div>
                    )}

                    <div className="mt-6">
                        <label className="text-sm font-medium mb-2 block">Content:</label>
                        {/* <RichTextEditor value={content} onChange={handleContentChange} /> */}
                    </div>

                    {showPlatformContent ? (
                        <PlatformSpecificContent
                            aiResponse={rawAIResponse}
                            onChange={handleContentChange}
                            existingAIResponse={fullAIResponse}
                        />
                    ) : (
                        <RichTextEditor value={content} onChange={handleContentChange} />
                    )}

                    <div className="flex justify-end space-x-3 mt-8">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            disabled={!title.trim()}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateIdea;