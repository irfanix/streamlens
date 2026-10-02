/** Human-friendly names for every label the AI or a reviewer can use. */
export const LABEL_NAMES: Record<string, string> = {
  trash: "Trash or debris",
  foam: "Foam",
  algae_mat: "Algae mat",
  outfall_pipe: "Outfall pipe",
  oil_sheen: "Oil sheen",
  algal_bloom: "Algal bloom",
  stagnant: "Stagnant water",
  turbid: "Murky water",
  polluted_debris: "Polluted water",
  clear: "Clear water"
};

export const LABEL_OPTIONS = Object.keys(LABEL_NAMES);

export const labelName = (key: string) => LABEL_NAMES[key] ?? key.replace(/_/g, " ");
