export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  price: number;
  image: string;
  capacity: number;
  availableTickets: number;
  category: string;
  description: string;
}

export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Festival Électro Summer",
    date: "2024-08-15T20:00:00",
    location: "Parc des Expositions, Paris",
    price: 45,
    image: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=400&h=300&fit=crop",
    capacity: 5000,
    availableTickets: 1250,
    category: "Musique",
    description: "Une soirée électro inoubliable avec les meilleurs DJs internationaux"
  },
  {
    id: "2", 
    title: "Concert Jazz & Blues",
    date: "2024-07-20T19:30:00",
    location: "Théâtre National, Lyon",
    price: 35,
    image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=300&fit=crop",
    capacity: 800,
    availableTickets: 123,
    category: "Musique",
    description: "Soirée intimiste avec des artistes jazz renommés"
  },
  {
    id: "3",
    title: "Théâtre: Roméo et Juliette",
    date: "2024-07-25T20:30:00", 
    location: "Opéra de Marseille",
    price: 55,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    capacity: 1200,
    availableTickets: 456,
    category: "Théâtre",
    description: "Adaptation moderne du classique de Shakespeare"
  },
  {
    id: "4",
    title: "Stand-up Comedy Night",
    date: "2024-07-18T21:00:00",
    location: "Comedy Club, Toulouse",
    price: 25,
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=300&fit=crop",
    capacity: 300,
    availableTickets: 89,
    category: "Humour",
    description: "Soirée rires garantis avec nos humoristes préférés"
  },
  {
    id: "5",
    title: "Festival Rock en Plein Air",
    date: "2024-08-30T16:00:00",
    location: "Stade Municipal, Bordeaux",
    price: 65,
    image: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop",
    capacity: 15000,
    availableTickets: 3421,
    category: "Musique",
    description: "Festival rock avec 3 jours de concerts non-stop"
  },
  {
    id: "6",
    title: "Exposition Art Moderne",
    date: "2024-07-22T14:00:00",
    location: "Musée d'Art, Nice",
    price: 15,
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
    capacity: 200,
    availableTickets: 67,
    category: "Culture",
    description: "Découvrez les œuvres d'artistes contemporains"
  }
];