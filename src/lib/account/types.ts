// The rows of the database, as the site reads and writes them.
// supabase/migrations is the truth; docs/data-model.md explains it.

export type Units = 'mi' | 'km';

export type Profile = {
	user_id: string;
	handle: string | null;
	display_name: string | null;
	is_public: boolean;
	/** the last twelve weeks day by day, and since when */
	show_days: boolean;
	/** steps: with time and distance they give away roughly how tall a person is */
	show_steps: boolean;
	/** the last 20 walks, one by one */
	show_walks: boolean;
	units: Units;
	/** "I am 18 or older": when. Stamped by the database, not taken back. */
	adult_confirmed_at: string | null;
	/** "Keep my body numbers and my food diary": when. Null = not agreed; set to null to take it back (that deletes them). */
	body_food_consent_at: string | null;
	created_at: string;
	updated_at: string;
};

export type Body = {
	user_id: string;
	weight_kg: number | null;
	height_cm: number | null;
	birth_year: number | null;
	sex: 'male' | 'female' | null;
	updated_at: string;
};

export type WalkOrigin = 'walka' | 'android' | 'web' | 'file';

export type Walk = {
	id: string;
	user_id: string;
	origin: WalkOrigin;
	client_id: string;
	started_at: string;
	ended_at: string;
	/** "2026-11-19": the day it counts for, where the walker was */
	local_day: string;
	/** minutes the device's clock was ahead of UTC at the start, if known */
	utc_offset_min: number | null;
	/** time the belt was moving */
	seconds: number;
	distance_m: number;
	steps: number;
	kcal: number;
	/** of which on top of sitting; null = not known */
	kcal_extra: number | null;
	/** with a walking session in the game, started by hand, or with no session: Walka's own three words */
	session: 'wow' | 'manual' | 'free' | null;
	steps_source: 'treadmill' | 'estimate' | null;
	distance_source: 'treadmill' | 'speed' | null;
	calories_source: 'speed' | 'heart_rate' | null;
	/** which installation sent it (a random id); for information only */
	device: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

/**
 * What the site sends to add a walk: the database fills in the rest. One
 * walk is one start second in one account (the database's rule), so a walk
 * that is already there is simply not added again.
 */
export type NewWalk = Pick<Walk, 'origin' | 'client_id' | 'started_at' | 'ended_at' | 'local_day' | 'seconds' | 'distance_m' | 'steps' | 'kcal'> &
	Partial<Pick<Walk, 'id' | 'utc_offset_min' | 'kcal_extra' | 'session' | 'steps_source' | 'distance_source' | 'calories_source' | 'device'>>;

export type FoodSource = 'off' | 'usda' | 'own';

export type Food = {
	id: string;
	user_id: string;
	source: FoodSource;
	source_id: string | null;
	name: string;
	brand: string | null;
	kcal_100g: number;
	serving_g: number | null;
	serving_label: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

/** A food as a search gives it, before the person has picked it. */
export type FoundFood = Pick<Food, 'source' | 'source_id' | 'name' | 'brand' | 'kcal_100g' | 'serving_g' | 'serving_label'>;

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type FoodEntry = {
	id: string;
	user_id: string;
	local_day: string;
	meal: Meal | null;
	food_id: string | null;
	name: string;
	brand: string | null;
	grams: number | null;
	kcal: number;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export type FoodSettings = {
	user_id: string;
	/** calories eaten minus calories burned, for a day: -500 to 500 */
	goal_balance_kcal: number;
	updated_at: string;
};

/**
 * What public_profile() gives out. Nothing else about a person is public.
 * The name, and time and distance walked, always; the rest only if its
 * owner switched it on: steps (show_steps), the days and "since when"
 * (show_days), the single walks (show_walks). Never calories.
 */
export type PublicProfile = {
	handle: string;
	display_name: string;
	totals: { walks: number; seconds: number; distance_m: number; steps?: number; first_day?: string | null };
	days: { day: string; seconds: number; distance_m: number; steps?: number }[] | null;
	walks: { day: string; seconds: number; distance_m: number; steps?: number }[] | null;
};
