// Fonction utilitaire pour supprimer toutes les données de connexion
export const clearAllUserData = () => {
  // Supprimer toutes les connexions et données utilisateurs
  localStorage.clear();
  
  // Optionnel: garder seulement les données de configuration de l'app
  const appSettings = {
    currency: 'FCFA',
    language: 'fr'
  };
  
  Object.entries(appSettings).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
};

// Fonction pour réinitialiser complètement l'application
export const resetApplication = () => {
  clearAllUserData();
  window.location.href = '/';
};