import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@hanchi/dish_tries";
const SEED_KEY = "@hanchi/dish_tries_seeded_v1";

export type StoredDishTry = {
  id: string;
  dishId: string;
  dishName: string;
  restaurantId?: string | null;
  restaurantName?: string | null;
  communityId?: string | null;
  communityName?: string | null;
  placeCountryCode?: string | null;
  note?: string;
  createdAt: string;
};

/** Local sample tries so Moments shows dish activity before backend exists. */
const SEED_TRIES: StoredDishTry[] = [
  {
    id: "seed-try-doubles",
    dishId: "seed-d-doubles",
    dishName: "Doubles",
    restaurantId: null,
    restaurantName: "Singh's Roti Shop",
    communityId: "little-guyana-queens",
    communityName: "Little Guyana in Queens",
    placeCountryCode: "gy",
    note: "Pepper sauce still winning.",
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
  },
  {
    id: "seed-try-xlb",
    dishId: "seed-d-xlb",
    dishName: "Soup dumplings",
    restaurantId: null,
    restaurantName: "Nan Xiang Xiao Long Bao",
    communityId: "chinatown-flushing",
    communityName: "Chinatown in Flushing",
    placeCountryCode: "cn",
    note: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
  },
];

async function writeAll(list: StoredDishTry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function listDishTries(): Promise<StoredDishTry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredDishTry[];
      return Array.isArray(parsed) ? parsed : [];
    }
    const seeded = await AsyncStorage.getItem(SEED_KEY);
    if (!seeded) {
      await writeAll(SEED_TRIES);
      await AsyncStorage.setItem(SEED_KEY, "1");
      return SEED_TRIES;
    }
    return [];
  } catch {
    return [];
  }
}

export async function isDishTried(dishId: string): Promise<boolean> {
  const list = await listDishTries();
  return list.some((t) => t.dishId === dishId);
}

export type RecordDishTryInput = {
  dishId: string;
  dishName: string;
  restaurantId?: string | null;
  restaurantName?: string | null;
  communityId?: string | null;
  communityName?: string | null;
  placeCountryCode?: string | null;
  note?: string;
};

/** Marks a dish as tried (or updates metadata). No-op if already present. */
export async function recordDishTry(
  input: RecordDishTryInput,
): Promise<StoredDishTry> {
  const list = await listDishTries();
  const existing = list.find((t) => t.dishId === input.dishId);
  if (existing) return existing;

  const entry: StoredDishTry = {
    id: `try-${input.dishId}-${Date.now()}`,
    dishId: input.dishId,
    dishName: input.dishName,
    restaurantId: input.restaurantId ?? null,
    restaurantName: input.restaurantName ?? null,
    communityId: input.communityId ?? null,
    communityName: input.communityName ?? null,
    placeCountryCode: input.placeCountryCode ?? null,
    note: input.note?.trim() ?? "",
    createdAt: new Date().toISOString(),
  };
  await writeAll([entry, ...list]);
  return entry;
}

export async function removeDishTry(dishId: string): Promise<void> {
  const list = await listDishTries();
  await writeAll(list.filter((t) => t.dishId !== dishId));
}

export async function toggleDishTry(
  input: RecordDishTryInput,
): Promise<{ tried: boolean; entry: StoredDishTry | null }> {
  const list = await listDishTries();
  const existing = list.find((t) => t.dishId === input.dishId);
  if (existing) {
    await writeAll(list.filter((t) => t.dishId !== input.dishId));
    return { tried: false, entry: null };
  }
  const entry = await recordDishTry(input);
  return { tried: true, entry };
}
