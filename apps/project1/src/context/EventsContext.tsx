import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { EventInput, DateSelectArg } from '@fullcalendar/core';
import axios from 'axios';

// Define the Event type that matches our Prisma schema
export type CalendarEvent = {
    id: string;
    title: string;
    start: Date | string;
    end?: Date | string;
    allDay: boolean;
    description?: string;
    color?: string;
    userId: number;
    ideaIds?: string[]; // IDs of linked ideas
    createdAt?: Date;
    updatedAt?: Date;
};

// Define what our context will provide
type EventsContextType = {
    events: CalendarEvent[];
    loading: boolean;
    error: string | null;
    fetchEvents: () => Promise<void>;
    addEvent: (event: Omit<CalendarEvent, 'id'| "userId">) => Promise<CalendarEvent | null>;
    updateEvent: (updatedEvent: CalendarEvent) => Promise<boolean>;
    deleteEvent: (eventId: string) => Promise<boolean>;
    getEventsByIdeaId: (ideaId: string) => CalendarEvent[];
    linkEventToIdea: (eventId: string, ideaId: string) => Promise<boolean>;
    unlinkEventFromIdea: (eventId: string, ideaId: string) => Promise<boolean>;
    // Functions for FullCalendar integration
    getEventsForFullCalendar: () => EventInput[];
};

// Create the context with default values
const EventsContext = createContext<EventsContextType | undefined>(undefined);

// Helper function to create EventInput objects for FullCalendar
const convertToEventInput = (event: CalendarEvent): EventInput => {
    return {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        allDay: event.allDay,
        backgroundColor: event.color,
        extendedProps: {
            description: event.description,
            userId: event.userId,
            ideaIds: event.ideaIds
        }
    };
};

