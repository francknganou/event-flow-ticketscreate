import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, Star, Shield } from "lucide-react";

const About = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Communauté",
      description: "Plus de 50 000 utilisateurs font confiance à EventFlow pour leurs réservations"
    },
    {
      icon: <Calendar className="w-8 h-8 text-accent" />,
      title: "Événements",
      description: "Plus de 1200 événements disponibles dans toute la France"
    },
    {
      icon: <Star className="w-8 h-8 text-primary" />,
      title: "Satisfaction",
      description: "4.8/5 étoiles de satisfaction client moyenne"
    },
    {
      icon: <Shield className="w-8 h-8 text-accent" />,
      title: "Sécurité",
      description: "Paiements sécurisés et protection de vos données personnelles"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">À propos d'EventFlow</h1>
            <p className="text-xl text-muted-foreground">
              La plateforme de réservation d'événements la plus simple et la plus fiable
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6 text-center">Notre mission</h2>
            <Card className="border border-border">
              <CardContent className="p-8">
                <p className="text-lg text-muted-foreground leading-relaxed">
                  EventFlow a été créé avec une mission simple : rendre la découverte et la réservation d'événements 
                  aussi facile que possible. Que vous recherchiez un concert intimiste, un festival grandiose, 
                  une pièce de théâtre ou un spectacle d'humour, nous vous connectons avec les expériences qui vous 
                  correspondent. Notre plateforme offre une interface intuitive, des paiements sécurisés et 
                  un service client exceptionnel pour que votre seule préoccupation soit de profiter de votre événement.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Pourquoi choisir EventFlow ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="border border-border">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {feature.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">Notre équipe</h2>
            <Card className="border border-border">
              <CardContent className="p-8">
                <p className="text-lg text-muted-foreground">
                  EventFlow est développé par une équipe passionnée d'événements et de technologie. 
                  Nous travaillons sans relâche pour améliorer votre expérience et vous offrir 
                  la meilleure plateforme de réservation possible.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;