<script lang="ts">
	// The account's own page: the public page and what it shows, the numbers
	// the estimates are made from, and the way out with everything.
	import { resolve } from '$app/paths';
	import Gate from '#lib/components/account/Gate.svelte';
	import Tabs from '#lib/components/account/Tabs.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { account, say } from '#lib/account/account.svelte.ts';
	import { database } from '#lib/account/client.ts';
	import { everything, save } from '#lib/account/export.ts';
	import { localDay } from '#lib/account/format.ts';
	import type { Body, Units } from '#lib/account/types.ts';

	// ---- the public page ------------------------------------------------
	let handle = $state('');
	let displayName = $state('');
	let pageSaved = $state('');
	let pageProblem = $state('');
	let pageBusy = $state(false);

	$effect(() => {
		// (filled in once, when the profile arrives)
		if (account.profile && !handle && !displayName) {
			handle = account.profile.handle ?? '';
			displayName = account.profile.display_name ?? '';
		}
	});

	const profile = $derived(account.profile);
	const publicLink = $derived(profile?.handle ? `${resolve('u/')}?name=${profile.handle}` : '');

	async function saveNames(event: SubmitEvent) {
		event.preventDefault();
		pageBusy = true;
		pageProblem = pageSaved = '';
		try {
			await account.saveProfile({ handle: handle.trim().toLowerCase() || null, display_name: displayName.trim() || null });
			pageSaved = 'Saved.';
		} catch (error) {
			pageProblem = say(error);
		}
		pageBusy = false;
	}

	async function flip(what: 'is_public' | 'show_days' | 'show_steps' | 'show_walks', on: boolean) {
		pageProblem = pageSaved = '';
		try {
			await account.saveProfile({ [what]: on });
		} catch (error) {
			pageProblem = say(error);
		}
	}

	async function setUnits(units: Units) {
		try {
			await account.saveProfile({ units });
		} catch (error) {
			pageProblem = say(error);
		}
	}

	// ---- the numbers the estimates are made from ---------------------------
	let weight = $state('');
	let weightUnit = $state<'kg' | 'lb'>('kg');
	let heightCm = $state('');
	let heightFt = $state('');
	let heightIn = $state('');
	let heightUnit = $state<'cm' | 'ft'>('cm');
	let birthYear = $state('');
	let sex = $state<'' | 'male' | 'female'>('');
	let bodyLoaded = $state(false);
	let bodySaved = $state('');
	let bodyProblem = $state('');
	let bodyBusy = $state(false);

	const round1 = (n: number) => Math.round(n * 10) / 10;

	$effect(() => {
		if (account.where !== 'in' || !account.profile?.body_food_consent_at || bodyLoaded) return;
		bodyLoaded = true;
		const imperial = account.profile.units === 'mi';
		weightUnit = imperial ? 'lb' : 'kg';
		heightUnit = imperial ? 'ft' : 'cm';
		void (async () => {
			try {
				const db = await database();
				const { data } = await db.from('body').select('*').maybeSingle();
				const body = data as Body | null;
				if (!body) return;
				if (body.weight_kg) weight = String(weightUnit === 'lb' ? round1(body.weight_kg * 2.2046226) : body.weight_kg);
				if (body.height_cm) {
					heightCm = String(body.height_cm);
					const inches = body.height_cm / 2.54;
					heightFt = String(Math.floor(inches / 12));
					heightIn = String(Math.round(inches % 12));
				}
				birthYear = body.birth_year ? String(body.birth_year) : '';
				sex = body.sex ?? '';
			} catch (error) {
				bodyProblem = say(error);
			}
		})();
	});

	async function saveBody(event: SubmitEvent) {
		event.preventDefault();
		bodyBusy = true;
		bodyProblem = bodySaved = '';
		try {
			const kg = weight ? round1(Number(weight) / (weightUnit === 'lb' ? 2.2046226 : 1)) : null;
			const cm = heightUnit === 'cm' ? (heightCm ? round1(Number(heightCm)) : null) : heightFt ? round1((Number(heightFt) * 12 + Number(heightIn || 0)) * 2.54) : null;
			const db = await database();
			const { error } = await db
				.from('body')
				.upsert({ user_id: account.userId, weight_kg: kg, height_cm: cm, birth_year: birthYear ? Number(birthYear) : null, sex: sex || null }, { onConflict: 'user_id' });
			if (error) throw error;
			bodySaved = 'Saved.';
		} catch (error) {
			const text = say(error);
			bodyProblem = /outside what Walka takes/.test(text) ? 'One of these numbers is outside what Walka takes: weight 30 to 250 kg, height 120 to 230 cm, and an age of 18 or more.' : text;
		}
		bodyBusy = false;
	}

	let agreed = $state(false);
	let withdrawing = $state(false);

	async function agree(event: SubmitEvent) {
		event.preventDefault();
		bodyBusy = true;
		bodyProblem = '';
		try {
			await account.agree();
		} catch (error) {
			bodyProblem = say(error);
		}
		bodyBusy = false;
	}

	async function withdraw() {
		bodyBusy = true;
		bodyProblem = bodySaved = '';
		try {
			await account.withdraw();
			weight = heightCm = heightFt = heightIn = birthYear = '';
			sex = '';
			agreed = withdrawing = false;
		} catch (error) {
			bodyProblem = say(error);
		}
		bodyBusy = false;
	}

	// ---- taking it out, and deleting it -----------------------------------
	let dataBusy = $state(false);
	let dataProblem = $state('');
	let deleting = $state(false);
	let typed = $state('');

	async function takeOut() {
		dataBusy = true;
		dataProblem = '';
		try {
			save(`walka-account-${localDay()}.json`, JSON.stringify(await everything(), null, '\t'));
		} catch (error) {
			dataProblem = say(error);
		}
		dataBusy = false;
	}

	async function deleteAccount(event: SubmitEvent) {
		event.preventDefault();
		dataBusy = true;
		dataProblem = '';
		try {
			await account.remove();
		} catch (error) {
			dataProblem = say(error);
		}
		dataBusy = false;
	}