// Create a provider component
export const EventsProvider = ({ children }: { children: ReactNode }) => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch events from API
    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await axios.get('http://localhost:3000/v1/events/getEvents', {
                headers: { authorization: localStorage.getItem("token") }
            });
            
            if (response.data.success) {
                // Ensure dates are properly parsed from strings
                const parsedEvents = response.data.data.map((event: any) => ({
                    ...event,
                    start: new Date(event.start),
                    end: event.end ? new Date(event.end) : undefined,
                    createdAt: event.createdAt ? new Date(event.createdAt) : undefined,
                    updatedAt: event.updatedAt ? new Date(event.updatedAt) : undefined
                }));
                setEvents(parsedEvents);
            } else {
                setError("Failed to fetch events");
            }
        } catch (err) {
            console.error("Error fetching events:", err);
            setError("Failed to fetch events");
        } finally {
            setLoading(false);
        }
    };

    // Load events when the component mounts
    useEffect(() => {
        fetchEvents();
    }, []);

    // Add an event
    const addEvent = async (event: Omit<CalendarEvent, 'id' | 'userId'>): Promise<CalendarEvent | null> => {
        try {
            // Ensure we're sending properly formatted date strings
            const formattedEvent = {
                ...event,
                start: formatDateString(event.start),
                end: event.end ? formatDateString(event.end) : undefined
            };
            
            console.log('Sending event to API:', formattedEvent);
            const response = await axios.post('http://localhost:3000/v1/events/createEvent', formattedEvent, {
                headers: { authorization: localStorage.getItem("token") }
            });
            
            if (response.data.success) {
                const newEvent = {
                    ...response.data.data,
                    start: new Date(response.data.data.start),
                    end: response.data.data.end ? new Date(response.data.data.end) : undefined,
                    createdAt: response.data.data.createdAt ? new Date(response.data.data.createdAt) : undefined,
                    updatedAt: response.data.data.updatedAt ? new Date(response.data.data.updatedAt) : undefined
                };
            await fetchEvents()
            } else {
                // Log more detailed error information
                console.error("API error creating event:", response.data);
                setError(response.data.message || "Failed to create event");
            }
            return null;
        } catch (err: any) {
            console.error("Error creating event:", err);
            if (err.response) {
                console.error("API response error:", err.response.data);
                setError(err.response.data.message || "Failed to create event");
            } else {
                setError("Failed to create event");
            }
            return null;
        }
    };
    
    // Helper function to ensure consistent date formatting
    const formatDateString = (date: Date | string): string => {
        if (typeof date === 'string') {
            try {
                // Attempt to parse the string as a date and format it
                return new Date(date).toISOString();
            } catch (e) {
                console.error('Invalid date string:', date);
                return date; // Return the original if parsing fails
            }
        }
        return date.toISOString();
    };

    // Update an event
    const updateEvent = async (updatedEvent: CalendarEvent): Promise<boolean> => {
        try {
            // Ensure we're sending properly formatted date strings
            const formattedEvent = {
                ...updatedEvent,
                start: formatDateString(updatedEvent.start),
                end: updatedEvent.end ? formatDateString(updatedEvent.end) : undefined
            };
            
            console.log('Sending updated event to API:', formattedEvent);
            const response = await axios.put(
                `http://localhost:3000/v1/events/updateEvent/${updatedEvent.id}`,
                formattedEvent, {
                headers: { authorization: localStorage.getItem("token") }
            }
            );
            
            if (response.data.success) {
                const updated = {
                    ...response.data.data,
                    start: new Date(response.data.data.start),
                    end: response.data.data.end ? new Date(response.data.data.end) : undefined,
                    updatedAt: new Date()
                };
                
            await fetchEvents()
            } else {
                // Log more detailed error information
                console.error("API error updating event:", response.data);
                setError(response.data.message || "Failed to update event");
            }
            return false;
        } catch (err: any) {
            console.error("Error updating event:", err);
            if (err.response) {
                console.error("API response error:", err.response.data);
                setError(err.response.data.message || "Failed to update event");
            } else {
                setError("Failed to update event");
            }
            return false;
        }
    };

    // Delete an event
    const deleteEvent = async (eventId: string): Promise<boolean> => {
        try {
            const response = await axios.delete(`http://localhost:3000/v1/events/deleteEvent/${eventId}`, {
                headers: { authorization: localStorage.getItem("token") }
            });
            
            if (response.data.success) {
                await fetchEvents()
                return true
            }
            return false;
        } catch (err) {
            console.error("Error deleting event:", err);
            setError("Failed to delete event");
            return false;
        }
    };

    // Get events linked to a specific idea
    const getEventsByIdeaId = (ideaId: string): CalendarEvent[] => {
        return events.filter(event => 
            event.ideaIds && event.ideaIds.includes(ideaId)
        );
    };

    // Link an event to an idea
    const linkEventToIdea = async (eventId: string, ideaId: string): Promise<boolean> => {
        try {
            const response = await axios.post('http://localhost:3000/v1/events/linkEventToIdea', {
                eventId,
                ideaId
            }, {
                headers: { authorization: localStorage.getItem("token") }
            });
            
            if (response.data.success) {
                // Update local state
                setEvents(prev => prev.map(event => {
                    if (event.id === eventId) {
                        const ideaIds = event.ideaIds || [];
                        if (!ideaIds.includes(ideaId)) {
                            return {
                                ...event,
                                ideaIds: [...ideaIds, ideaId],
                                updatedAt: new Date()
                            };
                        }
                    }
                    return event;
                }));
                return true;
            }
            return false;
        } catch (err) {
            console.error("Error linking event to idea:", err);
            setError("Failed to link event to idea");
            return false;
        }
    };
    
    // Unlink an event from an idea
    const unlinkEventFromIdea = async (eventId: string, ideaId: string): Promise<boolean> => {
        try {
            const response = await axios.post('http://localhost:3000/v1/events/unlinkEventFromIdea', {
                eventId,
                ideaId
            }, {
                headers: { authorization: localStorage.getItem("token") }
            });
            
            if (response.data.success) {
                setEvents(prev => prev.map(event => {
                    if (event.id === eventId && event.ideaIds) {
                        return {
                            ...event,
                            ideaIds: event.ideaIds.filter(id => id !== ideaId),
                            updatedAt: new Date()
                        };
                    }
                    return event;
                }));
                return true;
            }
            
            // Fallback implementation if API endpoint doesn't exist yet
            setEvents(prev => prev.map(event => {
                if (event.id === eventId && event.ideaIds) {
                    return {
                        ...event,
                        ideaIds: event.ideaIds.filter(id => id !== ideaId),
                        updatedAt: new Date()
                    };
                }
                return event;
            }));
            return true;
        } catch (err) {
            console.error("Error unlinking event from idea:", err);
            
            // Even if API fails, update local state
            setEvents(prev => prev.map(event => {
                if (event.id === eventId && event.ideaIds) {
                    return {
                        ...event,
                        ideaIds: event.ideaIds.filter(id => id !== ideaId),
                        updatedAt: new Date()
                    };
                }
                return event;
            }));
            
            setError("Failed to unlink event from idea on server, but updated locally");
            return true;
        }
    };
    
    // Get events formatted for FullCalendar
    const getEventsForFullCalendar = (): EventInput[] => {
        return events.map(convertToEventInput);
    };

    const value = {
        events,
        loading,
        error,
        fetchEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventsByIdeaId,
        linkEventToIdea,
        unlinkEventFromIdea,
        getEventsForFullCalendar
    };

    return <EventsContext.Provider value={value}>{children}</EventsContext.Provider>;
};

// Create a custom hook to use the context
export const useEvents = () => {
    const context = useContext(EventsContext);
    if (context === undefined) {
        throw new Error("useEvents must be used within an EventsProvider");
    }
    return context;
};