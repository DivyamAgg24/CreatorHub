import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlusCircle, Search } from "lucide-react";
import { Idea, useIdeas } from "../../context/IdeasContext";
import IdeaCard from "../../components/ui/IdeaCard";
import CreateIdea from "../../components/ui/CreateIdea";

  export const Ideas = () => {
    const { ideas } = useIdeas();
    const [showSearchInput, setShowSearchInput] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [ideaToEdit, setIdeaToEdit] = useState<Idea | null>(null);

    // Filter ideas based on search term
    const filteredIdeas = ideas.filter(idea => {
        if (!searchTerm) return true;

        const searchTermLower = searchTerm.toLowerCase();
        // const contentText = getPlainTextFromNodes(idea.content);
        return (
            idea.title.toLowerCase().includes(searchTermLower)
            // contentText.toLowerCase().includes(searchTermLower) ||
            // idea.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
        );
    });
    
    const handleOpenEditForm = (idea: Idea) => {
        setIdeaToEdit(idea);
        setShowCreateForm(true);
    };
    
    const handleCloseForm = () => {
        setShowCreateForm(false);
        setIdeaToEdit(null);
    };
    
    return (
        <div className="relative h-screen">
            {showCreateForm && (
                <CreateIdea
                    onClose={handleCloseForm}
                    ideaToEdit={ideaToEdit}
                />
            )}

            <div className="text-5xl ml-15 mt-10 font-bold">
                My Ideas
            </div>

            <div className="border-b mx-15 my-5 pb-2 flex border-gray-300 items-center justify-between">
                <div></div>

                <div className="flex items-center gap-x-3">
                    <div
                        className="hover:bg-gray-200 p-1 rounded-lg cursor-pointer"
                        onClick={() => setShowSearchInput(!showSearchInput)}
                    >
                        <Search className="text-gray-400 transition-all" size={20} />
                    </div>

                    <AnimatePresence>
                        {showSearchInput && (
                            <motion.input
                                className="flex py-2 bg-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring- focus-visible:ring-primary-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700"
                                key="input"
                                placeholder="Type to search..."
                                autoFocus
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 200, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                exit={{ width: 0 }}
                            />
                        )}
                    </AnimatePresence>

                    <button
                        className="flex items-center gap-x-2 bg-slate-700 text-white rounded p-2"
                        onClick={() => {
                            setIdeaToEdit(null);
                            setShowCreateForm(true);
                        }}
                    >
                        <PlusCircle strokeWidth={1} size={17} />
                        New Idea
                    </button>
                </div>
            </div>

            <div className="mt-6 mx-6">
                {filteredIdeas.length > 0 ? (
                    <div className="grid grid-cols-4 gap-x-2">
                        {filteredIdeas.map((idea) => (
                            <IdeaCard
                                key={idea.id}
                                idea={idea}
                                onEdit={handleOpenEditForm}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-10">
                        {searchTerm ? "No ideas match your search." : "No ideas yet. Create your first idea!"}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Ideas;