import React, { useState, useEffect } from 'react';
import RichTextEditor, { initialValue } from './RichTextEditor';
import { Descendant } from 'slate';

// Define the structure of the AI response based on the system prompt
interface PlatformContent {
    title: string;
    description: string;
    hashtags: string[];
    callToAction: string;
    bestPostingTimes: string;
    contentFormat: string;
    additionalTips?: string;
    contentDetails?: {
        scenes?: {
            description: string;
            text: string;
            duration: number;
        }[];
        audio?: string;
        transitions?: string;
    };
    [key: string]: any; // For any additional platform-specific fields
}

export interface AIResponse {
    platforms: {
        instagram?: PlatformContent;
        facebook?: PlatformContent;
        twitter?: PlatformContent;
        linkedin?: PlatformContent;
        youtube?: PlatformContent;
        [key: string]: PlatformContent | undefined;
    };
    generalTips: string[];
}

// Helper function to convert platform content to Slate nodes
const platformContentToSlateNodes = (platformContent: PlatformContent): Descendant[] => {
    const nodes: Descendant[] = [];

    // Add title
    if (platformContent.title) {
        nodes.push({
            type: 'heading-one',
            children: [{text: 'Title: ', bold: true}, { text: platformContent.title }]
        });
    }

    // Add description
    if (platformContent.description) {
        nodes.push({
            type: 'paragraph',
            children: [{text: 'Description: ', bold: true}, { text: platformContent.description }]
        });
    }

    // Add hashtags
    if (platformContent.hashtags && platformContent.hashtags.length > 0) {
        nodes.push({
            type: 'heading-two',
            children: [{text: 'Hashtags: ', bold: true}]
        });

        nodes.push({
            type: 'paragraph',
            children: [{ text: '#' + platformContent.hashtags.join(' #') }]
        });
    }

    // Add call to action
    if (platformContent.callToAction) {
        nodes.push({
            type: 'heading-two',
            children: [{ text: 'Call to Action', bold: true }, { text: platformContent.callToAction }]
        });

        // nodes.push({
        //     type: 'paragraph',
        //     children: [{ text: platformContent.callToAction }]
        // });
    }

    // Add best posting times
    if (platformContent.bestPostingTimes) {
        nodes.push({
            type: 'heading-two',
            children: [{ text: 'Best Posting Times: ', bold:true }]
        });

        nodes.push({
            type: 'paragraph',
            children: [{ text: platformContent.bestPostingTimes }]
        });
    }

    // Add content format
    if (platformContent.contentFormat) {
        nodes.push({
            type: 'heading-two',
            children: [{ text: 'Content Format: ', bold:true }, { text: platformContent.contentFormat }]
        });

        // nodes.push({
        //     type: 'paragraph',
        //     children: [{ text: platformContent.contentFormat }]
        // });
    }

    // Add content details for visual content (like Instagram Reels)
    if (platformContent.contentDetails) {
        nodes.push({
            type: 'heading-two',
            children: [{ text: 'Content Details: ' }]
        });

        // Add scenes if available
        if (platformContent.contentDetails.scenes && platformContent.contentDetails.scenes.length > 0) {
            nodes.push({
                type: 'heading-two',
                children: [{ text: 'Scenes' }]
            });

            platformContent.contentDetails.scenes.forEach((scene, index) => {
                nodes.push({
                    type: 'paragraph',
                    children: [{ text: `Scene ${index + 1}: `, bold: true }, { text: scene.description }]
                });

                nodes.push({
                    type: 'paragraph',
                    children: [{ text: `Text overlay: `, italic: true }, { text: scene.text }]
                });

                nodes.push({
                    type: 'paragraph',
                    children: [{ text: `Duration: ${scene.duration}s` }]
                });
            });
        }

        // Add audio
        if (platformContent.contentDetails.audio) {
            nodes.push({
                type: 'paragraph',
                children: [{ text: `Audio: `, bold: true }, { text: platformContent.contentDetails.audio }]
            });
        }

        // Add transitions
        if (platformContent.contentDetails.transitions) {
            nodes.push({
                type: 'paragraph',
                children: [{ text: `Transitions: `, bold: true }, { text: platformContent.contentDetails.transitions }]
            });
        }
    }

    // Add additional tips
    if (platformContent.additionalTips) {
        nodes.push({
            type: 'heading-two',
            children: [{ text: 'Additional Tips' }]
        });

        nodes.push({
            type: 'paragraph',
            children: [{ text: platformContent.additionalTips }]
        });
    }

    return nodes;
};

