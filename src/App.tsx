import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
<<<<<<< HEAD
import { lazy, Suspense } from "react";
=======
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
import { AppProvider } from "@/contexts/AppContext";
import { Settings } from "@/components/Settings";
import Index from "./pages/Index";
import Events from "./pages/Events";
import MyTickets from "./pages/MyTickets";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import NotFound from "./pages/NotFound";
<<<<<<< HEAD
import OrganizerRequest from "./pages/OrganizerRequest";
import Scanner from "./pages/Scanner";
import { AppLayout } from "@/components/AppLayout";

const Reports = lazy(() => import("./pages/Reports"));
const OrganizerRequests = lazy(() => import("./pages/OrganizerRequests"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Messages = lazy(() => import("./pages/Messages"));
=======
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
<<<<<<< HEAD
          <Suspense fallback={<div className="min-h-[60vh] animate-pulse bg-muted/20" aria-label="Chargement de la page" />}>
          <Routes>
            <Route element={<AppLayout />}>
=======
          <Routes>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<Events />} />
            <Route path="/my-tickets" element={<MyTickets />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-event" element={<CreateEvent />} />
<<<<<<< HEAD
            <Route path="/organizer-request" element={<OrganizerRequest />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/organizer-requests" element={<OrganizerRequests />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/pricing" element={<Subscription />} />
            <Route path="/messages" element={<Messages />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </Suspense>
=======
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
          <Settings />
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
