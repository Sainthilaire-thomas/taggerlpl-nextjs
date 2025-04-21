"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Récupérer les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Variable globale pour stocker l'instance client
let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  // Vérification des variables d'environnement
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Les variables d'environnement Supabase ne sont pas définies"
    );
  }

  // Utiliser l'instance existante si elle existe déjà
  if (supabaseInstance) return supabaseInstance;

  // Créer une nouvelle instance
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
};

// Créer l'instance pour l'export par défaut et nommé
const supabase = getSupabase();

// Export nommé pour la compatibilité avec les imports existants
export { supabase };

// Export par défaut
export default supabase;
