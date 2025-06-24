import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Utilisateur } from "@/types"; // Keep using Utilisateur from original types
import { FrontendConversation } from "@/types/frontend-chat"; // Import for the conversations prop
import { fetcher } from "@/lib/api"; // Import the new fetcher

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (employee: Utilisateur) => void;
  currentUser: Utilisateur;
  conversations: FrontendConversation[];
}

export default function NewChatModal({
  isOpen,
  onClose,
  onSelect,
  currentUser,
  conversations,
}: NewChatModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [availableEmployees, setAvailableEmployees] = useState<Utilisateur[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes to ensure fresh fetch next time it opens
      setSearchTerm("");
      setAvailableEmployees([]);
      setLoading(true);
      setError(null);
      return;
    }

    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all users/employees from your backend using the shared fetcher
        // Assuming fetcher handles prepending basicUrl
        const employees: Utilisateur[] = await fetcher('/users'); // Corrected path

        // Filter out the current user
        let filtered = employees.filter(
          (emp) => emp.idUtilisateur !== currentUser.idUtilisateur
        );

        // Further filter out users who are already in an existing 1-to-1 conversation
        const alreadyChattingUserIds = new Set<string>();
        conversations.forEach((conv) => {
          // Check if it's a 1-to-1 conversation that involves the currentUser
          // And that the conversation has a valid participants array
          if (
            conv.participants && // Ensure participants array exists
            conv.participants.length === 2 &&
            conv.participants.some(
              (p) => p.idUtilisateur === currentUser.idUtilisateur
            )
          ) {
            const otherParticipant = conv.participants.find(
              (p) => p.idUtilisateur !== currentUser.idUtilisateur
            );
            if (otherParticipant) {
              alreadyChattingUserIds.add(otherParticipant.idUtilisateur);
            }
          }
        });

        filtered = filtered.filter(
          (emp) => !alreadyChattingUserIds.has(emp.idUtilisateur)
        );

        setAvailableEmployees(filtered);
      } catch (err: any) {
        console.error("Failed to fetch employees:", err); // Add more specific error logging
        setError(err.message || "Failed to load employees."); // More descriptive error message
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [isOpen, currentUser, conversations]); // Add conversations to dependencies

  const filteredEmployees = availableEmployees.filter(
    (employee) =>
      employee.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.email &&
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Démarrer une nouvelle conversation</DialogTitle>
          <DialogDescription>
            Recherchez un employé pour commencer à discuter.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          {loading ? (
            <div className="text-center text-gray-500">
              Chargement des employés...
            </div>
          ) : error ? (
            <div className="text-center text-red-500">Erreur: {error}</div>
          ) : (
            <ScrollArea className="h-60">
              <div className="divide-y divide-gray-100">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((employee) => (
                    <button
                      key={employee.idUtilisateur}
                      className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 rounded-md transition-colors text-left"
                      onClick={() => {
                        onSelect(employee);
                        onClose(); // Close the modal after selecting an employee
                      }}
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src="/user.png" alt={employee.nom} />
                        <AvatarFallback className="bg-gray-200">
                          {employee.nom.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">
                          {employee.nom}
                        </p>
                        <p className="text-sm text-gray-500">
                          {employee.email}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-500">
                    {searchTerm
                      ? "Aucun employé ne correspond à votre recherche."
                      : "Aucun employé disponible pour une nouvelle conversation."}
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}