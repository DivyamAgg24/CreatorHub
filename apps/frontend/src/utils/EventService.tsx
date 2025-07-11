// import { CalendarEvent } from '../context/EventsContext';

// // Base API URL - replace with your actual API endpoint
// const API_URL = '/api';

// // Helper function to get the auth token
// const getAuthToken = (): string | null => {
//   const user = localStorage.getItem('user');
//   if (!user) return null;
  
//   try {
//     // This assumes your token is stored in the user object
//     // Adjust according to your actual token storage method
//     const userData = JSON.parse(user);
//     return userData.token || null;
//   } catch (error) {
//     console.error('Error parsing user data:', error);
//     return null;
//   }
// };

// // Generic fetch helper with authentication
// async function fetchWithAuth(url: string, options: RequestInit = {}) {
//   const token = getAuthToken();
  
//   const headers = {
//     'Content-Type': 'application/json',
//     ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
//     ...options.headers
//   };
  
//   const response = await fetch(`${API_URL}${url}`, {
//     ...options,
//     headers
//   });
  
//   if (!response.ok) {
//     const error = await response.json().catch(() => ({}));
//     throw new Error(error.message || `API request failed with status ${response.status}`);
//   }
  
//   return response.json();
// }

// // Event service functions
// export const EventService = {
//   // Get all events for a user
//   getUserEvents: async (userId: number): Promise<CalendarEvent[]> => {
//     return fetchWithAuth(`/events/user/${userId}`);
//   },
  
//   // Create a new event
//   createEvent: async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
//     return fetchWithAuth('/events', {
//       method: 'POST',
//       body: JSON.stringify(event)
//     });
//   },
  
//   // Update an existing event
//   updateEvent: async (event: CalendarEvent): Promise<CalendarEvent> => {
//     return fetchWithAuth(`/events/${event.id}`, {
//       method: 'PUT',
//       body: JSON.stringify(event)
//     });
//   },
  
//   // Delete an event
//   deleteEvent: async (eventId: string): Promise<void> => {
//     return fetchWithAuth(`/events/${eventId}`, {
//       method: 'DELETE'
//     });
//   },
  
//   // Get events for a specific idea
//   getEventsByIdeaId: async (ideaId: string): Promise<CalendarEvent[]> => {
//     return fetchWithAuth(`/events/idea/${ideaId}`);
//   },
  
//   // Link an event to an idea
//   linkEventToIdea: async (eventId: string, ideaId: string): Promise<void> => {
//     return fetchWithAuth(`/events/${eventId}/link/${ideaId}`, {
//       method: 'POST'
//     });
//   },
  
//   // Unlink an event from an idea
//   unlinkEventFromIdea: async (eventId: string, ideaId: string): Promise<void> => {
//     return fetchWithAuth(`/events/${eventId}/unlink/${ideaId}`, {
//       method: 'DELETE'
//     });
//   }
// };

// export default EventService;