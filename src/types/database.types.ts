/**
 * Database types auto-generated from Supabase
 * 
 * ⚠️  DO NOT EDIT MANUALLY
 * 
 * To regenerate:
 *   - Run task: Ctrl+Shift+P → "Tasks: Run Task" → "Generate Supabase Types"
 *   - Or run: npm run generate:types
 *   - Or run: .\scripts\generate-types.ps1
 * 
 * Generated on: 2025-11-08 17:02:59
 * Project ID: jregkxiwrnquslbocicz
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.0.2 (a4e00ff)"
  }
  public: {
    Tables: {
      activitesconseillers: {
        Row: {
          commentaires: string | null
          customnudges_ids: number[] | null
          dateactivite: string
          duree: number | null
          idactivite: number
          idconseiller: number
          idexercice: number | null
          idpratique: number | null
          idsujet: number | null
          nature: string | null
          objectifs: string | null
          sidebar_commentaires: string | null
          sidebar_date_modif: string | null
          sidebar_objectifs: string | null
          sidebar_phase: string | null
          sidebar_statut: string | null
          statut: string | null
        }
        Insert: {
          commentaires?: string | null
          customnudges_ids?: number[] | null
          dateactivite?: string
          duree?: number | null
          idactivite?: number
          idconseiller: number
          idexercice?: number | null
          idpratique?: number | null
          idsujet?: number | null
          nature?: string | null
          objectifs?: string | null
          sidebar_commentaires?: string | null
          sidebar_date_modif?: string | null
          sidebar_objectifs?: string | null
          sidebar_phase?: string | null
          sidebar_statut?: string | null
          statut?: string | null
        }
        Update: {
          commentaires?: string | null
          customnudges_ids?: number[] | null
          dateactivite?: string
          duree?: number | null
          idactivite?: number
          idconseiller?: number
          idexercice?: number | null
          idpratique?: number | null
          idsujet?: number | null
          nature?: string | null
          objectifs?: string | null
          sidebar_commentaires?: string | null
          sidebar_date_modif?: string | null
          sidebar_objectifs?: string | null
          sidebar_phase?: string | null
          sidebar_statut?: string | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activitesconseillers_idconseiller_fkey"
            columns: ["idconseiller"]
            isOneToOne: false
            referencedRelation: "conseillers"
            referencedColumns: ["idconseiller"]
          },
          {
            foreignKeyName: "activitesconseillers_idexercice_fkey"
            columns: ["idexercice"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["idexercice"]
          },
          {
            foreignKeyName: "activitesconseillers_idpratique_fkey"
            columns: ["idpratique"]
            isOneToOne: false
            referencedRelation: "pratiques"
            referencedColumns: ["idpratique"]
          },
          {
            foreignKeyName: "activitesconseillers_idsujet_fkey"
            columns: ["idsujet"]
            isOneToOne: false
            referencedRelation: "sujets"
            referencedColumns: ["idsujet"]
          },
        ]
      }
      activitesconseillers_pratiques: {
        Row: {
          idactivite: number
          idactivitepratique: number
          idpratique: number
          travaille: boolean
        }
        Insert: {
          idactivite: number
          idactivitepratique?: number
          idpratique: number
          travaille?: boolean
        }
        Update: {
          idactivite?: number
          idactivitepratique?: number
          idpratique?: number
          travaille?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "activitesconseillers_pratiques_idactivite_fkey"
            columns: ["idactivite"]
            isOneToOne: false
            referencedRelation: "activitesconseillers"
            referencedColumns: ["idactivite"]
          },
          {
            foreignKeyName: "activitesconseillers_pratiques_idpratique_fkey"
            columns: ["idpratique"]
            isOneToOne: false
            referencedRelation: "pratiques"
            referencedColumns: ["idpratique"]
          },
        ]
      }
      activitesconseillers_sujets: {
        Row: {
          idactivite: number
          idactivitesujet: number
          idsujet: number
          note_conformite: string | null
          travaille: boolean
        }
        Insert: {
          idactivite: number
          idactivitesujet?: number
          idsujet: number
          note_conformite?: string | null
          travaille?: boolean
        }
        Update: {
          idactivite?: number
          idactivitesujet?: number
          idsujet?: number
          note_conformite?: string | null
          travaille?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "activitesconseillers_sujets_idactivite_fkey"
            columns: ["idactivite"]
            isOneToOne: false
            referencedRelation: "activitesconseillers"
            referencedColumns: ["idactivite"]
          },
          {
            foreignKeyName: "activitesconseillers_sujets_idsujet_fkey"
            columns: ["idsujet"]
            isOneToOne: false
            referencedRelation: "sujets"
            referencedColumns: ["idsujet"]
          },
        ]
      }
      algorithm_version_registry: {
        Row: {
          changelog: string | null
          created_at: string | null
          deprecated: boolean | null
          description: string | null
          is_active: boolean | null
          level1_metrics: Json | null
          m1_config: Json | null
          m1_key: string | null
          m1_version: string | null
          m2_config: Json | null
          m2_key: string | null
          m2_version: string | null
          m3_config: Json | null
          m3_key: string | null
          m3_version: string | null
          version_id: string
          version_name: string | null
          x_config: Json | null
          x_key: string | null
          x_version: string | null
          y_config: Json | null
          y_key: string | null
          y_version: string | null
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          deprecated?: boolean | null
          description?: string | null
          is_active?: boolean | null
          level1_metrics?: Json | null
          m1_config?: Json | null
          m1_key?: string | null
          m1_version?: string | null
          m2_config?: Json | null
          m2_key?: string | null
          m2_version?: string | null
          m3_config?: Json | null
          m3_key?: string | null
          m3_version?: string | null
          version_id: string
          version_name?: string | null
          x_config?: Json | null
          x_key?: string | null
          x_version?: string | null
          y_config?: Json | null
          y_key?: string | null
          y_version?: string | null
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          deprecated?: boolean | null
          description?: string | null
          is_active?: boolean | null
          level1_metrics?: Json | null
          m1_config?: Json | null
          m1_key?: string | null
          m1_version?: string | null
          m2_config?: Json | null
          m2_key?: string | null
          m2_version?: string | null
          m3_config?: Json | null
          m3_key?: string | null
          m3_version?: string | null
          version_id?: string
          version_name?: string | null
          x_config?: Json | null
          x_key?: string | null
          x_version?: string | null
          y_config?: Json | null
          y_key?: string | null
          y_version?: string | null
        }
        Relationships: []
      }
      avatars: {
        Row: {
          anonyme: boolean
          categorie: string | null
          filename: string | null
          idavatar: number
          nom: string
          url: string
        }
        Insert: {
          anonyme?: boolean
          categorie?: string | null
          filename?: string | null
          idavatar?: number
          nom: string
          url: string
        }
        Update: {
          anonyme?: boolean
          categorie?: string | null
          filename?: string | null
          idavatar?: number
          nom?: string
          url?: string
        }
        Relationships: []
      }
      avisexercicesnudges: {
        Row: {
          avis: string | null
          idactivite: number | null
          idavis: number
          idexercice: number | null
          idnudge: number | null
          idpratique: number | null
          nudgeindex: number | null
          typeavis: string | null
          userlike: number | null
        }
        Insert: {
          avis?: string | null
          idactivite?: number | null
          idavis?: number
          idexercice?: number | null
          idnudge?: number | null
          idpratique?: number | null
          nudgeindex?: number | null
          typeavis?: string | null
          userlike?: number | null
        }
        Update: {
          avis?: string | null
          idactivite?: number | null
          idavis?: number
          idexercice?: number | null
          idnudge?: number | null
          idpratique?: number | null
          nudgeindex?: number | null
          typeavis?: string | null
          userlike?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avisexercices_idpratique_fkey"
            columns: ["idpratique"]
            isOneToOne: false
            referencedRelation: "pratiques"
            referencedColumns: ["idpratique"]
          },
          {
            foreignKeyName: "fk_activiteconseiller"
            columns: ["idactivite"]
            isOneToOne: false
            referencedRelation: "activitesconseillers"
            referencedColumns: ["idactivite"]
          },
          {
            foreignKeyName: "public_avisexercices_idexercice_fkey"
            columns: ["idexercice"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["idexercice"]
          },
          {
            foreignKeyName: "public_avisexercicesnudges_idnudge_fkey"
            columns: ["idnudge"]
            isOneToOne: false
            referencedRelation: "nudge"
            referencedColumns: ["id"]
          },
        ]
      }
      call: {
        Row: {
          archived: boolean | null
          audiourl: string | null
          callid: number
          description: string | null
          duree: number | null
          filename: string | null
          filepath: string | null
          is_tagging_call: boolean | null
          origine: string | null
          preparedfortranscript: boolean | null
          status: string | null
          transcription: Json | null
          upload: boolean | null
        }
        Insert: {
          archived?: boolean | null
          audiourl?: string | null
          callid?: number
          description?: string | null
          duree?: number | null
          filename?: string | null
          filepath?: string | null
          is_tagging_call?: boolean | null
          origine?: string | null
          preparedfortranscript?: boolean | null
          status?: string | null
          transcription?: Json | null
          upload?: boolean | null
        }
        Update: {
          archived?: boolean | null
          audiourl?: string | null
          callid?: number
          description?: string | null
          duree?: number | null
          filename?: string | null
          filepath?: string | null
          is_tagging_call?: boolean | null
          origine?: string | null
          preparedfortranscript?: boolean | null
          status?: string | null
          transcription?: Json | null
          upload?: boolean | null
        }
        Relationships: []
      }
      callactivityrelation: {
        Row: {
          activityid: number | null
          callid: number | null
        }
        Insert: {
          activityid?: number | null
          callid?: number | null
        }
        Update: {
          activityid?: number | null
          callid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "callactivityrelation_activityid_fkey"
            columns: ["activityid"]
            isOneToOne: false
            referencedRelation: "activitesconseillers"
            referencedColumns: ["idactivite"]
          },
          {
            foreignKeyName: "callactivityrelation_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "callactivityrelation_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call_summary"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "callactivityrelation_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call_with_tagging_status"
            referencedColumns: ["callid"]
          },
        ]
      }
      categoriespratiques: {
        Row: {
          couleur: string
          idcategoriepratique: number
          nomcategorie: string
        }
        Insert: {
          couleur: string
          idcategoriepratique?: number
          nomcategorie: string
        }
        Update: {
          couleur?: string
          idcategoriepratique?: number
          nomcategorie?: string
        }
        Relationships: []
      }
      categoriessujets: {
        Row: {
          couleur: string
          description: string | null
          idcategoriesujet: number
          nomcategorie: string
        }
        Insert: {
          couleur: string
          description?: string | null
          idcategoriesujet?: number
          nomcategorie: string
        }
        Update: {
          couleur?: string
          description?: string | null
          idcategoriesujet?: number
          nomcategorie?: string
        }
        Relationships: []
      }
      conseillers: {
        Row: {
          email: string | null
          entreprise: number | null
          estanonyme: boolean | null
          idavatar: number | null
          idconseiller: number
          nom: string
          prenom: string
          pseudo: string | null
        }
        Insert: {
          email?: string | null
          entreprise?: number | null
          estanonyme?: boolean | null
          idavatar?: number | null
          idconseiller?: number
          nom: string
          prenom: string
          pseudo?: string | null
        }
        Update: {
          email?: string | null
          entreprise?: number | null
          estanonyme?: boolean | null
          idavatar?: number | null
          idconseiller?: number
          nom?: string
          prenom?: string
          pseudo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_conseillers_avatars"
            columns: ["idavatar"]
            isOneToOne: false
            referencedRelation: "avatars"
            referencedColumns: ["idavatar"]
          },
          {
            foreignKeyName: "public_conseillers_entreprise_fkey"
            columns: ["entreprise"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["identreprise"]
          },
        ]
      }
      custom_nudges: {
        Row: {
          custom_nudge1: string | null
          custom_nudge1_date: string | null
          custom_nudge2: string | null
          custom_nudge2_date: string | null
          custom_nudge3: string | null
          custom_nudge3_date: string | null
          custom_nudge4: string | null
          custom_nudge4_date: string | null
          custom_nudge5: string | null
          custom_nudge5_date: string | null
          custom_nudge6: string | null
          custom_nudge6_date: string | null
          id: number
          id_activite: number | null
          id_pratique: number | null
        }
        Insert: {
          custom_nudge1?: string | null
          custom_nudge1_date?: string | null
          custom_nudge2?: string | null
          custom_nudge2_date?: string | null
          custom_nudge3?: string | null
          custom_nudge3_date?: string | null
          custom_nudge4?: string | null
          custom_nudge4_date?: string | null
          custom_nudge5?: string | null
          custom_nudge5_date?: string | null
          custom_nudge6?: string | null
          custom_nudge6_date?: string | null
          id?: number
          id_activite?: number | null
          id_pratique?: number | null
        }
        Update: {
          custom_nudge1?: string | null
          custom_nudge1_date?: string | null
          custom_nudge2?: string | null
          custom_nudge2_date?: string | null
          custom_nudge3?: string | null
          custom_nudge3_date?: string | null
          custom_nudge4?: string | null
          custom_nudge4_date?: string | null
          custom_nudge5?: string | null
          custom_nudge5_date?: string | null
          custom_nudge6?: string | null
          custom_nudge6_date?: string | null
          id?: number
          id_activite?: number | null
          id_pratique?: number | null
        }
        Relationships: []
      }
      customnudges: {
        Row: {
          idactivite: number
          idcustomnudge: number
          idnudgeoriginal: number
          modifications: Json
        }
        Insert: {
          idactivite: number
          idcustomnudge?: number
          idnudgeoriginal: number
          modifications: Json
        }
        Update: {
          idactivite?: number
          idcustomnudge?: number
          idnudgeoriginal?: number
          modifications?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fk_activite"
            columns: ["idactivite"]
            isOneToOne: false
            referencedRelation: "activitesconseillers"
            referencedColumns: ["idactivite"]
          },
          {
            foreignKeyName: "public_customnudges_idnudgeoriginal_fkey"
            columns: ["idnudgeoriginal"]
            isOneToOne: false
            referencedRelation: "nudge"
            referencedColumns: ["id"]
          },
        ]
      }
      deroule_coaching: {
        Row: {
          atout_contenu: string | null
          atout_titre: string | null
          ecoute_appel_contenu: string | null
          ecoute_appel_titre: string | null
          entrainement_contenu: string | null
          entrainement_titre: string | null
          global_contenu: string | null
          global_titre: string | null
          id: number
          jeuderole_contenu: string | null
          jeuderole_titre: string | null
          levier_contenu: string | null
          levier_titre: string | null
          ouverture_contenu: string | null
          ouverture_titre: string | null
        }
        Insert: {
          atout_contenu?: string | null
          atout_titre?: string | null
          ecoute_appel_contenu?: string | null
          ecoute_appel_titre?: string | null
          entrainement_contenu?: string | null
          entrainement_titre?: string | null
          global_contenu?: string | null
          global_titre?: string | null
          id?: number
          jeuderole_contenu?: string | null
          jeuderole_titre?: string | null
          levier_contenu?: string | null
          levier_titre?: string | null
          ouverture_contenu?: string | null
          ouverture_titre?: string | null
        }
        Update: {
          atout_contenu?: string | null
          atout_titre?: string | null
          ecoute_appel_contenu?: string | null
          ecoute_appel_titre?: string | null
          entrainement_contenu?: string | null
          entrainement_titre?: string | null
          global_contenu?: string | null
          global_titre?: string | null
          id?: number
          jeuderole_contenu?: string | null
          jeuderole_titre?: string | null
          levier_contenu?: string | null
          levier_titre?: string | null
          ouverture_contenu?: string | null
          ouverture_titre?: string | null
        }
        Relationships: []
      }
      domaines: {
        Row: {
          description: string | null
          iddomaine: number
          nomdomaine: string
        }
        Insert: {
          description?: string | null
          iddomaine?: number
          nomdomaine: string
        }
        Update: {
          description?: string | null
          iddomaine?: number
          nomdomaine?: string
        }
        Relationships: []
      }
      entreprise_call: {
        Row: {
          callid: number
          identreprise: number
        }
        Insert: {
          callid: number
          identreprise: number
        }
        Update: {
          callid?: number
          identreprise?: number
        }
        Relationships: [
          {
            foreignKeyName: "entreprise_call_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "entreprise_call_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call_summary"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "entreprise_call_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call_with_tagging_status"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "entreprise_call_identreprise_fkey"
            columns: ["identreprise"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["identreprise"]
          },
        ]
      }
      entreprise_domaines: {
        Row: {
          iddomaine: number
          identreprise: number
        }
        Insert: {
          iddomaine: number
          identreprise: number
        }
        Update: {
          iddomaine?: number
          identreprise?: number
        }
        Relationships: [
          {
            foreignKeyName: "entreprise_domaines_iddomaine_fkey"
            columns: ["iddomaine"]
            isOneToOne: false
            referencedRelation: "domaines"
            referencedColumns: ["iddomaine"]
          },
          {
            foreignKeyName: "entreprise_domaines_identreprise_fkey"
            columns: ["identreprise"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["identreprise"]
          },
        ]
      }
      entreprise_pratiques: {
        Row: {
          fiche_coach_json: Json | null
          fiche_conseiller_json: Json | null
          id: number
          identreprise: number
          idpratique: number
        }
        Insert: {
          fiche_coach_json?: Json | null
          fiche_conseiller_json?: Json | null
          id?: number
          identreprise: number
          idpratique: number
        }
        Update: {
          fiche_coach_json?: Json | null
          fiche_conseiller_json?: Json | null
          id?: number
          identreprise?: number
          idpratique?: number
        }
        Relationships: [
          {
            foreignKeyName: "entreprise_pratiques_identreprise_fkey"
            columns: ["identreprise"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["identreprise"]
          },
          {
            foreignKeyName: "entreprise_pratiques_idpratique_fkey"
            columns: ["idpratique"]
            isOneToOne: false
            referencedRelation: "pratiques"
            referencedColumns: ["idpratique"]
          },
        ]
      }
      entreprises: {
        Row: {
          created_at: string
          domaine: string | null
          identreprise: number
          logo: string | null
          nomentreprise: string | null
        }
        Insert: {
          created_at?: string
          domaine?: string | null
          identreprise?: number
          logo?: string | null
          nomentreprise?: string | null
        }
        Update: {
          created_at?: string
          domaine?: string | null
          identreprise?: number
          logo?: string | null
          nomentreprise?: string | null
        }
        Relationships: []
      }
      exercices: {
        Row: {
          description: string | null
          idexercice: number
          idpratique: number
          nomexercice: string
          nudges: Json | null
        }
        Insert: {
          description?: string | null
          idexercice?: number
          idpratique: number
          nomexercice: string
          nudges?: Json | null
        }
        Update: {
          description?: string | null
          idexercice?: number
          idpratique?: number
          nomexercice?: string
          nudges?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "exercices_idpratique_fkey"
            columns: ["idpratique"]
            isOneToOne: false
            referencedRelation: "pratiques"
            referencedColumns: ["idpratique"]
          },
        ]
      }
      exercices_nudges: {
        Row: {
          idexercice: number
          idexercicenudge: number
          idnudge: number
        }
        Insert: {
          idexercice: number
          idexercicenudge?: number
          idnudge: number
        }
        Update: {
          idexercice?: number
          idexercicenudge?: number
          idnudge?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercices_nudges_idexercice_fkey"
            columns: ["idexercice"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["idexercice"]
          },
          {
            foreignKeyName: "exercices_nudges_idnudge_fkey"
            columns: ["idnudge"]
            isOneToOne: false
            referencedRelation: "nudge"
            referencedColumns: ["id"]
          },
        ]
      }
      h2_analysis_pairs: {
        Row: {
          algorithm_version: string | null
          annotations: Json | null
          call_id: string
          client_end_time: number
          client_speaker: string | null
          client_start_time: number
          client_turn_id: number
          client_verbatim: string
          computation_status: string | null
          computed_at: string | null
          conseiller_end_time: number
          conseiller_speaker: string | null
          conseiller_start_time: number
          conseiller_turn_id: number
          conseiller_verbatim: string
          created_at: string | null
          m1_action_verbs: string[] | null
          m1_total_words: number | null
          m1_verb_count: number | null
          m1_verb_density: number | null
          m2_global_alignment: number | null
          m2_lexical_alignment: number | null
          m2_semantic_alignment: number | null
          m2_shared_terms: string[] | null
          m3_clarification_count: number | null
          m3_cognitive_load: string | null
          m3_cognitive_score: number | null
          m3_hesitation_count: number | null
          m3_patterns: Json | null
          next_turn_tag_auto: string | null
          next1_end_time: number | null
          next1_speaker: string | null
          next1_start_time: number | null
          next1_tag: string | null
          next1_turn_id: number | null
          next1_verbatim: string | null
          next2_end_time: number | null
          next2_speaker: string | null
          next2_start_time: number | null
          next2_tag: string | null
          next2_turn_id: number | null
          next2_verbatim: string | null
          next3_end_time: number | null
          next3_speaker: string | null
          next3_start_time: number | null
          next3_tag: string | null
          next3_turn_id: number | null
          next3_verbatim: string | null
          next4_end_time: number | null
          next4_speaker: string | null
          next4_start_time: number | null
          next4_tag: string | null
          next4_turn_id: number | null
          next4_verbatim: string | null
          pair_id: number
          pair_index: number
          prev1_end_time: number | null
          prev1_speaker: string | null
          prev1_start_time: number | null
          prev1_tag: string | null
          prev1_turn_id: number | null
          prev1_verbatim: string | null
          prev2_end_time: number | null
          prev2_speaker: string | null
          prev2_start_time: number | null
          prev2_tag: string | null
          prev2_turn_id: number | null
          prev2_verbatim: string | null
          prev3_end_time: number | null
          prev3_speaker: string | null
          prev3_start_time: number | null
          prev3_tag: string | null
          prev3_turn_id: number | null
          prev3_verbatim: string | null
          prev4_end_time: number | null
          prev4_speaker: string | null
          prev4_start_time: number | null
          prev4_tag: string | null
          prev4_turn_id: number | null
          prev4_verbatim: string | null
          reaction_tag: string
          score_auto: number | null
          strategy_color: string | null
          strategy_family: string
          strategy_originespeaker: string | null
          strategy_tag: string
          updated_at: string | null
          version_metadata: Json | null
        }
        Insert: {
          algorithm_version?: string | null
          annotations?: Json | null
          call_id: string
          client_end_time: number
          client_speaker?: string | null
          client_start_time: number
          client_turn_id: number
          client_verbatim: string
          computation_status?: string | null
          computed_at?: string | null
          conseiller_end_time: number
          conseiller_speaker?: string | null
          conseiller_start_time: number
          conseiller_turn_id: number
          conseiller_verbatim: string
          created_at?: string | null
          m1_action_verbs?: string[] | null
          m1_total_words?: number | null
          m1_verb_count?: number | null
          m1_verb_density?: number | null
          m2_global_alignment?: number | null
          m2_lexical_alignment?: number | null
          m2_semantic_alignment?: number | null
          m2_shared_terms?: string[] | null
          m3_clarification_count?: number | null
          m3_cognitive_load?: string | null
          m3_cognitive_score?: number | null
          m3_hesitation_count?: number | null
          m3_patterns?: Json | null
          next_turn_tag_auto?: string | null
          next1_end_time?: number | null
          next1_speaker?: string | null
          next1_start_time?: number | null
          next1_tag?: string | null
          next1_turn_id?: number | null
          next1_verbatim?: string | null
          next2_end_time?: number | null
          next2_speaker?: string | null
          next2_start_time?: number | null
          next2_tag?: string | null
          next2_turn_id?: number | null
          next2_verbatim?: string | null
          next3_end_time?: number | null
          next3_speaker?: string | null
          next3_start_time?: number | null
          next3_tag?: string | null
          next3_turn_id?: number | null
          next3_verbatim?: string | null
          next4_end_time?: number | null
          next4_speaker?: string | null
          next4_start_time?: number | null
          next4_tag?: string | null
          next4_turn_id?: number | null
          next4_verbatim?: string | null
          pair_id?: number
          pair_index: number
          prev1_end_time?: number | null
          prev1_speaker?: string | null
          prev1_start_time?: number | null
          prev1_tag?: string | null
          prev1_turn_id?: number | null
          prev1_verbatim?: string | null
          prev2_end_time?: number | null
          prev2_speaker?: string | null
          prev2_start_time?: number | null
          prev2_tag?: string | null
          prev2_turn_id?: number | null
          prev2_verbatim?: string | null
          prev3_end_time?: number | null
          prev3_speaker?: string | null
          prev3_start_time?: number | null
          prev3_tag?: string | null
          prev3_turn_id?: number | null
          prev3_verbatim?: string | null
          prev4_end_time?: number | null
          prev4_speaker?: string | null
          prev4_start_time?: number | null
          prev4_tag?: string | null
          prev4_turn_id?: number | null
          prev4_verbatim?: string | null
          reaction_tag: string
          score_auto?: number | null
          strategy_color?: string | null
          strategy_family: string
          strategy_originespeaker?: string | null
          strategy_tag: string
          updated_at?: string | null
          version_metadata?: Json | null
        }
        Update: {
          algorithm_version?: string | null
          annotations?: Json | null
          call_id?: string
          client_end_time?: number
          client_speaker?: string | null
          client_start_time?: number
          client_turn_id?: number
          client_verbatim?: string
          computation_status?: string | null
          computed_at?: string | null
          conseiller_end_time?: number
          conseiller_speaker?: string | null
          conseiller_start_time?: number
          conseiller_turn_id?: number
          conseiller_verbatim?: string
          created_at?: string | null
          m1_action_verbs?: string[] | null
          m1_total_words?: number | null
          m1_verb_count?: number | null
          m1_verb_density?: number | null
          m2_global_alignment?: number | null
          m2_lexical_alignment?: number | null
          m2_semantic_alignment?: number | null
          m2_shared_terms?: string[] | null
          m3_clarification_count?: number | null
          m3_cognitive_load?: string | null
          m3_cognitive_score?: number | null
          m3_hesitation_count?: number | null
          m3_patterns?: Json | null
          next_turn_tag_auto?: string | null
          next1_end_time?: number | null
          next1_speaker?: string | null
          next1_start_time?: number | null
          next1_tag?: string | null
          next1_turn_id?: number | null
          next1_verbatim?: string | null
          next2_end_time?: number | null
          next2_speaker?: string | null
          next2_start_time?: number | null
          next2_tag?: string | null
          next2_turn_id?: number | null
          next2_verbatim?: string | null
          next3_end_time?: number | null
          next3_speaker?: string | null
          next3_start_time?: number | null
          next3_tag?: string | null
          next3_turn_id?: number | null
          next3_verbatim?: string | null
          next4_end_time?: number | null
          next4_speaker?: string | null
          next4_start_time?: number | null
          next4_tag?: string | null
          next4_turn_id?: number | null
          next4_verbatim?: string | null
          pair_id?: number
          pair_index?: number
          prev1_end_time?: number | null
          prev1_speaker?: string | null
          prev1_start_time?: number | null
          prev1_tag?: string | null
          prev1_turn_id?: number | null
          prev1_verbatim?: string | null
          prev2_end_time?: number | null
          prev2_speaker?: string | null
          prev2_start_time?: number | null
          prev2_tag?: string | null
          prev2_turn_id?: number | null
          prev2_verbatim?: string | null
          prev3_end_time?: number | null
          prev3_speaker?: string | null
          prev3_start_time?: number | null
          prev3_tag?: string | null
          prev3_turn_id?: number | null
          prev3_verbatim?: string | null
          prev4_end_time?: number | null
          prev4_speaker?: string | null
          prev4_start_time?: number | null
          prev4_tag?: string | null
          prev4_turn_id?: number | null
          prev4_verbatim?: string | null
          reaction_tag?: string
          score_auto?: number | null
          strategy_color?: string | null
          strategy_family?: string
          strategy_originespeaker?: string | null
          strategy_tag?: string
          updated_at?: string | null
          version_metadata?: Json | null
        }
        Relationships: []
      }
      h2_analysis_pairs_backup: {
        Row: {
          annotations: Json | null
          call_id: number | null
          client_verbatim: string | null
          computation_status: string | null
          computed_at: string | null
          conseiller_end_time: number | null
          conseiller_speaker: string | null
          conseiller_start_time: number | null
          conseiller_turn_id: number | null
          conseiller_verbatim: string | null
          m1_action_verbs: string[] | null
          m1_total_words: number | null
          m1_verb_count: number | null
          m1_verb_density: number | null
          m2_global_alignment: number | null
          m2_lexical_alignment: number | null
          m2_semantic_alignment: number | null
          m2_shared_terms: string[] | null
          m3_clarification_count: number | null
          m3_cognitive_load: string | null
          m3_cognitive_score: number | null
          m3_hesitation_count: number | null
          m3_patterns: Json | null
          next_turn_tag_auto: string | null
          pair_id: number | null
          reaction_tag: string | null
          score_auto: number | null
          strategy_color: string | null
          strategy_family: string | null
          strategy_originespeaker: string | null
          strategy_tag: string | null
        }
        Insert: {
          annotations?: Json | null
          call_id?: number | null
          client_verbatim?: string | null
          computation_status?: string | null
          computed_at?: string | null
          conseiller_end_time?: number | null
          conseiller_speaker?: string | null
          conseiller_start_time?: number | null
          conseiller_turn_id?: number | null
          conseiller_verbatim?: string | null
          m1_action_verbs?: string[] | null
          m1_total_words?: number | null
          m1_verb_count?: number | null
          m1_verb_density?: number | null
          m2_global_alignment?: number | null
          m2_lexical_alignment?: number | null
          m2_semantic_alignment?: number | null
          m2_shared_terms?: string[] | null
          m3_clarification_count?: number | null
          m3_cognitive_load?: string | null
          m3_cognitive_score?: number | null
          m3_hesitation_count?: number | null
          m3_patterns?: Json | null
          next_turn_tag_auto?: string | null
          pair_id?: number | null
          reaction_tag?: string | null
          score_auto?: number | null
          strategy_color?: string | null
          strategy_family?: string | null
          strategy_originespeaker?: string | null
          strategy_tag?: string | null
        }
        Update: {
          annotations?: Json | null
          call_id?: number | null
          client_verbatim?: string | null
          computation_status?: string | null
          computed_at?: string | null
          conseiller_end_time?: number | null
          conseiller_speaker?: string | null
          conseiller_start_time?: number | null
          conseiller_turn_id?: number | null
          conseiller_verbatim?: string | null
          m1_action_verbs?: string[] | null
          m1_total_words?: number | null
          m1_verb_count?: number | null
          m1_verb_density?: number | null
          m2_global_alignment?: number | null
          m2_lexical_alignment?: number | null
          m2_semantic_alignment?: number | null
          m2_shared_terms?: string[] | null
          m3_clarification_count?: number | null
          m3_cognitive_load?: string | null
          m3_cognitive_score?: number | null
          m3_hesitation_count?: number | null
          m3_patterns?: Json | null
          next_turn_tag_auto?: string | null
          pair_id?: number | null
          reaction_tag?: string | null
          score_auto?: number | null
          strategy_color?: string | null
          strategy_family?: string | null
          strategy_originespeaker?: string | null
          strategy_tag?: string | null
        }
        Relationships: []
      }
      h2_mediation_results: {
        Row: {
          analyzed_at: string | null
          conclusion: string | null
          confidence_interval: Json | null
          direct_effect: number | null
          fit_indices: Json | null
          id: number
          indirect_effect: number | null
          mediation_proportion: number | null
          p_value: number | null
          sample_size: number
          total_effect: number | null
          version_id: string | null
        }
        Insert: {
          analyzed_at?: string | null
          conclusion?: string | null
          confidence_interval?: Json | null
          direct_effect?: number | null
          fit_indices?: Json | null
          id?: number
          indirect_effect?: number | null
          mediation_proportion?: number | null
          p_value?: number | null
          sample_size: number
          total_effect?: number | null
          version_id?: string | null
        }
        Update: {
          analyzed_at?: string | null
          conclusion?: string | null
          confidence_interval?: Json | null
          direct_effect?: number | null
          fit_indices?: Json | null
          id?: number
          indirect_effect?: number | null
          mediation_proportion?: number | null
          p_value?: number | null
          sample_size?: number
          total_effect?: number | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "h2_mediation_results_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "algorithm_version_registry"
            referencedColumns: ["version_id"]
          },
        ]
      }
      icon: {
        Row: {
          data: Json | null
          iconid: number
          quizid: number | null
          type: string | null
          wordid: number
        }
        Insert: {
          data?: Json | null
          iconid?: number
          quizid?: number | null
          type?: string | null
          wordid: number
        }
        Update: {
          data?: Json | null
          iconid?: number
          quizid?: number | null
          type?: string | null
          wordid?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_word"
            columns: ["wordid"]
            isOneToOne: false
            referencedRelation: "word"
            referencedColumns: ["wordid"]
          },
        ]
      }
      level1_validation_results: {
        Row: {
          algorithm_key: string
          algorithm_version: string
          created_at: string | null
          id: number
          metrics: Json
          predictions: Json | null
          sample_size: number
          variable: string
        }
        Insert: {
          algorithm_key: string
          algorithm_version: string
          created_at?: string | null
          id?: number
          metrics: Json
          predictions?: Json | null
          sample_size: number
          variable: string
        }
        Update: {
          algorithm_key?: string
          algorithm_version?: string
          created_at?: string | null
          id?: number
          metrics?: Json
          predictions?: Json | null
          sample_size?: number
          variable?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          details: Json | null
          id: number
          level: string | null
          message: string | null
          timestamp: string | null
        }
        Insert: {
          details?: Json | null
          id?: number
          level?: string | null
          message?: string | null
          timestamp?: string | null
        }
        Update: {
          details?: Json | null
          id?: number
          level?: string | null
          message?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      lpltag: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          family: string | null
          icon: string | null
          id: number
          label: string
          originespeaker: string | null
        }
        Insert: {
          color: string
          created_at?: string | null
          description?: string | null
          family?: string | null
          icon?: string | null
          id?: number
          label: string
          originespeaker?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          family?: string | null
          icon?: string | null
          id?: number
          label?: string
          originespeaker?: string | null
        }
        Relationships: []
      }
      motifs_afpa: {
        Row: {
          actif: boolean
          action_client: string | null
          avancement_date: boolean
          avancement_financement: boolean
          avancement_formation: boolean
          avancement_lieu: boolean
          callid: number | null
          commentaire: string | null
          id: number
          motifs: string
          promotion_reseau: boolean
        }
        Insert: {
          actif?: boolean
          action_client?: string | null
          avancement_date?: boolean
          avancement_financement?: boolean
          avancement_formation?: boolean
          avancement_lieu?: boolean
          callid?: number | null
          commentaire?: string | null
          id?: number
          motifs: string
          promotion_reseau?: boolean
        }
        Update: {
          actif?: boolean
          action_client?: string | null
          avancement_date?: boolean
          avancement_financement?: boolean
          avancement_formation?: boolean
          avancement_lieu?: boolean
          callid?: number | null
          commentaire?: string | null
          id?: number
          motifs?: string
          promotion_reseau?: boolean
        }
        Relationships: []
      }
      nudge: {
        Row: {
          created_at: string
          id: number
          nudge1: string | null
          nudge2: string | null
          nudge3: string | null
          nudge4: string | null
          nudge5: string | null
          nudge6: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          nudge1?: string | null
          nudge2?: string | null
          nudge3?: string | null
          nudge4?: string | null
          nudge5?: string | null
          nudge6?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          nudge1?: string | null
          nudge2?: string | null
          nudge3?: string | null
          nudge4?: string | null
          nudge5?: string | null
          nudge6?: string | null
        }
        Relationships: []
      }
      nudges: {
        Row: {
          description: string | null
          idexercice: number
          idnudge: number
          nomnudge: string
        }
        Insert: {
          description?: string | null
          idexercice: number
          idnudge?: number
          nomnudge: string
        }
        Update: {
          description?: string | null
          idexercice?: number
          idnudge?: number
          nomnudge?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_exercice"
            columns: ["idexercice"]
            isOneToOne: false
            referencedRelation: "exercices"
            referencedColumns: ["idexercice"]
          },
        ]
      }
      ponderation_sujets: {
        Row: {
          conforme: number
          id_ponderation: number
          idsujet: number | null
          non_conforme: number
          partiellement_conforme: number
          permet_partiellement_conforme: boolean | null
        }
        Insert: {
          conforme?: number
          id_ponderation?: number
          idsujet?: number | null
          non_conforme?: number
          partiellement_conforme?: number
          permet_partiellement_conforme?: boolean | null
        }
        Update: {
          conforme?: number
          id_ponderation?: number
          idsujet?: number | null
          non_conforme?: number
          partiellement_conforme?: number
          permet_partiellement_conforme?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ponderation_sujets_idsujet_fkey"
            columns: ["idsujet"]
            isOneToOne: true
            referencedRelation: "sujets"
            referencedColumns: ["idsujet"]
          },
        ]
      }
      postit: {
        Row: {
          callid: number
          created_at: string | null
          id: number
          iddomaine: number | null
          idpratique: number | null
          idsujet: number | null
          pratique: string | null
          sujet: string | null
          text: string | null
          timestamp: number
          word: string
          wordid: number
        }
        Insert: {
          callid: number
          created_at?: string | null
          id?: number
          iddomaine?: number | null
          idpratique?: number | null
          idsujet?: number | null
          pratique?: string | null
          sujet?: string | null
          text?: string | null
          timestamp: number
          word: string
          wordid: number
        }
        Update: {
          callid?: number
          created_at?: string | null
          id?: number
          iddomaine?: number | null
          idpratique?: number | null
          idsujet?: number | null
          pratique?: string | null
          sujet?: string | null
          text?: string | null
          timestamp?: number
          word?: string
          wordid?: number
        }
        Relationships: []
      }
      pratiques: {
        Row: {
          description: string | null
          fiche_coach_json: Json | null
          fiche_conseiller_json: Json | null
          geste: string | null
          idcategoriepratique: number | null
          idpratique: number
          jeuderole: Json | null
          nompratique: string
          valeurnumérique: number | null
        }
        Insert: {
          description?: string | null
          fiche_coach_json?: Json | null
          fiche_conseiller_json?: Json | null
          geste?: string | null
          idcategoriepratique?: number | null
          idpratique?: number
          jeuderole?: Json | null
          nompratique: string
          valeurnumérique?: number | null
        }
        Update: {
          description?: string | null
          fiche_coach_json?: Json | null
          fiche_conseiller_json?: Json | null
          geste?: string | null
          idcategoriepratique?: number | null
          idpratique?: number
          jeuderole?: Json | null
          nompratique?: string
          valeurnumérique?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pratiques_idcategoriepratique_fkey"
            columns: ["idcategoriepratique"]
            isOneToOne: false
            referencedRelation: "categoriespratiques"
            referencedColumns: ["idcategoriepratique"]
          },
        ]
      }
      quiz: {
        Row: {
          answercomments: string[] | null
          callid: number | null
          correctanswerindexes: number[] | null
          possibleanswers: string[] | null
          question: string | null
          quizdata: Json | null
          quizid: number
          timestamp: string | null
          wordid: number | null
        }
        Insert: {
          answercomments?: string[] | null
          callid?: number | null
          correctanswerindexes?: number[] | null
          possibleanswers?: string[] | null
          question?: string | null
          quizdata?: Json | null
          quizid?: number
          timestamp?: string | null
          wordid?: number | null
        }
        Update: {
          answercomments?: string[] | null
          callid?: number | null
          correctanswerindexes?: number[] | null
          possibleanswers?: string[] | null
          question?: string | null
          quizdata?: Json | null
          quizid?: number
          timestamp?: string | null
          wordid?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "quiz_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call_summary"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "quiz_callid_fkey"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call_with_tagging_status"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "quiz_wordid_fkey"
            columns: ["wordid"]
            isOneToOne: false
            referencedRelation: "word"
            referencedColumns: ["wordid"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          answers: string[] | null
          conseillerid: number | null
          quizid: number | null
          responseid: number
          submitted_at: string | null
        }
        Insert: {
          answers?: string[] | null
          conseillerid?: number | null
          quizid?: number | null
          responseid?: number
          submitted_at?: string | null
        }
        Update: {
          answers?: string[] | null
          conseillerid?: number | null
          quizid?: number | null
          responseid?: number
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_conseillerid_fkey"
            columns: ["conseillerid"]
            isOneToOne: false
            referencedRelation: "conseillers"
            referencedColumns: ["idconseiller"]
          },
          {
            foreignKeyName: "quiz_responses_quizid_fkey"
            columns: ["quizid"]
            isOneToOne: false
            referencedRelation: "quiz"
            referencedColumns: ["quizid"]
          },
        ]
      }
      roleplaydata: {
        Row: {
          call_id: number
          created_at: string | null
          id: number
          note: Json
          postit_id: number
          type: string | null
        }
        Insert: {
          call_id: number
          created_at?: string | null
          id?: number
          note: Json
          postit_id: number
          type?: string | null
        }
        Update: {
          call_id?: number
          created_at?: string | null
          id?: number
          note?: Json
          postit_id?: number
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_call"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "fk_call"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_summary"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "fk_call"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_with_tagging_status"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "fk_postit"
            columns: ["postit_id"]
            isOneToOne: false
            referencedRelation: "postit"
            referencedColumns: ["id"]
          },
        ]
      }
      sujets: {
        Row: {
          description: string | null
          idcategoriesujet: number | null
          iddomaine: number
          idsujet: number
          nomsujet: string
          valeurnumérique: number | null
        }
        Insert: {
          description?: string | null
          idcategoriesujet?: number | null
          iddomaine: number
          idsujet?: number
          nomsujet: string
          valeurnumérique?: number | null
        }
        Update: {
          description?: string | null
          idcategoriesujet?: number | null
          iddomaine?: number
          idsujet?: number
          nomsujet?: string
          valeurnumérique?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sujets_idcategoriesujet_fkey"
            columns: ["idcategoriesujet"]
            isOneToOne: false
            referencedRelation: "categoriessujets"
            referencedColumns: ["idcategoriesujet"]
          },
          {
            foreignKeyName: "sujets_iddomaine_fkey"
            columns: ["iddomaine"]
            isOneToOne: false
            referencedRelation: "domaines"
            referencedColumns: ["iddomaine"]
          },
        ]
      }
      sujetspratiques: {
        Row: {
          idpratique: number
          idsujet: number
          importance: number | null
        }
        Insert: {
          idpratique: number
          idsujet: number
          importance?: number | null
        }
        Update: {
          idpratique?: number
          idsujet?: number
          importance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sujetspratiques_idpratique_fkey"
            columns: ["idpratique"]
            isOneToOne: false
            referencedRelation: "pratiques"
            referencedColumns: ["idpratique"]
          },
          {
            foreignKeyName: "sujetspratiques_idsujet_fkey"
            columns: ["idsujet"]
            isOneToOne: false
            referencedRelation: "sujets"
            referencedColumns: ["idsujet"]
          },
        ]
      }
      tag: {
        Row: {
          description: string | null
          name: string
          tagid: number
        }
        Insert: {
          description?: string | null
          name: string
          tagid?: number
        }
        Update: {
          description?: string | null
          name?: string
          tagid?: number
        }
        Relationships: []
      }
      tag_history: {
        Row: {
          id: number
          new_label: string
          old_label: string
          updated_at: string
        }
        Insert: {
          id?: number
          new_label: string
          old_label: string
          updated_at?: string
        }
        Update: {
          id?: number
          new_label?: string
          old_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      tag_modifications: {
        Row: {
          action: string | null
          id: number
          modified_at: string | null
          modified_by: string | null
          new_tag: string | null
          old_tag: string | null
          previous_data: Json | null
        }
        Insert: {
          action?: string | null
          id?: number
          modified_at?: string | null
          modified_by?: string | null
          new_tag?: string | null
          old_tag?: string | null
          previous_data?: Json | null
        }
        Update: {
          action?: string | null
          id?: number
          modified_at?: string | null
          modified_by?: string | null
          new_tag?: string | null
          old_tag?: string | null
          previous_data?: Json | null
        }
        Relationships: []
      }
      transcript: {
        Row: {
          callid: number | null
          transcriptid: number
        }
        Insert: {
          callid?: number | null
          transcriptid?: number
        }
        Update: {
          callid?: number | null
          transcriptid?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_transcript_call"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "fk_transcript_call"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call_summary"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "fk_transcript_call"
            columns: ["callid"]
            isOneToOne: false
            referencedRelation: "call_with_tagging_status"
            referencedColumns: ["callid"]
          },
        ]
      }
      turntagged: {
        Row: {
          annotations: Json
          call_id: number
          date: string
          end_time: number
          id: number
          next_turn_tag: string | null
          next_turn_tag_auto: string | null
          next_turn_verbatim: string | null
          next1_turn_id: number | null
          next2_turn_id: number | null
          next3_turn_id: number | null
          next4_turn_id: number | null
          prev1_turn_id: number | null
          prev2_turn_id: number | null
          prev3_turn_id: number | null
          prev4_turn_id: number | null
          score_auto: number | null
          speaker: string | null
          start_time: number
          tag: string
          verbatim: string
        }
        Insert: {
          annotations?: Json
          call_id: number
          date?: string
          end_time: number
          id?: number
          next_turn_tag?: string | null
          next_turn_tag_auto?: string | null
          next_turn_verbatim?: string | null
          next1_turn_id?: number | null
          next2_turn_id?: number | null
          next3_turn_id?: number | null
          next4_turn_id?: number | null
          prev1_turn_id?: number | null
          prev2_turn_id?: number | null
          prev3_turn_id?: number | null
          prev4_turn_id?: number | null
          score_auto?: number | null
          speaker?: string | null
          start_time: number
          tag: string
          verbatim: string
        }
        Update: {
          annotations?: Json
          call_id?: number
          date?: string
          end_time?: number
          id?: number
          next_turn_tag?: string | null
          next_turn_tag_auto?: string | null
          next_turn_verbatim?: string | null
          next1_turn_id?: number | null
          next2_turn_id?: number | null
          next3_turn_id?: number | null
          next4_turn_id?: number | null
          prev1_turn_id?: number | null
          prev2_turn_id?: number | null
          prev3_turn_id?: number | null
          prev4_turn_id?: number | null
          score_auto?: number | null
          speaker?: string | null
          start_time?: number
          tag?: string
          verbatim?: string
        }
        Relationships: [
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_summary"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_with_tagging_status"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "turntagged_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "lpltag"
            referencedColumns: ["label"]
          },
        ]
      }
      turntagged_backup_20250115: {
        Row: {
          annotations: Json | null
          call_id: number | null
          date: string | null
          end_time: number | null
          id: number | null
          next_turn_tag: string | null
          next_turn_tag_auto: string | null
          next_turn_verbatim: string | null
          score_auto: number | null
          speaker: string | null
          start_time: number | null
          tag: string | null
          verbatim: string | null
        }
        Insert: {
          annotations?: Json | null
          call_id?: number | null
          date?: string | null
          end_time?: number | null
          id?: number | null
          next_turn_tag?: string | null
          next_turn_tag_auto?: string | null
          next_turn_verbatim?: string | null
          score_auto?: number | null
          speaker?: string | null
          start_time?: number | null
          tag?: string | null
          verbatim?: string | null
        }
        Update: {
          annotations?: Json | null
          call_id?: number | null
          date?: string | null
          end_time?: number | null
          id?: number | null
          next_turn_tag?: string | null
          next_turn_tag_auto?: string | null
          next_turn_verbatim?: string | null
          score_auto?: number | null
          speaker?: string | null
          start_time?: number | null
          tag?: string | null
          verbatim?: string | null
        }
        Relationships: []
      }
      user_enterprises: {
        Row: {
          entreprise_id: number | null
          id: number
          user_id: number | null
        }
        Insert: {
          entreprise_id?: number | null
          id?: number
          user_id?: number | null
        }
        Update: {
          entreprise_id?: number | null
          id?: number
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_enterprises_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["identreprise"]
          },
          {
            foreignKeyName: "user_enterprises_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: number
          role: string
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          role: string
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          role?: string
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          event_timestamp: string | null
          event_type: string
          id: number
          sign_out_at: string | null
          user_id: string
        }
        Insert: {
          event_timestamp?: string | null
          event_type: string
          id?: number
          sign_out_at?: string | null
          user_id: string
        }
        Update: {
          event_timestamp?: string | null
          event_type?: string
          id?: number
          sign_out_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_sessions_backup: {
        Row: {
          event_timestamp: string | null
          event_type: string
          id: number
          session_id: string | null
          sign_in_at: string | null
          sign_out_at: string | null
          user_id: string
        }
        Insert: {
          event_timestamp?: string | null
          event_type: string
          id?: number
          session_id?: string | null
          sign_in_at?: string | null
          sign_out_at?: string | null
          user_id: string
        }
        Update: {
          event_timestamp?: string | null
          event_type?: string
          id?: number
          session_id?: string | null
          sign_in_at?: string | null
          sign_out_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          entreprise_id: number | null
          id: number
          refresh_token: string | null
          zoho_refresh_token: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          entreprise_id?: number | null
          id?: number
          refresh_token?: string | null
          zoho_refresh_token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          entreprise_id?: number | null
          id?: number
          refresh_token?: string | null
          zoho_refresh_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_entreprise_id_fkey"
            columns: ["entreprise_id"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["identreprise"]
          },
        ]
      }
      word: {
        Row: {
          endTime: number | null
          startTime: number | null
          text: string | null
          transcriptid: number | null
          turn: string | null
          type: string | null
          wordid: number
        }
        Insert: {
          endTime?: number | null
          startTime?: number | null
          text?: string | null
          transcriptid?: number | null
          turn?: string | null
          type?: string | null
          wordid?: number
        }
        Update: {
          endTime?: number | null
          startTime?: number | null
          text?: string | null
          transcriptid?: number | null
          turn?: string | null
          type?: string | null
          wordid?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_word_transcript"
            columns: ["transcriptid"]
            isOneToOne: false
            referencedRelation: "transcript"
            referencedColumns: ["transcriptid"]
          },
        ]
      }
      word_tag: {
        Row: {
          confidence: number | null
          tagid: number
          wordid: number
        }
        Insert: {
          confidence?: number | null
          tagid: number
          wordid: number
        }
        Update: {
          confidence?: number | null
          tagid?: number
          wordid?: number
        }
        Relationships: [
          {
            foreignKeyName: "word_tag_tagid_fkey"
            columns: ["tagid"]
            isOneToOne: false
            referencedRelation: "tag"
            referencedColumns: ["tagid"]
          },
          {
            foreignKeyName: "word_tag_wordid_fkey"
            columns: ["wordid"]
            isOneToOne: false
            referencedRelation: "word"
            referencedColumns: ["wordid"]
          },
        ]
      }
    }
    Views: {
      call_relations_stats: {
        Row: {
          call_id: number | null
          completion_percent: number | null
          last_calculated: string | null
          status: string | null
          tagged_turns: number | null
          total_turns: number | null
        }
        Relationships: [
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_summary"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_with_tagging_status"
            referencedColumns: ["callid"]
          },
        ]
      }
      call_summary: {
        Row: {
          activity_count: number | null
          archived: boolean | null
          callid: number | null
          description: string | null
          duration_sec: number | null
          duree: number | null
          filename: string | null
          has_transcript: boolean | null
          identreprise: number | null
          is_tagging_call: boolean | null
          origine: string | null
          postit_count: number | null
          preparedfortranscript: boolean | null
          status: string | null
          tag_count: number | null
          upload: boolean | null
          word_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entreprise_call_identreprise_fkey"
            columns: ["identreprise"]
            isOneToOne: false
            referencedRelation: "entreprises"
            referencedColumns: ["identreprise"]
          },
        ]
      }
      call_with_tagging_status: {
        Row: {
          archived: boolean | null
          audiourl: string | null
          callid: number | null
          description: string | null
          duree: number | null
          filename: string | null
          filepath: string | null
          is_tagged: boolean | null
          is_tagging_call: boolean | null
          origine: string | null
          preparedfortranscript: boolean | null
          status: string | null
          tag_count: number | null
          transcription: Json | null
          upload: boolean | null
        }
        Relationships: []
      }
      h2_context_sequence_validation: {
        Row: {
          adjacency_quality: string | null
          call_id: string | null
          client_duration: number | null
          client_end_time: number | null
          client_start_time: number | null
          conseiller_duration: number | null
          conseiller_end_time: number | null
          conseiller_start_time: number | null
          context_depth: number | null
          gap_client_next1: number | null
          gap_conseiller_client: number | null
          gap_next1_next2: number | null
          gap_next2_next3: number | null
          gap_prev1_conseiller: number | null
          gap_prev2_prev1: number | null
          gap_prev3_prev2: number | null
          gap_prev4_prev3: number | null
          next1_end_time: number | null
          next1_start_time: number | null
          next2_end_time: number | null
          next2_start_time: number | null
          next3_end_time: number | null
          next3_start_time: number | null
          pair_id: number | null
          prev1_end_time: number | null
          prev1_start_time: number | null
          prev2_end_time: number | null
          prev2_start_time: number | null
          prev3_end_time: number | null
          prev3_start_time: number | null
          prev4_end_time: number | null
          prev4_start_time: number | null
          reaction_tag: string | null
          sequence_validation: string | null
          strategy_tag: string | null
        }
        Insert: {
          adjacency_quality?: never
          call_id?: string | null
          client_duration?: never
          client_end_time?: number | null
          client_start_time?: number | null
          conseiller_duration?: never
          conseiller_end_time?: number | null
          conseiller_start_time?: number | null
          context_depth?: never
          gap_client_next1?: never
          gap_conseiller_client?: never
          gap_next1_next2?: never
          gap_next2_next3?: never
          gap_prev1_conseiller?: never
          gap_prev2_prev1?: never
          gap_prev3_prev2?: never
          gap_prev4_prev3?: never
          next1_end_time?: number | null
          next1_start_time?: number | null
          next2_end_time?: number | null
          next2_start_time?: number | null
          next3_end_time?: number | null
          next3_start_time?: number | null
          pair_id?: number | null
          prev1_end_time?: number | null
          prev1_start_time?: number | null
          prev2_end_time?: number | null
          prev2_start_time?: number | null
          prev3_end_time?: number | null
          prev3_start_time?: number | null
          prev4_end_time?: number | null
          prev4_start_time?: number | null
          reaction_tag?: string | null
          sequence_validation?: never
          strategy_tag?: string | null
        }
        Update: {
          adjacency_quality?: never
          call_id?: string | null
          client_duration?: never
          client_end_time?: number | null
          client_start_time?: number | null
          conseiller_duration?: never
          conseiller_end_time?: number | null
          conseiller_start_time?: number | null
          context_depth?: never
          gap_client_next1?: never
          gap_conseiller_client?: never
          gap_next1_next2?: never
          gap_next2_next3?: never
          gap_prev1_conseiller?: never
          gap_prev2_prev1?: never
          gap_prev3_prev2?: never
          gap_prev4_prev3?: never
          next1_end_time?: number | null
          next1_start_time?: number | null
          next2_end_time?: number | null
          next2_start_time?: number | null
          next3_end_time?: number | null
          next3_start_time?: number | null
          pair_id?: number | null
          prev1_end_time?: number | null
          prev1_start_time?: number | null
          prev2_end_time?: number | null
          prev2_start_time?: number | null
          prev3_end_time?: number | null
          prev3_start_time?: number | null
          prev4_end_time?: number | null
          prev4_start_time?: number | null
          reaction_tag?: string | null
          sequence_validation?: never
          strategy_tag?: string | null
        }
        Relationships: []
      }
      turntagged_with_context: {
        Row: {
          annotations: Json | null
          call_id: number | null
          date: string | null
          end_time: number | null
          id: number | null
          metadata_context: Json | null
          next_turn_tag: string | null
          next_turn_tag_auto: string | null
          next_turn_verbatim: string | null
          score_auto: number | null
          speaker: string | null
          start_time: number | null
          tag: string | null
          verbatim: string | null
        }
        Relationships: [
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_summary"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "turntagged_call_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_with_tagging_status"
            referencedColumns: ["callid"]
          },
          {
            foreignKeyName: "turntagged_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "lpltag"
            referencedColumns: ["label"]
          },
        ]
      }
      v_level1_best_algorithms: {
        Row: {
          algorithm_key: string | null
          algorithm_version: string | null
          metrics: Json | null
          rank: number | null
          variable: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bulk_import_domain_references: {
        Args: { p_references: Json[] }
        Returns: undefined
      }
      bulk_replace_domain_references: {
        Args: { p_references: Json[] }
        Returns: undefined
      }
      bulk_upsert_domain_references: {
        Args: { p_references: Json[] }
        Returns: undefined
      }
      calculate_turn_relations: {
        Args: { p_call_id?: number }
        Returns: {
          execution_time_ms: number
          total_turns: number
          updated_count: number
        }[]
      }
      get_calls_summary: {
        Args: {
          p_archived?: boolean
          p_identreprise?: number
          p_limit?: number
          p_offset?: number
          p_only_unassigned?: boolean
        }
        Returns: {
          activity_count: number | null
          archived: boolean | null
          callid: number | null
          description: string | null
          duration_sec: number | null
          duree: number | null
          filename: string | null
          has_transcript: boolean | null
          identreprise: number | null
          is_tagging_call: boolean | null
          origine: string | null
          postit_count: number | null
          preparedfortranscript: boolean | null
          status: string | null
          tag_count: number | null
          upload: boolean | null
          word_count: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "call_summary"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_jwt_claims: {
        Args: never
        Returns: {
          jwt_email: string
          jwt_role: string
        }[]
      }
      get_tag_families: {
        Args: never
        Returns: {
          count: number
          family: string
        }[]
      }
      get_tag_usage_data: {
        Args: never
        Returns: {
          call_description: string
          call_filename: string
          call_origine: string
          tag_color: string
          tag_family: string
          tag_label: string
        }[]
      }
      get_temporal_analysis: {
        Args: { selected_origin?: string }
        Returns: {
          call_duration: number
          call_id: number
          color: string
          end_time: number
          family: string
          id: number
          origine: string
          relative_position: number
          speaker: string
          start_time: number
          tag: string
          verbatim: string
        }[]
      }
      get_turntagged_with_context: {
        Args: { _call_id?: number; _limit?: number; _offset?: number }
        Returns: {
          annotations: Json | null
          call_id: number | null
          date: string | null
          end_time: number | null
          id: number | null
          metadata_context: Json | null
          next_turn_tag: string | null
          next_turn_tag_auto: string | null
          next_turn_verbatim: string | null
          score_auto: number | null
          speaker: string | null
          start_time: number | null
          tag: string | null
          verbatim: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "turntagged_with_context"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_tables: { Args: never; Returns: string[] }
      refresh_h2_analysis_pairs_v2: {
        Args: { p_call_ids?: string[]; p_incremental?: boolean }
        Returns: {
          deleted: number
          execution_time_ms: number
          inserted: number
          total_pairs: number
          updated: number
        }[]
      }
      update_domain_reference: {
        Args: {
          p_company: string
          p_domain: string
          p_id: number
          p_modele: string
          p_variants: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
