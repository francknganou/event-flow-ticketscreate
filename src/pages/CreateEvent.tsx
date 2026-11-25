<<<<<<< HEAD

=======
import { Header } from "@/components/Header";
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
<<<<<<< HEAD
import { Calendar, MapPin, Users, Plus, Trash2, ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Event, TicketType } from "@/data/events";


=======
import { Calendar, MapPin, Users, Euro, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Event, TicketType } from "@/data/events";

>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
const CreateEvent = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    capacity: "",
<<<<<<< HEAD
=======
    price: "",
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
    image: ""
  });
  
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { id: "1", name: "Standard", price: 0, quantity: 0, availableQuantity: 0 }
  ]);
<<<<<<< HEAD
  const [imageFile,setImageFile]=useState<File|null>(null);
  const [imagePreview,setImagePreview]=useState("");
  const [saving,setSaving]=useState(false);
  
  const navigate = useNavigate();

  useEffect(()=>{if(!imageFile){setImagePreview("");return;}const url=URL.createObjectURL(imageFile);setImagePreview(url);return()=>URL.revokeObjectURL(url);},[imageFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
    let eventImage=formData.image;
    if(imageFile){const upload=new FormData();upload.append('image',imageFile);const response=await fetch('http://127.0.0.1:8000/api/events.php?action=upload-image',{method:'POST',headers:{Authorization:`Bearer ${localStorage.getItem('sessionToken')||''}`},body:upload});const result=await response.json();if(!response.ok)throw new Error(result.error||'Import de l’image impossible.');eventImage=result.image;}
=======
  
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
    const newEvent: Event = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      date: `${formData.date}T${formData.time}:00`,
      location: formData.location,
      category: formData.category,
      capacity: parseInt(formData.capacity),
<<<<<<< HEAD
      price: Math.min(...ticketTypes.map(ticket => Number(ticket.price) || 0)),
      availableTickets: parseInt(formData.capacity),
      image: eventImage || "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=400&h=300&fit=crop",
=======
      price: parseFloat(formData.price),
      availableTickets: parseInt(formData.capacity),
      image: "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=400&h=300&fit=crop",
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
      ticketTypes: ticketTypes,
      createdBy: "current-user"
    };

<<<<<<< HEAD
    const response=await fetch('http://127.0.0.1:8000/api/events.php',{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('sessionToken') || ''}`},body:JSON.stringify(newEvent)});const result=await response.json();if(!response.ok)throw new Error(result.error||'Enregistrement impossible');navigate('/events');
    }catch(error){alert(error instanceof Error?error.message:'Création impossible.');}finally{setSaving(false);}
=======
    // Sauvegarder l'événement dans le localStorage
    const existingEvents = JSON.parse(localStorage.getItem('userEvents') || '[]');
    const updatedEvents = [...existingEvents, newEvent];
    localStorage.setItem('userEvents', JSON.stringify(updatedEvents));
    
    navigate('/events');
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTicketType = () => {
    const newTicketType: TicketType = {
      id: Date.now().toString(),
      name: "",
      price: 0,
      quantity: 0,
      availableQuantity: 0
    };
    setTicketTypes([...ticketTypes, newTicketType]);
  };

  const removeTicketType = (id: string) => {
    setTicketTypes(ticketTypes.filter(ticket => ticket.id !== id));
  };

  const updateTicketType = (id: string, field: keyof TicketType, value: string | number) => {
    setTicketTypes(ticketTypes.map(ticket => 
      ticket.id === id 
        ? { 
            ...ticket, 
<<<<<<< HEAD
          [field]: field === 'name' || field === 'description' ? value : typeof value === 'string' ? parseFloat(value) || 0 : value,
=======
            [field]: typeof value === 'string' ? parseFloat(value) || 0 : value,
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
            ...(field === 'quantity' ? { availableQuantity: typeof value === 'string' ? parseFloat(value) || 0 : value } : {})
          }
        : ticket
    ));
  };

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-transparent">
      
      
      <div className="container mx-auto px-4 py-8"><main className="mx-auto max-w-3xl">
=======
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">Créer un événement</h1>
            <p className="text-muted-foreground">Remplissez les informations de votre événement</p>
          </div>

          <Card className="border border-border">
            <CardHeader>
              <CardTitle>Informations de l'événement</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre de l'événement *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Nom de votre événement"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Décrivez votre événement..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Musique">Musique</SelectItem>
                        <SelectItem value="Théâtre">Théâtre</SelectItem>
                        <SelectItem value="Humour">Humour</SelectItem>
                        <SelectItem value="Culture">Culture</SelectItem>
                        <SelectItem value="Sport">Sport</SelectItem>
                        <SelectItem value="Autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Date & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Heure *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lieu *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      placeholder="Adresse complète du lieu"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

<<<<<<< HEAD
                {/* Capacity */}
                <div className="grid grid-cols-1 gap-4">
=======
                {/* Capacity & Price */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacité *</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => handleInputChange("capacity", e.target.value)}
                        placeholder="Nombre de places"
                        className="pl-10"
                        min="1"
                        required
                      />
                    </div>
                  </div>

<<<<<<< HEAD
=======
                  <div className="space-y-2">
                    <Label htmlFor="price">Prix du ticket (€) *</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleInputChange("price", e.target.value)}
                        placeholder="0.00"
                        className="pl-10"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
                </div>

                {/* Ticket Types */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
<<<<<<< HEAD
                    <div><Label>Types de tickets</Label><p className="mt-1 text-xs text-muted-foreground">La somme des quantités doit correspondre à la capacité de l’événement.</p></div>
=======
                    <Label>Types de tickets</Label>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
                    <Button type="button" variant="outline" size="sm" onClick={addTicketType}>
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter un type
                    </Button>
                  </div>
                  
                  {ticketTypes.map((ticket, index) => (
                    <Card key={ticket.id} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Nom du ticket</Label>
<<<<<<< HEAD
                          <Input
                            list="eventflow-ticket-type-suggestions"
                            value={ticket.name}
                            onChange={(e) => updateTicketType(ticket.id, "name", e.target.value)}
                            placeholder="Ex. Pass backstage, Pass journée…"
                            maxLength={100}
                            required
                          />
                          <datalist id="eventflow-ticket-type-suggestions">
                            {["Standard", "VIP", "Gratuit", "Étudiant", "Groupe", "Enfant", "Senior", "Membre"].map(name=><option key={name} value={name}/>) }
                          </datalist>
=======
                          <Select 
                            value={ticket.name} 
                            onValueChange={(value) => updateTicketType(ticket.id, "name", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un type de ticket" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Gratuit">Gratuit</SelectItem>
                              <SelectItem value="Standard">Standard</SelectItem>
                              <SelectItem value="VIP">VIP</SelectItem>
                              <SelectItem value="Étudiant">Étudiant</SelectItem>
                              <SelectItem value="Groupe">Groupe</SelectItem>
                              <SelectItem value="Enfant">Enfant</SelectItem>
                              <SelectItem value="Senior">Senior</SelectItem>
                              <SelectItem value="Membre">Membre</SelectItem>
                            </SelectContent>
                          </Select>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Prix (€)</Label>
                          <Input
                            type="number"
                            value={ticket.price}
                            onChange={(e) => updateTicketType(ticket.id, "price", e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Quantité</Label>
                          <Input
                            type="number"
                            value={ticket.quantity}
                            onChange={(e) => updateTicketType(ticket.id, "quantity", e.target.value)}
                            placeholder="0"
                            min="1"
                            required
                          />
                        </div>
                        
                        <div className="flex items-end">
                          {ticketTypes.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeTicketType(ticket.id)}
                              className="text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Image */}
                <div className="space-y-2">
<<<<<<< HEAD
                  <Label htmlFor="image-file">Image de l'événement</Label>
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
                    <label htmlFor="image-file" className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl px-4 py-5 text-center transition-colors hover:bg-muted/50">
                      <ImagePlus className="h-8 w-8 text-primary" />
                      <span className="text-sm font-semibold">{imageFile?imageFile.name:"Importer une affiche ou une image"}</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG ou WebP · 5 Mo maximum</span>
                    </label>
                    <input id="image-file" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e=>{const file=e.target.files?.[0]||null;if(file&&file.size>5*1024*1024){alert("L’image ne doit pas dépasser 5 Mo.");e.target.value="";return;}setImageFile(file);}} />
                    {imagePreview&&<div className="relative mt-3 overflow-hidden rounded-xl"><img src={imagePreview} alt="Aperçu de l’image de l’événement" className="h-48 w-full object-cover"/><Button type="button" variant="secondary" size="sm" className="absolute right-2 top-2" onClick={()=>setImageFile(null)}>Retirer</Button></div>}
                  </div>
                  <p className="text-center text-xs text-muted-foreground">ou utilisez une image déjà hébergée</p>
                    <Input
                      id="image"
                      type="url"
                      value={formData.image}
                      onChange={(e) => handleInputChange("image", e.target.value)}
                      placeholder="https://exemple.com/image.jpg"
                    />
=======
                  <Label htmlFor="image">Image de l'événement</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleInputChange("image", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formats acceptés: JPG, PNG, GIF (max 5MB)
                  </p>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-6">
<<<<<<< HEAD
                  <Button type="submit" variant="hero" className="flex-1" disabled={saving}>
                    {saving?"Enregistrement…":"Créer l'événement"}
=======
                  <Button type="submit" variant="hero" className="flex-1">
                    Créer l'événement
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
<<<<<<< HEAD
      </main></div>
=======
      </div>
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
    </div>
  );
};

<<<<<<< HEAD
export default CreateEvent;
=======
export default CreateEvent;
>>>>>>> 4179d2893d945ac75accb60e9214b13a6bfa6761
