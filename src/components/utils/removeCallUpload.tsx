import supabase from "@/lib/supabaseClient"; // Importez votre client Supabase ici

interface RemoveCallResult {
  success: boolean;
}

/**
 * Removes a call upload including its audio file and related transcript data
 * @param callid - The ID of the call to remove
 * @param filepath - The storage filepath of the audio file (can be null/undefined)
 * @returns Promise<RemoveCallResult> - Object indicating success
 * @throws Error if any step of the removal process fails
 */
export const removeCallUpload = async (
  callid: string,
  filepath?: string | null
): Promise<RemoveCallResult> => {
  try {
    // Step 1: Remove the audio file from storage if the filepath exists
    if (filepath) {
      const { error: removeError } = await supabase.storage
        .from("Calls")
        .remove([filepath]);

      if (removeError) {
        console.error("Error removing file from storage:", removeError);
        // Continue with the process even if file removal fails
      }
    }

    // Step 2: Fetch transcript IDs associated with the call
    const { data: transcripts, error: transcriptError } = await supabase
      .from("transcript")
      .select("transcriptid")
      .eq("callid", callid);

    if (transcriptError) {
      console.error(
        "Error fetching transcript IDs associated with the call:",
        transcriptError
      );
      throw new Error("Error fetching transcript IDs");
    }

    const transcriptIds = transcripts?.map((t) => t.transcriptid) || [];

    // Step 3: Remove words associated with the transcripts
    if (transcriptIds.length > 0) {
      const { error: wordDeleteError } = await supabase
        .from("word")
        .delete()
        .in("transcriptid", transcriptIds);

      if (wordDeleteError) {
        console.error("Error deleting word entries:", wordDeleteError);
        throw new Error("Error deleting words");
      }
    }

    // Step 4: Remove the transcript entries
    if (transcriptIds.length > 0) {
      const { error: transcriptDeleteError } = await supabase
        .from("transcript")
        .delete()
        .in("transcriptid", transcriptIds);

      if (transcriptDeleteError) {
        console.error(
          "Error deleting transcript entries:",
          transcriptDeleteError
        );
        throw new Error("Error deleting transcripts");
      }
    }

    // Step 5: Update the call entry to remove upload-related fields
    const { error: updateError } = await supabase
      .from("call")
      .update({
        audiourl: null,
        filepath: null,
        upload: false,
        preparedfortranscript: false,
      })
      .eq("callid", callid);

    if (updateError) {
      console.error("Error updating call fields in the database:", updateError);
      throw new Error("Error updating call");
    }

    return { success: true };
  } catch (error) {
    console.error("Error in removeCallUpload:", error);
    throw error;
  }
};
