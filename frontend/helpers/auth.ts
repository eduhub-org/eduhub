export const postLogout = async (url: string | null) => {
  try {
    if (!url) {
      throw new Error("No url provided!");
    }
    const response = await fetch(`${url}`, { mode: "no-cors" });
    console.log(response);
  } catch (error) {
    console.error(error);
  }
};
