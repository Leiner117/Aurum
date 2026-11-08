import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Writes a text file to the app cache and opens the Android share sheet
export const shareTextFile = async (filename: string, content: string, title: string): Promise<void> => {
  const { uri } = await Filesystem.writeFile({
    path: filename,
    data: content,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });

  try {
    await Share.share({ title, files: [uri] });
  } catch (err) {
    // Closing the share sheet rejects; that's not an error for the user
    if (err instanceof Error && /cancel/i.test(err.message)) return;
    throw err;
  }
};
