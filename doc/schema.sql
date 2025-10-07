-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activitesconseillers (
  idactivite integer NOT NULL DEFAULT nextval('activitesconseillers_idactivite_seq'::regclass),
  idconseiller integer NOT NULL,
  idsujet integer,
  idpratique integer,
  idexercice integer,
  dateactivite timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duree integer,
  customnudges_ids ARRAY,
  statut text,
  commentaires text,
  objectifs text,
  nature text,
  sidebar_phase character varying CHECK ((sidebar_phase::text = ANY (ARRAY['selection'::character varying, 'evaluation'::character varying, 'coaching'::character varying, 'suivi'::character varying, 'feedback'::character varying, 'admin'::character varying]::text[])) OR sidebar_phase IS NULL),
  sidebar_statut character varying DEFAULT 'à faire'::character varying CHECK (sidebar_statut::text = ANY (ARRAY['à faire'::character varying, 'en cours'::character varying, 'réalisé'::character varying]::text[])),
  sidebar_objectifs text,
  sidebar_commentaires text,
  sidebar_date_modif timestamp with time zone DEFAULT now(),
  CONSTRAINT activitesconseillers_pkey PRIMARY KEY (idactivite),
  CONSTRAINT activitesconseillers_idconseiller_fkey FOREIGN KEY (idconseiller) REFERENCES public.conseillers(idconseiller),
  CONSTRAINT activitesconseillers_idexercice_fkey FOREIGN KEY (idexercice) REFERENCES public.exercices(idexercice),
  CONSTRAINT activitesconseillers_idpratique_fkey FOREIGN KEY (idpratique) REFERENCES public.pratiques(idpratique),
  CONSTRAINT activitesconseillers_idsujet_fkey FOREIGN KEY (idsujet) REFERENCES public.sujets(idsujet)
);
CREATE TABLE public.activitesconseillers_pratiques (
  idactivitepratique integer NOT NULL DEFAULT nextval('activitesconseillers_pratiques_idactivitepratique_seq'::regclass),
  idactivite integer NOT NULL,
  idpratique integer NOT NULL,
  travaille boolean NOT NULL DEFAULT true,
  CONSTRAINT activitesconseillers_pratiques_pkey PRIMARY KEY (idactivitepratique),
  CONSTRAINT activitesconseillers_pratiques_idactivite_fkey FOREIGN KEY (idactivite) REFERENCES public.activitesconseillers(idactivite),
  CONSTRAINT activitesconseillers_pratiques_idpratique_fkey FOREIGN KEY (idpratique) REFERENCES public.pratiques(idpratique)
);
CREATE TABLE public.activitesconseillers_sujets (
  idactivitesujet integer NOT NULL DEFAULT nextval('activitesconseillers_sujets_idactivitesujet_seq'::regclass),
  idactivite integer NOT NULL,
  idsujet integer NOT NULL,
  travaille boolean NOT NULL DEFAULT true,
  note_conformite text,
  CONSTRAINT activitesconseillers_sujets_pkey PRIMARY KEY (idactivitesujet),
  CONSTRAINT activitesconseillers_sujets_idactivite_fkey FOREIGN KEY (idactivite) REFERENCES public.activitesconseillers(idactivite),
  CONSTRAINT activitesconseillers_sujets_idsujet_fkey FOREIGN KEY (idsujet) REFERENCES public.sujets(idsujet)
);
CREATE TABLE public.algorithm_version_registry (
  version_id character varying NOT NULL,
  version_name character varying,
  created_at timestamp without time zone DEFAULT now(),
  is_active boolean DEFAULT false,
  deprecated boolean DEFAULT false,
  m1_key character varying,
  m1_version character varying,
  m1_config jsonb,
  m2_key character varying,
  m2_version character varying,
  m2_config jsonb,
  m3_key character varying,
  m3_version character varying,
  m3_config jsonb,
  level1_metrics jsonb,
  description text,
  changelog text,
  CONSTRAINT algorithm_version_registry_pkey PRIMARY KEY (version_id)
);
CREATE TABLE public.avatars (
  idavatar integer NOT NULL DEFAULT nextval('avatars_idavatar_seq'::regclass),
  nom text NOT NULL,
  url text NOT NULL,
  categorie text,
  anonyme boolean NOT NULL DEFAULT false,
  filename text,
  CONSTRAINT avatars_pkey PRIMARY KEY (idavatar)
);
CREATE TABLE public.avisexercicesnudges (
  idavis integer NOT NULL DEFAULT nextval('avisexercices_idavis_seq'::regclass),
  avis text,
  idpratique integer,
  userlike integer DEFAULT 4,
  idexercice integer,
  idnudge integer,
  typeavis text,
  idactivite integer,
  nudgeindex integer,
  CONSTRAINT avisexercicesnudges_pkey PRIMARY KEY (idavis),
  CONSTRAINT avisexercices_idpratique_fkey FOREIGN KEY (idpratique) REFERENCES public.pratiques(idpratique),
  CONSTRAINT fk_activiteconseiller FOREIGN KEY (idactivite) REFERENCES public.activitesconseillers(idactivite),
  CONSTRAINT public_avisexercices_idexercice_fkey FOREIGN KEY (idexercice) REFERENCES public.exercices(idexercice),
  CONSTRAINT public_avisexercicesnudges_idnudge_fkey FOREIGN KEY (idnudge) REFERENCES public.nudge(id)
);
CREATE TABLE public.call (
  callid integer NOT NULL DEFAULT nextval('call_callid_seq'::regclass),
  audiourl text,
  filename text,
  filepath text,
  transcription jsonb,
  description text,
  upload boolean DEFAULT false,
  archived boolean,
  is_tagging_call boolean DEFAULT false,
  origine text,
  preparedfortranscript boolean DEFAULT false,
  status character varying DEFAULT 'non_supervisé'::character varying,
  duree numeric,
  CONSTRAINT call_pkey PRIMARY KEY (callid)
);
CREATE TABLE public.callactivityrelation (
  callid integer,
  activityid integer,
  CONSTRAINT callactivityrelation_activityid_fkey FOREIGN KEY (activityid) REFERENCES public.activitesconseillers(idactivite),
  CONSTRAINT callactivityrelation_callid_fkey FOREIGN KEY (callid) REFERENCES public.call(callid)
);
CREATE TABLE public.categoriespratiques (
  idcategoriepratique integer NOT NULL DEFAULT nextval('categoriespratiques_idcategoriepratique_seq'::regclass),
  nomcategorie character varying NOT NULL,
  couleur character varying NOT NULL,
  CONSTRAINT categoriespratiques_pkey PRIMARY KEY (idcategoriepratique)
);
CREATE TABLE public.categoriessujets (
  idcategoriesujet integer NOT NULL DEFAULT nextval('categoriessujets_idcategoriesujet_seq'::regclass),
  nomcategorie character varying NOT NULL,
  couleur character varying NOT NULL,
  description text,
  CONSTRAINT categoriessujets_pkey PRIMARY KEY (idcategoriesujet)
);
CREATE TABLE public.conseillers (
  idconseiller integer NOT NULL DEFAULT nextval('conseillers_idconseiller_seq'::regclass),
  nom character varying NOT NULL,
  prenom character varying NOT NULL,
  email character varying UNIQUE,
  entreprise integer,
  pseudo text,
  idavatar integer,
  estanonyme boolean DEFAULT false,
  CONSTRAINT conseillers_pkey PRIMARY KEY (idconseiller),
  CONSTRAINT fk_conseillers_avatars FOREIGN KEY (idavatar) REFERENCES public.avatars(idavatar),
  CONSTRAINT public_conseillers_entreprise_fkey FOREIGN KEY (entreprise) REFERENCES public.entreprises(identreprise)
);
CREATE TABLE public.custom_nudges (
  id integer NOT NULL DEFAULT nextval('custom_nudges_id_seq'::regclass),
  id_activite bigint UNIQUE,
  custom_nudge1 text,
  custom_nudge2 text,
  custom_nudge3 text,
  custom_nudge4 text,
  custom_nudge5 text,
  custom_nudge6 text,
  custom_nudge1_date date,
  custom_nudge2_date date,
  custom_nudge3_date date,
  custom_nudge4_date date,
  custom_nudge5_date date,
  custom_nudge6_date date,
  id_pratique bigint,
  CONSTRAINT custom_nudges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customnudges (
  idcustomnudge integer NOT NULL DEFAULT nextval('customnudges_idcustomnudge_seq'::regclass),
  idactivite integer NOT NULL,
  idnudgeoriginal integer NOT NULL,
  modifications jsonb NOT NULL,
  CONSTRAINT customnudges_pkey PRIMARY KEY (idcustomnudge),
  CONSTRAINT fk_activite FOREIGN KEY (idactivite) REFERENCES public.activitesconseillers(idactivite),
  CONSTRAINT public_customnudges_idnudgeoriginal_fkey FOREIGN KEY (idnudgeoriginal) REFERENCES public.nudge(id)
);
CREATE TABLE public.deroule_coaching (
  id integer NOT NULL DEFAULT nextval('deroule_coaching_id_seq'::regclass),
  ouverture_titre text,
  ouverture_contenu text,
  ecoute_appel_titre text,
  ecoute_appel_contenu text,
  global_titre text,
  global_contenu text,
  atout_titre text,
  atout_contenu text,
  levier_titre text,
  levier_contenu text,
  jeuderole_titre text,
  jeuderole_contenu text,
  entrainement_titre text,
  entrainement_contenu text,
  CONSTRAINT deroule_coaching_pkey PRIMARY KEY (id)
);
CREATE TABLE public.domaines (
  iddomaine integer NOT NULL DEFAULT nextval('domaines_iddomaine_seq'::regclass),
  nomdomaine text NOT NULL,
  description text,
  CONSTRAINT domaines_pkey PRIMARY KEY (iddomaine)
);
CREATE TABLE public.entreprise_call (
  identreprise integer NOT NULL,
  callid integer NOT NULL,
  CONSTRAINT entreprise_call_pkey PRIMARY KEY (identreprise, callid),
  CONSTRAINT entreprise_call_callid_fkey FOREIGN KEY (callid) REFERENCES public.call(callid),
  CONSTRAINT entreprise_call_identreprise_fkey FOREIGN KEY (identreprise) REFERENCES public.entreprises(identreprise)
);
CREATE TABLE public.entreprise_domaines (
  identreprise bigint NOT NULL,
  iddomaine integer NOT NULL,
  CONSTRAINT entreprise_domaines_pkey PRIMARY KEY (identreprise, iddomaine),
  CONSTRAINT entreprise_domaines_iddomaine_fkey FOREIGN KEY (iddomaine) REFERENCES public.domaines(iddomaine),
  CONSTRAINT entreprise_domaines_identreprise_fkey FOREIGN KEY (identreprise) REFERENCES public.entreprises(identreprise)
);
CREATE TABLE public.entreprise_pratiques (
  id integer NOT NULL DEFAULT nextval('entreprise_pratiques_id_seq'::regclass),
  identreprise bigint NOT NULL,
  idpratique integer NOT NULL,
  fiche_conseiller_json jsonb,
  fiche_coach_json jsonb,
  CONSTRAINT entreprise_pratiques_pkey PRIMARY KEY (id),
  CONSTRAINT entreprise_pratiques_identreprise_fkey FOREIGN KEY (identreprise) REFERENCES public.entreprises(identreprise),
  CONSTRAINT entreprise_pratiques_idpratique_fkey FOREIGN KEY (idpratique) REFERENCES public.pratiques(idpratique)
);
CREATE TABLE public.entreprises (
  identreprise bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  nomentreprise text,
  logo text,
  domaine text,
  CONSTRAINT entreprises_pkey PRIMARY KEY (identreprise)
);
CREATE TABLE public.exercices (
  idexercice integer NOT NULL DEFAULT nextval('exercices_idexercice_seq'::regclass),
  idpratique integer NOT NULL,
  nomexercice character varying NOT NULL,
  description text,
  nudges jsonb,
  CONSTRAINT exercices_pkey PRIMARY KEY (idexercice),
  CONSTRAINT exercices_idpratique_fkey FOREIGN KEY (idpratique) REFERENCES public.pratiques(idpratique)
);
CREATE TABLE public.exercices_nudges (
  idexercicenudge integer NOT NULL DEFAULT nextval('exercices_nudges_idexercicenudge_seq'::regclass),
  idexercice integer NOT NULL,
  idnudge integer NOT NULL,
  CONSTRAINT exercices_nudges_pkey PRIMARY KEY (idexercicenudge),
  CONSTRAINT exercices_nudges_idexercice_fkey FOREIGN KEY (idexercice) REFERENCES public.exercices(idexercice),
  CONSTRAINT exercices_nudges_idnudge_fkey FOREIGN KEY (idnudge) REFERENCES public.nudge(id)
);
CREATE TABLE public.h2_analysis_pairs (
  pair_id bigint NOT NULL,
  conseiller_turn_id integer,
  call_id integer,
  conseiller_start_time double precision,
  conseiller_end_time double precision,
  conseiller_speaker text,
  strategy_family text,
  strategy_tag text,
  conseiller_verbatim text,
  reaction_tag text,
  client_verbatim text,
  strategy_color text,
  strategy_originespeaker text,
  annotations jsonb,
  next_turn_tag_auto text,
  score_auto numeric,
  m1_verb_density numeric,
  m1_verb_count integer,
  m1_total_words integer,
  m1_action_verbs ARRAY,
  m2_lexical_alignment numeric,
  m2_semantic_alignment numeric,
  m2_global_alignment numeric,
  m2_shared_terms ARRAY,
  m3_hesitation_count integer,
  m3_clarification_count integer,
  m3_cognitive_score numeric,
  m3_cognitive_load text,
  m3_patterns jsonb,
  computed_at timestamp without time zone,
  computation_status text CHECK (computation_status = ANY (ARRAY['computed'::text, 'error'::text, 'pending'::text])),
  algorithm_version character varying,
  version_metadata jsonb,
  CONSTRAINT h2_analysis_pairs_pkey PRIMARY KEY (pair_id),
  CONSTRAINT fk_h2_algorithm_version FOREIGN KEY (algorithm_version) REFERENCES public.algorithm_version_registry(version_id)
);
CREATE TABLE public.h2_analysis_pairs_backup (
  pair_id bigint,
  conseiller_turn_id integer,
  call_id integer,
  conseiller_start_time double precision,
  conseiller_end_time double precision,
  conseiller_speaker text,
  strategy_family text,
  strategy_tag text,
  conseiller_verbatim text,
  reaction_tag text,
  client_verbatim text,
  strategy_color text,
  strategy_originespeaker text,
  annotations jsonb,
  next_turn_tag_auto text,
  score_auto numeric,
  m1_verb_density numeric,
  m1_verb_count integer,
  m1_total_words integer,
  m1_action_verbs ARRAY,
  m2_lexical_alignment numeric,
  m2_semantic_alignment numeric,
  m2_global_alignment numeric,
  m2_shared_terms ARRAY,
  m3_hesitation_count integer,
  m3_clarification_count integer,
  m3_cognitive_score numeric,
  m3_cognitive_load text,
  m3_patterns jsonb,
  computed_at timestamp without time zone,
  computation_status text
);
CREATE TABLE public.h2_mediation_results (
  id integer NOT NULL DEFAULT nextval('h2_mediation_results_id_seq'::regclass),
  version_id character varying,
  sample_size integer NOT NULL,
  total_effect numeric,
  direct_effect numeric,
  indirect_effect numeric,
  mediation_proportion numeric,
  p_value numeric,
  confidence_interval jsonb,
  fit_indices jsonb,
  conclusion text,
  analyzed_at timestamp without time zone DEFAULT now(),
  CONSTRAINT h2_mediation_results_pkey PRIMARY KEY (id),
  CONSTRAINT h2_mediation_results_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.algorithm_version_registry(version_id)
);
CREATE TABLE public.icon (
  iconid integer NOT NULL DEFAULT nextval('icon_iconid_seq'::regclass),
  wordid integer NOT NULL,
  type text,
  data jsonb,
  quizid integer,
  CONSTRAINT icon_pkey PRIMARY KEY (iconid),
  CONSTRAINT fk_word FOREIGN KEY (wordid) REFERENCES public.word(wordid)
);
CREATE TABLE public.level1_validation_results (
  id integer NOT NULL DEFAULT nextval('level1_validation_results_id_seq'::regclass),
  variable text NOT NULL CHECK (variable = ANY (ARRAY['X'::text, 'Y'::text, 'M1'::text, 'M2'::text, 'M3'::text])),
  algorithm_key text NOT NULL,
  algorithm_version text NOT NULL,
  sample_size integer NOT NULL,
  metrics jsonb NOT NULL,
  predictions jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT level1_validation_results_pkey PRIMARY KEY (id)
);
CREATE TABLE public.logs (
  id integer NOT NULL DEFAULT nextval('logs_id_seq'::regclass),
  timestamp timestamp with time zone DEFAULT now(),
  level text,
  message text,
  details jsonb,
  CONSTRAINT logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.lpltag (
  id integer NOT NULL DEFAULT nextval('lpltag_id_seq'::regclass),
  label text NOT NULL UNIQUE,
  description text,
  family text,
  color text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  icon text,
  originespeaker text CHECK (originespeaker = ANY (ARRAY['client'::text, 'conseiller'::text])),
  CONSTRAINT lpltag_pkey PRIMARY KEY (id)
);
CREATE TABLE public.motifs_afpa (
  id integer NOT NULL DEFAULT nextval('motifs_afpa_id_seq'::regclass),
  motifs text NOT NULL,
  avancement_formation boolean NOT NULL DEFAULT false,
  avancement_lieu boolean NOT NULL DEFAULT false,
  avancement_date boolean NOT NULL DEFAULT false,
  avancement_financement boolean NOT NULL DEFAULT false,
  promotion_reseau boolean NOT NULL DEFAULT false,
  commentaire text,
  action_client text,
  actif boolean NOT NULL DEFAULT true,
  callid integer UNIQUE,
  CONSTRAINT motifs_afpa_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nudge (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  nudge1 text,
  nudge2 text,
  nudge3 text,
  nudge4 text,
  nudge5 text,
  nudge6 text,
  CONSTRAINT nudge_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nudges (
  idnudge integer NOT NULL DEFAULT nextval('nudges_idnudge_seq'::regclass),
  idexercice integer NOT NULL,
  nomnudge character varying NOT NULL,
  description text,
  CONSTRAINT nudges_pkey PRIMARY KEY (idnudge),
  CONSTRAINT fk_exercice FOREIGN KEY (idexercice) REFERENCES public.exercices(idexercice)
);
CREATE TABLE public.ponderation_sujets (
  id_ponderation integer NOT NULL DEFAULT nextval('ponderation_sujets_id_ponderation_seq'::regclass),
  idsujet integer UNIQUE,
  conforme integer NOT NULL DEFAULT 10,
  partiellement_conforme integer NOT NULL DEFAULT 5,
  non_conforme integer NOT NULL DEFAULT 0,
  permet_partiellement_conforme boolean DEFAULT true,
  CONSTRAINT ponderation_sujets_pkey PRIMARY KEY (id_ponderation),
  CONSTRAINT ponderation_sujets_idsujet_fkey FOREIGN KEY (idsujet) REFERENCES public.sujets(idsujet)
);
CREATE TABLE public.postit (
  id integer NOT NULL DEFAULT nextval('postit_id_seq'::regclass),
  callid integer NOT NULL,
  wordid integer NOT NULL,
  word text NOT NULL,
  text text,
  timestamp double precision NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  sujet text,
  pratique text,
  iddomaine integer,
  idsujet integer,
  idpratique integer,
  CONSTRAINT postit_pkey PRIMARY KEY (id)
);
CREATE TABLE public.pratiques (
  idpratique integer NOT NULL DEFAULT nextval('pratiques_idpratique_seq'::regclass),
  nompratique character varying NOT NULL,
  description text,
  valeurnumérique integer DEFAULT 1,
  idcategoriepratique integer,
  fiche_conseiller_json jsonb,
  fiche_coach_json jsonb,
  jeuderole jsonb,
  geste text,
  CONSTRAINT pratiques_pkey PRIMARY KEY (idpratique),
  CONSTRAINT pratiques_idcategoriepratique_fkey FOREIGN KEY (idcategoriepratique) REFERENCES public.categoriespratiques(idcategoriepratique)
);
CREATE TABLE public.quiz (
  quizid integer NOT NULL DEFAULT nextval('quiz_quizid_seq'::regclass),
  callid integer,
  wordid integer,
  question text,
  possibleanswers ARRAY,
  correctanswerindexes ARRAY,
  answercomments ARRAY,
  timestamp timestamp without time zone,
  quizdata jsonb,
  CONSTRAINT quiz_pkey PRIMARY KEY (quizid),
  CONSTRAINT quiz_callid_fkey FOREIGN KEY (callid) REFERENCES public.call(callid),
  CONSTRAINT quiz_wordid_fkey FOREIGN KEY (wordid) REFERENCES public.word(wordid)
);
CREATE TABLE public.quiz_responses (
  responseid integer NOT NULL DEFAULT nextval('quiz_responses_responseid_seq'::regclass),
  quizid integer,
  conseillerid integer,
  answers ARRAY,
  submitted_at timestamp without time zone DEFAULT now(),
  CONSTRAINT quiz_responses_pkey PRIMARY KEY (responseid),
  CONSTRAINT quiz_responses_conseillerid_fkey FOREIGN KEY (conseillerid) REFERENCES public.conseillers(idconseiller),
  CONSTRAINT quiz_responses_quizid_fkey FOREIGN KEY (quizid) REFERENCES public.quiz(quizid)
);
CREATE TABLE public.roleplaydata (
  id integer NOT NULL DEFAULT nextval('roleplaydata_id_seq'::regclass),
  call_id integer NOT NULL,
  postit_id integer NOT NULL,
  note jsonb NOT NULL,
  type character varying DEFAULT 'standard'::character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roleplaydata_pkey PRIMARY KEY (id),
  CONSTRAINT fk_call FOREIGN KEY (call_id) REFERENCES public.call(callid),
  CONSTRAINT fk_postit FOREIGN KEY (postit_id) REFERENCES public.postit(id)
);
CREATE TABLE public.sujets (
  idsujet integer NOT NULL DEFAULT nextval('sujets_idsujet_seq'::regclass),
  iddomaine integer NOT NULL,
  nomsujet text NOT NULL,
  description text,
  valeurnumérique integer DEFAULT 1,
  idcategoriesujet integer,
  CONSTRAINT sujets_pkey PRIMARY KEY (idsujet),
  CONSTRAINT sujets_idcategoriesujet_fkey FOREIGN KEY (idcategoriesujet) REFERENCES public.categoriessujets(idcategoriesujet),
  CONSTRAINT sujets_iddomaine_fkey FOREIGN KEY (iddomaine) REFERENCES public.domaines(iddomaine)
);
CREATE TABLE public.sujetspratiques (
  idsujet integer NOT NULL,
  idpratique integer NOT NULL,
  importance integer,
  CONSTRAINT sujetspratiques_pkey PRIMARY KEY (idsujet, idpratique),
  CONSTRAINT sujetspratiques_idpratique_fkey FOREIGN KEY (idpratique) REFERENCES public.pratiques(idpratique),
  CONSTRAINT sujetspratiques_idsujet_fkey FOREIGN KEY (idsujet) REFERENCES public.sujets(idsujet)
);
CREATE TABLE public.tag (
  tagid integer NOT NULL DEFAULT nextval('tag_tagid_seq'::regclass),
  name text NOT NULL,
  description text,
  CONSTRAINT tag_pkey PRIMARY KEY (tagid)
);
CREATE TABLE public.tag_history (
  id integer NOT NULL DEFAULT nextval('tag_history_id_seq'::regclass),
  old_label text NOT NULL,
  new_label text NOT NULL,
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT tag_history_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tag_modifications (
  id integer NOT NULL DEFAULT nextval('tag_modifications_id_seq'::regclass),
  action character varying,
  old_tag character varying,
  new_tag character varying,
  modified_by character varying,
  modified_at timestamp without time zone DEFAULT now(),
  previous_data jsonb,
  CONSTRAINT tag_modifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transcript (
  transcriptid integer NOT NULL DEFAULT nextval('transcript_transcriptid_seq'::regclass),
  callid integer,
  CONSTRAINT transcript_pkey PRIMARY KEY (transcriptid),
  CONSTRAINT fk_transcript_call FOREIGN KEY (callid) REFERENCES public.call(callid)
);
CREATE TABLE public.turntagged (
  id integer NOT NULL DEFAULT nextval('tags_id_seq'::regclass),
  call_id integer NOT NULL,
  start_time double precision NOT NULL,
  end_time double precision NOT NULL,
  tag text NOT NULL,
  verbatim text NOT NULL,
  date timestamp without time zone NOT NULL DEFAULT now(),
  next_turn_tag text,
  next_turn_verbatim text,
  speaker text,
  next_turn_tag_auto text,
  score_auto numeric,
  annotations jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT turntagged_pkey PRIMARY KEY (id),
  CONSTRAINT turntagged_call_fkey FOREIGN KEY (call_id) REFERENCES public.call(callid),
  CONSTRAINT turntagged_tag_fkey FOREIGN KEY (tag) REFERENCES public.lpltag(label)
);
CREATE TABLE public.user_enterprises (
  id integer NOT NULL DEFAULT nextval('user_enterprises_id_seq'::regclass),
  user_id integer,
  entreprise_id integer,
  CONSTRAINT user_enterprises_pkey PRIMARY KEY (id),
  CONSTRAINT user_enterprises_entreprise_id_fkey FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(identreprise),
  CONSTRAINT user_enterprises_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_roles (
  id integer NOT NULL DEFAULT nextval('user_roles_id_seq'::regclass),
  user_id integer,
  role character varying NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_sessions (
  id integer NOT NULL DEFAULT nextval('user_sessions_id_seq1'::regclass),
  user_id text NOT NULL,
  event_type text NOT NULL,
  event_timestamp timestamp without time zone DEFAULT now(),
  sign_out_at timestamp without time zone,
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_sessions_backup (
  id integer NOT NULL DEFAULT nextval('user_sessions_id_seq'::regclass),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_timestamp timestamp with time zone DEFAULT now(),
  session_id uuid DEFAULT uuid_generate_v4(),
  sign_in_at timestamp with time zone,
  sign_out_at timestamp with time zone,
  CONSTRAINT user_sessions_backup_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  entreprise_id bigint,
  created_at timestamp without time zone DEFAULT now(),
  refresh_token text,
  zoho_refresh_token text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_entreprise_id_fkey FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(identreprise)
);
CREATE TABLE public.word (
  wordid integer NOT NULL DEFAULT nextval('word_wordid_seq'::regclass),
  transcriptid integer,
  startTime double precision,
  endTime double precision,
  text text,
  turn text,
  type text,
  CONSTRAINT word_pkey PRIMARY KEY (wordid),
  CONSTRAINT fk_word_transcript FOREIGN KEY (transcriptid) REFERENCES public.transcript(transcriptid)
);
CREATE TABLE public.word_tag (
  wordid integer NOT NULL,
  tagid integer NOT NULL,
  confidence double precision,
  CONSTRAINT word_tag_pkey PRIMARY KEY (wordid, tagid),
  CONSTRAINT word_tag_tagid_fkey FOREIGN KEY (tagid) REFERENCES public.tag(tagid),
  CONSTRAINT word_tag_wordid_fkey FOREIGN KEY (wordid) REFERENCES public.word(wordid)
);
