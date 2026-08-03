import AsyncStorage from "@react-native-async-storage/async-storage";

const BIO_KEY = "@hanchi/profile_bio";
const SHOW_LOCATION_KEY = "@hanchi/profile_show_location";

export async function getProfileBio(): Promise<string> {
  try {
    return (await AsyncStorage.getItem(BIO_KEY)) ?? "";
  } catch {
    return "";
  }
}

export async function setProfileBio(bio: string): Promise<void> {
  const trimmed = bio.trim();
  if (!trimmed) {
    await AsyncStorage.removeItem(BIO_KEY);
    return;
  }
  await AsyncStorage.setItem(BIO_KEY, trimmed.slice(0, 280));
}

/** Whether the profile header should show the user's map location. Default true. */
export async function getShowLocationOnProfile(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(SHOW_LOCATION_KEY);
    if (value === null) return true;
    return value === "1";
  } catch {
    return true;
  }
}

export async function setShowLocationOnProfile(show: boolean): Promise<void> {
  await AsyncStorage.setItem(SHOW_LOCATION_KEY, show ? "1" : "0");
}