</script>

<Seo title="Your account" description="Your Walka account: your public page and what it shows, the numbers the estimates are made from, and how to take everything out or delete it." />

<Gate>
	<section class="app">
		<div class="container">
			<header class="app-head">
				<p class="label">Your account</p>
				<h1>{profile?.display_name || profile?.handle || 'Your account'}</h1>
				<p class="lede">Signed in{account.email ? ` as ${account.email}` : ''}.</p>
			</header>

			<Tabs current="account" />

			<div class="panel">
				<header>
					<h2>Your page</h2>
					<p>
						Your account is private. If you switch your page to public, anyone who knows or guesses its name can see the
						name you show, and how long and how far you have walked in all. Nothing else, unless you switch more on below.
					</p>
				</header>

				<form class="fields" onsubmit={saveNames}>
					<div class="fields fields--two">
						<div class="field">
							<label for="handle">The name in your page's address</label>
							<input id="handle" type="text" autocomplete="off" autocapitalize="none" spellcheck="false" minlength="3" maxlength="20" pattern="[a-z0-9][a-z0-9_\-]*" bind:value={handle} />
							<p class="hint">3 to 20 small letters, digits, - or _. Needed for a public page.</p>
						</div>
						<div class="field">
							<label for="display-name">The name shown on it</label>
							<input id="display-name" type="text" autocomplete="off" maxlength="40" bind:value={displayName} />
							<p class="hint">Anything you like. It need not be your real name.</p>
						</div>
					</div>
					<div class="panel-foot">
						<button class="plain-button" type="submit" disabled={pageBusy}>Save names</button>
						{#if pageSaved}<span class="estimate" role="status">{pageSaved}</span>{/if}
					</div>
				</form>

				<label class="switch">
					<input type="checkbox" role="switch" checked={profile?.is_public} disabled={!profile?.handle} onchange={(e) => flip('is_public', e.currentTarget.checked)} />
					<span class="switch-name">My page is public</span>
					<span class="hint">
						{#if !profile?.handle}Save a name for the address first.{:else if profile.is_public}Anyone who knows or guesses the name can see it. Switch it off and it is gone at once, and the switches below go off with it.{:else}Nobody can see it.{/if}
					</span>
				</label>
				<label class="switch">
					<input type="checkbox" role="switch" checked={profile?.show_days} disabled={!profile?.is_public} onchange={(e) => flip('show_days', e.currentTarget.checked)} />
					<span class="switch-name">Show the last twelve weeks, day by day</span>
					<span class="hint">A reader sees on which days you walked and for how long, and since when you walk.</span>
				</label>
				<label class="switch">
					<input type="checkbox" role="switch" checked={profile?.show_steps} disabled={!profile?.is_public} onchange={(e) => flip('show_steps', e.currentTarget.checked)} />
					<span class="switch-name">Show steps</span>
					<span class="hint">If Walka estimates your steps, it does so from your height, so a reader can work out roughly how tall you are.</span>
				</label>
				<label class="switch">
					<input type="checkbox" role="switch" checked={profile?.show_walks} disabled={!profile?.is_public} onchange={(e) => flip('show_walks', e.currentTarget.checked)} />
					<span class="switch-name">Show my single walks</span>
					<span class="hint">Your last 20 walks, one by one: the day, the time walked and the distance. Never the time of day.</span>
				</label>
				<p class="estimate">Calories, your numbers and your food are never on your page, whatever is switched on.</p>

				{#if pageProblem}<p class="notice notice--bad" role="alert">{pageProblem}</p>{/if}
				{#if profile?.is_public && publicLink}
					<p class="notice notice--ok">Your page is public: <a href={publicLink}>see it as others do</a>.</p>
				{/if}

				<div class="field">
					<span class="field-name" id="units-name">Distances in</span>
					<div class="tabs" role="group" aria-labelledby="units-name">
						<button type="button" aria-pressed={profile?.units === 'mi'} onclick={() => setUnits('mi')}>Miles</button>
						<button type="button" aria-pressed={profile?.units === 'km'} onclick={() => setUnits('km')}>Kilometres</button>
					</div>
				</div>
			</div>

			{#if !profile?.body_food_consent_at}
				<form class="panel" onsubmit={agree}>
					<header>
						<h2>Your numbers, and the food diary</h2>
						<p>
							The food diary makes its estimates from your weight and height. Before any of that is kept, the choice is
							yours.
						</p>
					</header>
					<label class="tick">
						<input type="checkbox" bind:checked={agreed} required />
						<span>
							Keep my body numbers and my food diary in my account. This is information about my health. Only I can see
							it. I can take this back on this page at any time, and then all of it is deleted at once.
						</span>
					</label>
					{#if bodyProblem}<p class="notice notice--bad" role="alert">{bodyProblem}</p>{/if}
					<div class="panel-foot">
						<button class="plain-button" type="submit" disabled={bodyBusy || !agreed}>I agree</button>
					</div>
				</form>
			{:else}
				<form class="panel" onsubmit={saveBody}>
					<header>
						<h2>Your numbers</h2>
						<p>
							The food diary makes its estimates from these. They are kept in your account, only you can see them, and
							they are never on your public page. All of them are optional.
						</p>
					</header>
					<div class="fields fields--two">
						<div class="field">
							<label for="weight">Weight</label>
							<div class="with-unit">
								<input id="weight" type="number" inputmode="decimal" step="0.1" min="0" bind:value={weight} />
								<select aria-label="Weight in" bind:value={weightUnit}>
									<option value="kg">kg</option>
									<option value="lb">lb</option>
								</select>
							</div>
						</div>
						<div class="field">
							<label for={heightUnit === 'cm' ? 'height-cm' : 'height-ft'}>Height</label>
							<div class="with-unit">
								{#if heightUnit === 'cm'}
									<input id="height-cm" type="number" inputmode="decimal" step="0.1" min="0" bind:value={heightCm} />
								{:else}
									<span class="with-unit">
										<input id="height-ft" type="number" inputmode="numeric" min="0" max="8" aria-label="Height, feet" placeholder="ft" bind:value={heightFt} />
										<input type="number" inputmode="numeric" min="0" max="11" aria-label="Height, inches" placeholder="in" bind:value={heightIn} />
									</span>
								{/if}
								<select aria-label="Height in" bind:value={heightUnit}>
									<option value="cm">cm</option>
									<option value="ft">ft, in</option>
								</select>
							</div>
						</div>
						<div class="field">
							<label for="birth-year">Year of birth</label>
							<input id="birth-year" type="number" inputmode="numeric" min="1900" max={new Date().getFullYear() - 19} bind:value={birthYear} />
							<p class="hint">Walka is for adults.</p>
						</div>
						<div class="field">
							<label for="sex">Sex, for the resting estimate</label>
							<select id="sex" bind:value={sex}>
								<option value="">Rather not say</option>
								<option value="female">Female</option>
								<option value="male">Male</option>
							</select>
							<p class="hint">The formula knows only these two. Without it the estimate is rougher.</p>
						</div>
					</div>
					{#if bodyProblem}<p class="notice notice--bad" role="alert">{bodyProblem}</p>{/if}
					<div class="panel-foot">
						<button class="plain-button" type="submit" disabled={bodyBusy}>Save numbers</button>
						{#if bodySaved}<span class="estimate" role="status">{bodySaved}</span>{/if}
					</div>
					{#if !withdrawing}
						<p><button class="link-button" type="button" onclick={() => (withdrawing = true)}>Take back my agreement...</button></p>
					{:else}
						<p class="notice notice--bad">
							This deletes your body numbers, your foods, your food diary and your goal, at once. Your walks stay. It
							cannot be undone.
						</p>
						<div class="panel-foot">
							<button class="plain-button plain-button--danger" type="button" onclick={withdraw} disabled={bodyBusy}>Delete them, and keep none</button>
							<button class="link-button" type="button" onclick={() => (withdrawing = false)}>Keep them</button>
						</div>
					{/if}
				</form>
			{/if}

			<div class="panel">
				<header>
					<h2>Your data</h2>
					<p>Everything in your account is yours to take and to delete.</p>
				</header>
				<div class="panel-foot">
					<button class="plain-button" type="button" onclick={takeOut} disabled={dataBusy}>Save everything as a file</button>
					<button class="plain-button" type="button" onclick={() => account.signOut()}>Sign out</button>
				</div>
				{#if !deleting}
					<p><button class="link-button" type="button" onclick={() => (deleting = true)}>Delete my account...</button></p>
				{:else}
					<form class="fields" onsubmit={deleteAccount}>
						<p class="notice notice--bad">
							This deletes your account and everything in it: your page, your numbers, your walks here and your food diary.
							It cannot be undone. The walks on your own computer, in Walka, are not touched.
						</p>
						<div class="field">
							<label for="confirm-delete">Type <strong>delete</strong> to go on</label>
							<input id="confirm-delete" type="text" autocomplete="off" autocapitalize="none" bind:value={typed} />
						</div>
						<div class="panel-foot">
							<button class="plain-button plain-button--danger" type="submit" disabled={dataBusy || typed.trim().toLowerCase() !== 'delete'}>Delete my account</button>
							<button class="link-button" type="button" onclick={() => ((deleting = false), (typed = ''))}>Keep it</button>
						</div>
					</form>
				{/if}
				{#if dataProblem}<p class="notice notice--bad" role="alert">{dataProblem}</p>{/if}
			</div>
		</div>
	</section>
</Gate>
