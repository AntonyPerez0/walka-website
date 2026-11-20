// The rows of the database, as the site reads and writes them.
// supabase/migrations is the truth; docs/data-model.md explains it.

export type Units = 'mi' | 'km';

export type Profile = {
	user_id: string;
	handle: string | null;
	display_name: string | null;
	is_public: boolean;
	show_walks: boolean;
	show_kcal: boolean;
	units: Units;
	adult_confirmed_at: string | null;
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
	seconds: number;
	distance_m: number;
	steps: number;
	kcal: number;
	kcal_extra: number | null;
	max_kmh: number | null;
	avg_hr: number | null;
	max_hr: number | null;
	session: 'wow' | 'manual' | null;
	character_name: string | null;
	steps_source: 'treadmill' | 'estimate' | null;
	distance_source: 'treadmill' | 'speed' | null;
	calories_source: 'speed' | 'heart_rate' | null;
	treadmill: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

/** What the site sends to add a walk: the database fills in the rest. */
export type NewWalk = Pick<Walk, 'origin' | 'client_id' | 'started_at' | 'ended_at' | 'local_day' | 'seconds' | 'distance_m' | 'steps' | 'kcal'> &
	Partial<Pick<Walk, 'id' | 'kcal_extra' | 'max_kmh' | 'avg_hr' | 'max_hr' | 'session' | 'character_name' | 'steps_source' | 'distance_source' | 'calories_source' | 'treadmill'>>;

export type FoodSource = 'off' | 'usda' | 'own';

export type Food = {
	id: string;
	user_id: string;
	source: FoodSource;
	source_id: string | null;
	name: string;
	brand: string | null;
	kcal_100g: number;
	protein_100g: number | null;
	carbs_100g: number | null;
	fat_100g: number | null;
	serving_g: number | null;
	serving_label: string | null;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

/** A food as a search gives it, before the person has picked it. */
export type FoundFood = Pick<Food, 'source' | 'source_id' | 'name' | 'brand' | 'kcal_100g' | 'protein_100g' | 'carbs_100g' | 'fat_100g' | 'serving_g' | 'serving_label'>;

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
	protein_g: number | null;
	carbs_g: number | null;
	fat_g: number | null;
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

/** What public_profile() gives out. Nothing else about a person is public. */
export type PublicProfile = {
	handle: string;
	display_name: string;
	units: Units;
	totals: { walks: number; seconds: number; distance_m: number; steps: number; kcal: number | null; first_day: string | null; last_day: string | null };
	days: { day: string; seconds: number; distance_m: number; steps: number }[];
	walks: { day: string; seconds: number; distance_m: number; steps: number; kcal: number | null }[] | null;
};