// Component for platform-specific content with dropdown selector
const PlatformSpecificContent: React.FC<{
    aiResponse: string;
    onChange: (value: Descendant[], fullAIResponse: AIResponse | null) => void;
    existingAIResponse?: AIResponse | null;
}> = ({ aiResponse, onChange, existingAIResponse }) => {
    // console.log("aiResponse: ", aiResponse)
    console.log("Existing: ", existingAIResponse)
    const [parsedResponse, setParsedResponse] = useState<AIResponse | null>(existingAIResponse || null);
    const [selectedPlatform, setSelectedPlatform] = useState<string>('');
    const [editorContent, setEditorContent] = useState<Descendant[]>(initialValue);
    const [error, setError] = useState<string | null>(null);

    // Parse the AI response when it changes
    useEffect(() => {
        if (!aiResponse) {
            // If there's no new AI response but we have existing data, maintain it
            if (existingAIResponse) {
                setParsedResponse(existingAIResponse);
                
                // Set the first platform as selected by default if none selected
                const platforms = Object.keys(existingAIResponse.platforms);
                if (platforms.length > 0 && !selectedPlatform) {
                    setSelectedPlatform(platforms[0]);
                }
            }
            return;
        }

        try {
            let cleanedResponse = aiResponse.trim()
                .replace(/^```json\s*/i, '')
                .replace(/\s*```$/g, '');
            
            console.log("Attempting to parse:", cleanedResponse);
            
            // Try to parse the cleaned AI response as JSON
            const parsedData = JSON.parse(cleanedResponse) as AIResponse;
            
            // If we have existing data, merge the new data with it
            if (existingAIResponse) {
                // Merge platforms
                const mergedPlatforms = { ...existingAIResponse.platforms };
                
                // Add/update platforms from new response
                Object.entries(parsedData.platforms).forEach(([platform, content]) => {
                    mergedPlatforms[platform] = content;
                });
                
                // Create merged response
                const mergedData: AIResponse = {
                    platforms: mergedPlatforms,
                    generalTips: [
                        ...existingAIResponse.generalTips || [],
                        ...parsedData.generalTips || []
                    ]
                };
                
                setParsedResponse(mergedData);
                // Pass the full merged response back to the parent component
                onChange(editorContent, mergedData);
            } else {
                setParsedResponse(parsedData);
                // Pass the full response back to the parent component
                onChange(editorContent, parsedData);
            }

            // Set the first platform as selected by default if none selected
            const platforms = Object.keys(parsedData.platforms);
            if (platforms.length > 0 && !selectedPlatform) {
                setSelectedPlatform(platforms[0]);
            }

            setError(null);
        } catch (err) {
            console.error('Error parsing AI response:', err);
            setError('Failed to parse AI response. Please check the format.');
        }
    }, [aiResponse, existingAIResponse]);

    // Update editor content when the selected platform changes
    useEffect(() => {
        if (!parsedResponse || !selectedPlatform) return;

        const platformContent = parsedResponse.platforms[selectedPlatform];
        if (platformContent) {
            const slateNodes = platformContentToSlateNodes(platformContent);
            setEditorContent(slateNodes);
            // onChange(slateNodes);
        }
    }, [selectedPlatform, parsedResponse]);

    // Handle platform change
    const handlePlatformChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPlatform(e.target.value);
    };

    // Handle editor content change
    const handleEditorChange = (value: Descendant[], _updatedAIResponse: AIResponse | null) => {
        setEditorContent(value);
        onChange(value, parsedResponse);
    };

    // useEffect(()=>{
    //     onChange(editorContent)
    // }, [editorContent])
    // Get available platforms
    const platforms = parsedResponse ? Object.keys(parsedResponse.platforms) : [];

    return (
        <div>
            {error && (
                <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-md">
                    {error}
                </div>
            )}

            {parsedResponse && platforms.length > 0 && (
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <label htmlFor="platform-select" className="font-medium">
                            Select Platform:
                        </label>
                        <select
                            id="platform-select"
                            value={selectedPlatform}
                            onChange={handlePlatformChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {platforms.map((platform) => (
                                <option key={platform} value={platform}>
                                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <RichTextEditor
                        value={editorContent}
                        onChange={handleEditorChange}
                    />

                    {/* General Tips Section */}
                    {parsedResponse.generalTips && parsedResponse.generalTips.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                            <h3 className="font-medium mb-2">General Tips:</h3>
                            <ul className="list-disc pl-5">
                                {parsedResponse.generalTips.map((tip, index) => (
                                    <li key={index} className="mb-1">{tip}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* {(!parsedResponse || platforms.length === 0) && !error && (
                <div className="p-4 bg-blue-50 text-blue-700 rounded-md">
                    No platform-specific content available. Generate content using AI first.
                </div>
            )} */}
        </div>
    );
};

export default PlatformSpecificContent;