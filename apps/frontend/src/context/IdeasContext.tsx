import axios from "axios";
import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { Descendant } from "slate";
import { AIResponse } from "../components/ui/Platform";

export type Idea = {
    id: string;
    title: string;
    status: string;
    tags: string[];
    content: Descendant[];
    userId: number;
    platformContent?: AIResponse;
    createdAt?: Date;
    updatedAt?: Date;
};

export type StatusOption = {
    label: string;
    color: string;
};

export const statusOptions: StatusOption[] = [
    { label: "Not Started", color: "bg-gray-500" },
    { label: "In Progress", color: "bg-yellow-600" },
    { label: "Completed", color: "bg-green-600" }
];

type IdeasContextType = {
    ideas: Idea[];
    fetchIdeas: () => void;
    addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateIdea: (idea: Idea) => Promise<void>;
    deleteIdea: (ideaId: string) => Promise<void>;
    getStatusColor: (status: string) => string;
    getTagColor: (tag: string) => string;
    getUserIdeas: (userId: number) => Idea[];
};

const IdeasContext = createContext<IdeasContextType | undefined>(undefined);

export const IdeasProvider = ({ children }: { children: ReactNode }) => {
    const [ideas, setIdeas] = useState<Idea[]>([]);

    const fetchIdeas = async () => {
        try {
            const response = await axios.get("http://localhost:3000/v1/ideas/getIdeas", {
                headers: { authorization: localStorage.getItem("token") }
            });
            if (response.data.success) {
                setIdeas(response.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch ideas", error);
        }
    };

    useEffect(() => {
        fetchIdeas();
    }, []);

    const addIdea = async (idea: Omit<Idea, 'id' | "userId" | 'createdAt' | 'updatedAt'>) => {
        try {
            await axios.post("http://localhost:3000/v1/ideas/createIdea", {
                ...idea,
            platformContent: idea.platformContent || null}, {
                headers: { authorization: localStorage.getItem("token") }
            });
            await fetchIdeas();
        } catch (error) {
            console.error("Failed to add idea", error);
        }
    };

    const updateIdea = async (updatedIdea: Idea) => {
        try {
            const response = await axios.put(`http://localhost:3000/v1/ideas/updateIdea/${updatedIdea.id}`, {
                title: updatedIdea.title,
                status: updatedIdea.status,
                tags: updatedIdea.tags,
                content: updatedIdea.content,
                platformContent: updatedIdea.platformContent || null
            }, {
                headers: { authorization: localStorage.getItem("token") }
            });
            if(response.data.success){
                await fetchIdeas();
            }
        } catch (error) {
            console.error("Failed to update idea", error);
        }
    };

    const deleteIdea = async (ideaId: string) => {
        try {
            await axios.delete(`http://localhost:3000/v1/ideas/deleteIdea/${ideaId}`, {
                headers: { authorization: localStorage.getItem("token") }
            });
            await fetchIdeas();
        } catch (error) {
            console.error("Failed to delete idea", error);
        }
    };

    const getUserIdeas = (userId: number): Idea[] => {
        return ideas.filter(idea => idea.userId === userId);
    };

    const getStatusColor = (status: string): string => {
        return statusOptions.find(option => option.label === status)?.color || "bg-gray-500";
    };

    const getTagColor = (tag: string): string => {
        const colors: string[] = [
            "bg-blue-500", "bg-yellow-500", "bg-green-500",
            "bg-red-500", "bg-purple-500", "bg-pink-500",
            "bg-indigo-500", "bg-orange-500"
        ];
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = tag.charCodeAt(i) + ((hash << 7) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const value: IdeasContextType = {
        ideas,
        fetchIdeas,
        addIdea,
        updateIdea,
        deleteIdea,
        getStatusColor,
        getTagColor,
        getUserIdeas
    };

    return <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>;
};

export const useIdeas = () => {
    const context = useContext(IdeasContext);
    if (context === undefined) {
        throw new Error("useIdeas must be used within an IdeasProvider");
    }
    return context;
};
