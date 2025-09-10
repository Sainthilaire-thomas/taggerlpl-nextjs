je voudrais normaliser les traitements entre les algorithmes des données X, Y, M1, M2, M3, j'ai deja centralisé les types et les intefaces, mais je m'aperçois qu'il y a encore des traitements différenciés dans le chargement des données pour les algo X, Y M1 ,M2

les données a analyser sont issus de la table turntagged

### Database Tables

### turntagged

[](https://supabase.com/dashboard/project/jregkxiwrnquslbocicz/database/tables)[ ]

New column

| Name               | Description    | Data Type                     | Format      | Nullable |     |
| ------------------ | -------------- | ----------------------------- | ----------- | -------- | --- |
| id                 | No description | `integer`                     | `int4`      |          |     |
| call_id            | No description | `integer`                     | `int4`      |          |     |
| start_time         | No description | `double precision`            | `float8`    |          |     |
| end_time           | No description | `double precision`            | `float8`    |          |     |
| tag                | No description | `text`                        | `text`      |          |     |
| verbatim           | No description | `text`                        | `text`      |          |     |
| date               | No description | `timestamp without time zone` | `timestamp` |          |     |
| next_turn_tag      | No description | `text`                        | `text`      |          |     |
| next_turn_verbatim | No description | `text`                        | `text`      |          |     |
| speaker            | No description | `text`                        | `text`      |          |     |
| next_turn_tag_auto | No description | `text`                        | `text`      |          |     |
| score_auto         | No description | `numeric`                     | `numeric`   |          |     |
| annotations        | No description | `jsonb`                       | `jsonb`     |          |     |

le corpus a analyser est toujours le meme: les tour de parole conseiller suiv par un tour de parole client

on défini un tour de parole conseiller si son tag appartient à l'une des familles REFLET, OUVERTURE, EXPLICATION, ENGAGEMENT

les familles sont définies dans la table lpltag

### Database Tables

### lpltag

[](https://supabase.com/dashboard/project/jregkxiwrnquslbocicz/database/tables)[ ]

New column

| Name           | Description                                           | Data Type                     | Format      | Nullable |     |
| -------------- | ----------------------------------------------------- | ----------------------------- | ----------- | -------- | --- |
| id             | No description                                        | `integer`                     | `int4`      |          |     |
| label          | No description                                        | `text`                        | `text`      |          |     |
| description    | No description                                        | `text`                        | `text`      |          |     |
| family         | No description                                        | `text`                        | `text`      |          |     |
| color          | No description                                        | `text`                        | `text`      |          |     |
| created_at     | No description                                        | `timestamp without time zone` | `timestamp` |          |     |
| icon           | No description                                        | `text`                        | `text`      |          |     |
| originespeaker | Indique si le tag provient du client ou du conseiller | `text`                        | `text`      |          |     |

on défini un tour de parole client si son tag appartient à CLIENT POSITIF, CLIENT NEGATIF, CLIENT NEUTRE ou les orthographes equivalentes

dans turntagged, le next turn est créé/mis a jour par la fonction

constcalculateAllNextTurnTags=useCallback(

    async (callId:string):Promise`<number>` => {

    if (!supabase) {

    console.warn("Supabase not available");

    return0;

    }

    try {

    console.log("=== CALCUL NEXT_TURN_TAG SIMPLIFIÉ ===");

    console.log("Call ID:", callId);

    // 1. Récupérer les tags valides de lpltag

    const { data: validTags, error: validTagsError } =awaitsupabase

    .from("lpltag")

    .select("label")

    .not("label", "is", null);

    if (validTagsError) {

    console.error("Erreur récupération tags valides:", validTagsError);

    return0;

    }

    constvalidTagLabels=newSet(

    validTags?.map((tag) =>tag.label) || []

    );

    console.log(`📋 ${validTagLabels.size} tags valides dans lpltag`);

    // 2. Récupérer TOUS les tags triés par temps (ordre chronologique strict)

    const { data: allTags, error: tagsError } =awaitsupabase

    .from("turntagged")

    .select("id, start_time, end_time, tag, speaker, next_turn_tag")

    .eq("call_id", callId)

    .order("start_time", { ascending:true })

    .order("id", { ascending:true }); // Tri secondaire pour stabilité

    if (tagsError) {

    console.error("Erreur récupération tags:", tagsError);

    return0;

    }

    if (!allTags||allTags.length===0) {

    console.log("Aucun tag trouvé pour cet appel");

    return0;

    }

    console.log(`Traitement de ${allTags.length} tags`);

    letupdatedCount=0;

    letrejectedCount=0;

    // 3. ✅ LOGIQUE SIMPLE : pour chaque tag, trouver le prochain tag d'un speaker différent

    for (leti=0; i<allTags.length; i++) {

    constcurrentTag=allTags[i];

    console.log(

    `\n🔍 Tag${i + 1}/${allTags.length}: ${currentTag.id} (${

    currentTag.start_time

    }s) -${currentTag.tag} [${currentTag.speaker}]`

    );

    // Chercher le PROCHAIN tag d'un speaker différent

    letnextTurnTag=null;

    letnextTagFound=null;

    for (letj=i+1; j<allTags.length; j++) {

    constcandidateTag=allTags[j];

    // ✅ CONDITION SIMPLE : speaker différent

    if (candidateTag.speaker!==currentTag.speaker) {

    console.log(

    `   → Candidat trouvé: ${candidateTag.id} (${candidateTag.start_time}s) - ${candidateTag.tag} [${candidateTag.speaker}]`

    );

    // Valider que le tag existe dans lpltag

    if (validTagLabels.has(candidateTag.tag)) {

    nextTurnTag=candidateTag.tag;

    nextTagFound=candidateTag;

    console.log(`   ✅ Next turn validé: "${nextTurnTag}"`);

    break; // Prendre le PREMIER trouvé (le plus proche chronologiquement)

    } else {

    console.log(

    `   🚫 Tag "${candidateTag.tag}" rejeté (pas dans lpltag)`

    );

    rejectedCount++;

    }

    }

    }

    if (!nextTagFound) {

    console.log(

    `   ❌ Aucun next turn trouvé (fin de conversation ou même speaker)`

    );

    }

    // 4. Mettre à jour SEULEMENT si différent de l'existant

    if (currentTag.next_turn_tag!==nextTurnTag) {

    console.log(

    `   🔄 Mise à jour: "${currentTag.next_turn_tag}" → "${nextTurnTag}"`

    );

    const { error: updateError } =awaitsupabase

    .from("turntagged")

    .update({ next_turn_tag:nextTurnTag })

    .eq("id", currentTag.id);

    if (updateError) {

    console.error(

    `   ❌ Erreur mise à jour tag ${currentTag.id}:`,

    updateError

    );

    } else {

    console.log(`   ✅ Tag ${currentTag.id} mis à jour avec succès`);

    updatedCount++;

    }

    } else {

    console.log(`   ⏸️ Pas de changement nécessaire`);

    }

    }

    console.log(`\n=== RÉSULTATS FINAUX ===`);

    console.log(`✅ ${updatedCount} tags mis à jour`);

    console.log(`🚫 ${rejectedCount} tags rejetés (invalides)`);

    console.log(`⏸️ ${allTags.length - updatedCount} tags inchangés`);

    // 5. Rafraîchir l'état local si des changements

    if (updatedCount>0) {

    console.log("🔄 Rafraîchissement de l'état local...");

    awaitfetchTaggedTurns(callId);

    }

    returnupdatedCount;

    } catch (err) {

    console.error("❌ Erreur dans calculateAllNextTurnTags:", err);

    return0;

    }

    },

    [supabase, fetchTaggedTurns]

); dans TggingDataContext. Quand on utilise AlgorithmLab le corpus est dans Turntagged et il faut extraire toujours le meme corpus défini précédemment, certains algo vont partir du tour conseiller comme X, M1 , M2 et certains vont partir du tour clientcomme Y et M3 comme on le verra plus tard. ValidateAlgorithm dans useLevel1Testin va orienter vers le bon algo mais on part toujours du meme corpus filtré de turntagged, cette partie semble mal mutualisée entre les algo

Je voudrais donc faire un audit de la situation, dis moi si tu as besoin de code
