import { useState } from "react";
import { useIdeas, Idea } from "../../context/IdeasContext";

type IdeaCardProps = {
    idea: Idea;
    onEdit: (idea: Idea) => void
};


// Helper to detect if the content has images
const hasImages = (nodes: any[]): boolean => {
    return nodes.some(node =>
        (node.type === 'image') ||
        (node.children && hasImages(node.children))
    );
};

// Helper to get first image URL if any
const getFirstImageUrl = (nodes: any[]): string | null => {
    for (const node of nodes) {
        if (node.type === 'image' && node.url) {
            return node.url;
        }
        if (node.children) {
            const childImageUrl = getFirstImageUrl(node.children);
            if (childImageUrl) return childImageUrl;
        }
    }
    return null;
};

const IdeaCard = ({ idea, onEdit }: IdeaCardProps) => {
    const { getStatusColor, getTagColor } = useIdeas();
    const [isDeleting, setIsDeleting] = useState(false);
    const { deleteIdea } = useIdeas()
    
    const onDelete = async (ideaId: string) => {
        if (window.confirm("Are you sure you want to delete this idea?")) {
            setIsDeleting(true);
            try {
                await deleteIdea(ideaId);
            } catch (error) {
                console.error("Failed to delete idea:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className="mx-2 mb-4">
            <div className="flex flex-col shadow-md rounded bg-gray-200 p-4 h-full">
                <div className="text-black text-2xl font-semibold mb-4">
                    {idea.title}
                    {/* <button
                        onClick={() => onEdit(idea)}
                        className="text-left hover:text-blue-700 transition-colors"
                    >
                        {idea.title}
                    </button> */}
                </div>

                <div className="flex mb-4 gap-4">
                    <div>Status: </div>
                    <span
                        className={`${getStatusColor(idea.status)} text-white text-xs px-2 py-1 rounded-md mr-2`}
                    >
                        {idea.status}
                    </span>
                </div>
                
                <div className="flex mb-4 gap-x-1">
                    <div>Tags: </div>
                    {idea.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {idea.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className={`${getTagColor(tag)} text-white text-xs px-2 py-1 rounded-full`}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end mt-auto gap-x-2">
                    <button
                        onClick={() => onEdit(idea)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(idea.id)}
                        disabled={isDeleting}
                        className={`text-red-600 hover:text-red-800 text-sm font-medium ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdeaCard;