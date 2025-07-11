import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Descendant } from 'slate';

interface UseAIContentStreamProps {
    onContentUpdate?: (content: string) => void;
    onComplete?: (fullContent: string) => void;
    onError?: (error: string) => void;
}

export const useAIContentStream = ({
    onContentUpdate,
    onComplete,
    onError
}: UseAIContentStreamProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [streamedContent, setStreamedContent] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    const generateContent = async (prompt: string) => {
        try {
            setIsLoading(true);
            setStreamedContent('');
            setError(null);

            // Close any existing connections
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            // Create a full text accumulator
            let fullText = '';

            // Create new EventSource connection for SSE
            const url = 'http://localhost:3000/v1/ideas/AIIdeaContent';

            // First make a POST request to start the streaming
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token') || ''
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error('Failed to connect to AI service');
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('Response body reader could not be created');
            }

            // Read the stream
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                // Decode the chunk
                const chunk = decoder.decode(value, { stream: true });

                // Parse SSE format (data: {...}\n\n)
                const lines = chunk.split('\n\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const eventData = JSON.parse(line.substring(6));

                            if (eventData.error) {
                                throw new Error(eventData.error);
                            }

                            if (eventData.done) {
                                // Stream completed
                                console.log(fullText)
                                if (onComplete) {
                                    onComplete(fullText);
                                }
                                continue;
                            }

                            if (eventData.text) {
                                fullText += eventData.text;
                                setStreamedContent(fullText);
                                // console.log("Full text", fullText)
                                if (onContentUpdate) {
                                    onContentUpdate(fullText);
                                }
                            }
                        } catch (e) {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const cancelGeneration = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsLoading(false);
    };

    useEffect(() => {
        // Cleanup function to close EventSource when component unmounts
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    return {
        generateContent,
        cancelGeneration,
        isLoading,
        streamedContent,
        error
    };
};

// Helper function to convert plain text to Slate format
// export const textToSlateNodes = (text: string): Descendant[] => {

//     try {
//         const jsonObj = JSON.parse(text);

//         // If this is our platform-specific JSON format, return empty array
//         // as we'll handle this specially in PlatformSpecificContent
//         if (jsonObj.platforms) {
//             return [];
//         }
//     } catch (e) {
//         // Not valid JSON, continue with normal text processing
//     }

//     // If no text, return a single empty paragraph
//     if (!text || text.trim() === '') {
//         return [{
//             type: 'paragraph',
//             children: [{ text: '' }]
//         }];
//     }

//     console.log("Text: ", text)
//     // Split by double newlines to create paragraphs
//     const paragraphs = text.split(/\n\n+/);

//     // Map paragraphs to Slate nodes
//     const nodes: Descendant[] = paragraphs.map(paragraph => {
//         // Trim the paragraph and handle empty paragraphs
//         const trimmedParagraph = paragraph.trim();

//         // If paragraph is empty after trimming, return an empty paragraph
//         if (trimmedParagraph === '') {
//             return {
//                 type: 'paragraph',
//                 children: [{ text: '' }]
//             };
//         }

//         // Handle multiple lines within a paragraph
//         const lines = trimmedParagraph.split(/\n/);

//         // If multiple lines, create a paragraph with line breaks
//         if (lines.length > 1) {
//             return {
//                 type: 'paragraph',
//                 children: lines.flatMap((line, index) => [
//                     { text: line },
//                     // Add a soft line break between lines, except for the last line
//                     ...(index < lines.length - 1 ? [{ text: '\n' }] : [])
//                 ])
//             };
//         }

//         // Single line paragraph
//         return {
//             type: 'paragraph',
//             children: [{ text: trimmedParagraph }]
//         };
//     });

//     // Ensure at least one paragraph exists
//     return nodes.length > 0 ? nodes : [{
//         type: 'paragraph',
//         children: [{ text: '' }]
//     }];
// };

// Helper function for cleaning AI response JSON
export const cleanAIResponse = (response: string): string => {
    if (!response) return '';
    
    // Remove markdown code block markers if present
    let cleanedResponse = response.trim();
    
    // Remove opening code block identifier
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/i, '');
    
    // Remove closing code block marker
    cleanedResponse = cleanedResponse.replace(/\s*```$/g, '');
    
    return cleanedResponse;
};

// Function to safely parse JSON with better error handling
export const safeParseJSON = <T>(jsonString: string): { success: boolean; data: T | null; error: string | null } => {
    try {
        // Clean the string first
        const cleanedString = cleanAIResponse(jsonString);
        
        // Try to parse
        const parsedData = JSON.parse(cleanedString) as T;
        return {
            success: true,
            data: parsedData,
            error: null
        };
    } catch (err) {
        console.error("JSON parsing error:", err);
        return {
            success: false,
            data: null,
            error: err instanceof Error ? err.message : String(err)
        };
    }
};

// Enhanced version of your textToSlateNodes function 
export const textToSlateNodes = (text: string): Descendant[] => {
    if (!text) {
        return [{
            type: 'paragraph',
            children: [{ text: '' }]
        }];
    }
    
    // Try to parse as JSON first
    const parseResult = safeParseJSON<any>(text);
    
    // If it's a valid JSON with platforms property, return empty array
    // as we'll handle this specially in PlatformSpecificContent
    if (parseResult.success && parseResult.data && parseResult.data.platforms) {
        return [];
    }
    
    // Continue with normal text processing for non-JSON content
    const cleanedText = cleanAIResponse(text);
    
    // If no valid text after cleaning, return a single empty paragraph
    if (!cleanedText || cleanedText.trim() === '') {
        return [{
            type: 'paragraph',
            children: [{ text: '' }]
        }];
    }
    
    // Split by double newlines to create paragraphs
    const paragraphs = cleanedText.split(/\n\n+/);
    
    // Map paragraphs to Slate nodes
    const nodes: Descendant[] = paragraphs.map(paragraph => {
        const trimmedParagraph = paragraph.trim();
        
        if (trimmedParagraph === '') {
            return {
                type: 'paragraph',
                children: [{ text: '' }]
            };
        }
        
        // Handle multiple lines within a paragraph
        const lines = trimmedParagraph.split(/\n/);
        
        if (lines.length > 1) {
            return {
                type: 'paragraph',
                children: lines.flatMap((line, index) => [
                    { text: line },
                    ...(index < lines.length - 1 ? [{ text: '\n' }] : [])
                ])
            };
        }
        
        return {
            type: 'paragraph',
            children: [{ text: trimmedParagraph }]
        };
    });
    
    return nodes.length > 0 ? nodes : [{
        type: 'paragraph',
        children: [{ text: '' }]
    }];
};