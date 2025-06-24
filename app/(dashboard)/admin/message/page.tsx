// pages/chat.tsx ou app/chat/page.tsx (si c'est un client component)
"use client";

import React, { useState, useEffect } from "react";
import ChatLayout from "@/components/chat/chat-layout";
import { useAuthStore } from "@/stores/auth-store"; // <-- Importez votre store Zustand

export default function ChatPage() {
  // Récupérez l'état d'authentification et les infos utilisateur depuis votre store
  const { user: currentUser, isAuthenticated, isLoading, checkAuthStatus, logout } = useAuthStore();
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    // Le store Zustand gère déjà le chargement initial et la vérification de l'authentification
    // via onRehydrateStorage et checkAuthStatus.
    // Vous pouvez déclencher un checkAuthStatus ici si nécessaire,
    // mais le store devrait déjà le faire au démarrage.
    if (!isAuthenticated && !isLoading) {
      // Si l'utilisateur n'est pas authentifié après le chargement initial du store,
      // cela signifie qu'il n'y a pas de session valide ou qu'elle a expiré.
      setPageError("Veuillez vous connecter pour accéder au chat.");
    }
  }, [isAuthenticated, isLoading]); // Dépend de l'état du store

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Chargement de l'authentification...
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Erreur: {pageError}
        <button onClick={logout} className="ml-4 p-2 bg-blue-500 text-white rounded">
          Se connecter
        </button>
      </div>
    );
  }

  if (!currentUser) { // Si currentUser est null après chargement et sans erreur
    return (
      <div className="flex justify-center items-center h-screen">
        Veuillez vous connecter pour accéder au chat.
        <button onClick={logout} className="ml-4 p-2 bg-blue-500 text-white rounded">
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="w-full max-w-5xl h-full mx-auto">
        <ChatLayout currentUser={currentUser} />
      </div>
    </div>
  );
}