// context/SupabaseContext.jsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Environnement variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create supabase client
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Create context
const SupabaseContext = createContext(null);

export function SupabaseProvider({ children }) {
  const [supabase] = useState(() => supabaseClient);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase, session }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};
