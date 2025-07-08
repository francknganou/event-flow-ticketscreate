import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Ticket, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    {
      title: "Événements créés",
      value: "3",
      icon: <Calendar className="w-6 h-6" />,
      trend: "+2 ce mois"
    },
    {
      title: "Tickets vendus",
      value: "147",
      icon: <Ticket className="w-6 h-6" />,
      trend: "+23 cette semaine"
    },
    {
      title: "Revenus",
      value: "2,450€",
      icon: <TrendingUp className="w-6 h-6" />,
      trend: "+15% ce mois"
    },
    {
      title: "Participants",
      value: "89",
      icon: <Users className="w-6 h-6" />,
      trend: "12 nouveaux"
    }
  ];

  const recentEvents = [
    {
      id: "1",
      title: "Mon Festival Électro",
      date: "2024-08-15",
      status: "active",
      ticketsSold: 45,
      totalCapacity: 100
    },
    {
      id: "2",
      title: "Soirée Jazz Privée",
      date: "2024-07-25",
      status: "upcoming",
      ticketsSold: 78,
      totalCapacity: 80
    },
    {
      id: "3",
      title: "Théâtre Amateur",
      date: "2024-07-10",
      status: "completed",
      ticketsSold: 24,
      totalCapacity: 30
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-700 dark:text-green-300">Actif</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300">À venir</Badge>;
      case 'completed':
        return <Badge className="bg-gray-500/20 text-gray-700 dark:text-gray-300">Terminé</Badge>;
      default:
        return <Badge>Inconnu</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Tableau de bord</h1>
              <p className="text-muted-foreground">Gérez vos événements et suivez vos performances</p>
            </div>
            <Link to="/create-event">
              <Button variant="hero" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Créer mon événement
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                  </div>
                  <div className="text-primary">
                    {stat.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Events */}
        <Card className="border border-border">
          <CardHeader>
            <CardTitle className="text-xl">Mes événements récents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">{event.ticketsSold}/{event.totalCapacity}</p>
                      <p className="text-xs text-muted-foreground">tickets</p>
                    </div>
                    {getStatusBadge(event.status)}
                    <Button variant="outline" size="sm">
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;