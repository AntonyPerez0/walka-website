<script lang="ts">
	// This page is built two ways, and each must say only what is true of it.
	//
	// WITHOUT accounts (no SUPABASE_URL at build time: src/env.ts) the site
	// has none, and part three is "What is planned". WITH accounts, part
	// three is "Your account, if you make one", in the present tense.
	//
	// So every sentence about accounts stands inside {#if ACCOUNTS.on} ...
	// {:else} ... {/if} - the description, the short version and the lists of
	// sections too. After changing either side, build both ways and read both.
	//
	// What part three says is taken from docs/data-model.md and from
	// supabase/migrations: when a table or a rule changes there, it changes
	// here, and the date below with it.
	import { ACCOUNTS_REGION, CONTACT, MAIL_SENDER } from '$app/env/public';
	import { resolve } from '$app/paths';
	import { ACCOUNTS, WAY_NAMES, type Way } from '#lib/account/config.ts';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { NAME_KEPT_AT, OWN_NAME } from '#lib/own-name.ts';
	import { LINKS } from '#lib/site.ts';

	// The date of the last change to the words of this page. It stands at the
	// top and again under "Changes": change it whenever the text changes.
	const UPDATED = { iso: '2026-11-21', text: '21 November 2026' };

	const GITHUB_PRIVACY = 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement';

	// what has changed on this page, and when
	const HISTORY = `${LINKS.websiteRepo}/commits/HEAD/src/routes/privacy/+page.svelte`;

	// The company that runs the database and the sign-in, in its own words.
	const SUPABASE = {
		privacy: 'https://supabase.com/privacy',
		processing: 'https://supabase.com/legal/customer-resources/data-processing-addendum',
		others: 'https://supabase.com/legal/customer-resources/subprocessor-list'
	};
	const OPEN_FOOD_FACTS_PRIVACY = 'https://world.openfoodfacts.org/privacy';

	// The ways to sign in that this build has switched on (SIGN_IN), and
	// where each of the other sites says what it does with a sign-in.
	type OtherSite = Exclude<Way, 'email'>;
	const byEmail = ACCOUNTS.ways.includes('email');
	const otherSites = ACCOUNTS.ways.filter((way): way is OtherSite => way !== 'email');
	const SITE_PRIVACY: Record<OtherSite, string> = {
		discord: 'https://discord.com/privacy',
		google: 'https://policies.google.com/privacy',
		github: GITHUB_PRIVACY
	};
	/** "Discord", "Discord or Google", "Discord, Google or GitHub" */
	const oneOf = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`);
	const otherNames = oneOf(otherSites.map((way) => WAY_NAMES[way]));

	const DESCRIPTION = ACCOUNTS.on
		? 'Walka uploads nothing. An account on this website is opt-in, private until you say otherwise, and yours to take out or delete. What is kept, where, and who sees it.'
		: 'Walka uploads nothing, and this website has no accounts, no cookies, no analytics and no advertising. What is kept, where, and what is planned.';

	// "The short version" stands above the article, so it is not in its list.
	const SECTIONS = [
		{ id: 'walka', label: 'Walka, the program' },
		{ id: 'this-website', label: 'This website' },
		ACCOUNTS.on ? { id: 'your-account', label: 'Your account, if you make one' } : { id: 'planned', label: 'What is planned' },
		{ id: 'children', label: 'Children' },
		{ id: 'your-rights', label: 'Your rights, and who to ask' },
		{ id: 'changes', label: 'Changes to this page' }
	];

	// The two long parts have a line of their own headings under their first
	// words, so that one answer is one step away.
	const IN_WALKA = [
		{ id: 'what-it-keeps', label: 'What it keeps, and where' },
		{ id: 'dashboard', label: 'The dashboard' },
		{ id: 'screen', label: 'What it looks at on your screen' },
		{ id: 'share-picture', label: 'The Share picture' },
		{ id: 'probe-report', label: 'The probe report' },
		{ id: 'what-leaves', label: 'What leaves your computer' }
	];

	const IN_WEBSITE = [
		{ id: 'host', label: 'Who hosts it, and what a host sees' },
		{ id: 'in-your-browser', label: 'What is kept in your browser' },
		{ id: 'downloads-page', label: 'The downloads page' },
		{ id: 'links', label: 'Links to other sites' }
	];

	// Part three, on a site with accounts.
	const IN_ACCOUNT = [
		{ id: 'account-keeps', label: 'What is kept' },
		{ id: 'who-sees-it', label: 'Who sees it' },
		{ id: 'public-page', label: 'Your public page' },
		{ id: 'health', label: 'Body numbers and the food diary' },
		{ id: 'where-it-is-kept', label: 'Where it is kept' },
		{ id: 'signing-in', label: 'Signing in' },
		{ id: 'other-services', label: 'Other services your browser talks to' },
		{ id: 'take-out-delete', label: 'Taking it out, and deleting it' },
		{ id: 'adults', label: 'For adults only' },
		{ id: 'estimates', label: 'Estimates, not advice' }
	];
</script>

<Seo title="Privacy" description={DESCRIPTION} />

<PageHero label={ACCOUNTS.on ? 'Walka uploads nothing' : 'Nothing is uploaded'} title="Privacy">
	{#if ACCOUNTS.on}
		<p>
			Walka runs on your computer and uploads nothing. This website has no cookies and no analytics, and an account on
			it only if you make one - the rest is below, in plain words.
		</p>
	{:else}
		<p>
			Walka runs on your computer and uploads nothing. This website has no accounts, no cookies and no analytics - the
			rest is below, in plain words.
		</p>
	{/if}
	<p class="updated">Last updated: <time datetime={UPDATED.iso}>{UPDATED.text}</time></p>
</PageHero>

<!-- The short version: a raised band on the article's own two columns (as on
     the terms page) - the statements where the text will be, and the way
     into the rest of the page where the list of sections will be. -->
<section class="short" id="short-version" aria-labelledby="short-version-title">
	<div class="container columns">
		<div class="statements">
			<h2 id="short-version-title">The short version</h2>
			{#if ACCOUNTS.on}
				<ul class="points">
					<li>
						<strong>Walka uploads nothing.</strong> What it records stays on your computer. A walk gets into an account
						only when you add it on this website yourself.
					</li>
					<li>
						<strong>An account is opt-in.</strong> Walka needs none, and neither do these pages. Without one, the site
						holds no data about you.
					</li>
					<li>
						<strong>Private until you say otherwise.</strong> Nothing in your account is shown to anyone until you switch
						your page to public.
					</li>
					<li>
						<strong>Yours to take and to delete.</strong> You can save everything as a file, and delete the account with
						everything in it, at any time.
					</li>
					<li><strong>No cookies, no analytics, no advertising, and no selling of data.</strong></li>
					<li>
						<strong>GitHub hosts the site and the downloads; Supabase keeps the accounts.</strong> A page that is not an
						account page asks no other company for anything.
					</li>
				</ul>
			{:else}
				<ul class="points">
					<li><strong>Walka uploads nothing.</strong> What it records stays on your computer.</li>
					<li><strong>This website has no accounts, no cookies, no analytics and no advertising.</strong></li>
					<li>
						<strong>GitHub hosts the site and the downloads.</strong> Opening a page asks no other company for anything.
					</li>
					<li><strong>The site's maker gets no visitor statistics</strong> and holds no data about you.</li>
					<li>
						<strong>Accounts are planned, and are not open yet.</strong> If they come, they will be opt-in, private
						by default, and yours to export and delete.
					</li>
				</ul>
			{/if}
		</div>

		{#if ACCOUNTS.on}
			<p class="rest">
				The rest of this page says the same at length, in three parts: <a href="#walka">Walka, the program</a>,
				<a href="#this-website">this website</a>, and <a href="#your-account">your account</a>, if you make one.
			</p>
		{:else}
			<p class="rest">
				The rest of this page says the same at length, in three parts: <a href="#walka">Walka, the program</a>,
				<a href="#this-website">this website</a> as it is today, and <a href="#planned">what is planned</a>.
			</p>
		{/if}
	</div>
</section>

{#snippet inPart(of: string, headings: { id: string; label: string }[])}
	<nav class="in-part" aria-label="In this part: {of}">
		<p class="in-part-label" aria-hidden="true">In this part</p>
		<ul>
			{#each headings as heading (heading.id)}
				<li><a href="#{heading.id}">{heading.label}</a></li>
			{/each}
		</ul>
	</nav>
{/snippet}

<Article sections={SECTIONS}>
	<section id="walka" class="prose">
		<p class="label part">Part one</p>
		<h2>Walka, the program</h2>
		<p class="lead">
			Walka runs on your computer, in two pieces: the program you download and open, and the addon in the game. The
			program listens to your walking pad over Bluetooth, and to a heart-rate sensor if you add one. Nothing is
			uploaded - not to Walka's maker, not to anyone else.
		</p>
		<p>
			Walka is experimental, and you use it at your own risk. It is not a safety device or a medical device. That is the
			subject of the <a href={LINKS.disclaimer}>disclaimer</a>, not of this page.
		</p>

		{@render inPart('Walka, the program', IN_WALKA)}

		<h3 id="what-it-keeps">What it keeps, and where</h3>
		<dl class="kept">
			<div>
				<dt>
					<strong>Walka's own folder:</strong>
					<span><code>%APPDATA%\Walka</code> on Windows,</span>
					<span><code>~/Library/Application Support/Walka</code> on a Mac</span>
				</dt>
				<dd>
					<p>
						<strong>Your settings</strong>, among them the weight and height you entered (your age and sex too, if you
						entered them), and which treadmill and heart-rate sensor are yours.
					</p>
					<p>
						<strong>Your walks:</strong> when and how long, distance, steps, calories, speed, and heart rate if you use a
						sensor. A walk is recorded whenever the belt moves, with a game or without. Closing Walka ends the recording.
					</p>
					<p><strong>Your characters' journey numbers,</strong> with each character's name but not its realm.</p>
					<p>
						<strong><code>walka.log</code>,</strong> if your Walka has a window of its own: what it connected to, and
						what went wrong. It can hold your treadmill's name and Bluetooth address, and it stays on your computer
						unless you send it to somebody.
					</p>
					<p>And a few small working files.</p>
				</dd>
			</div>
			<div>
				<dt><strong>The game's folder</strong></dt>
				<dd>
					<p>
						In the Walka addon's folder: the addon, and <code>CompanionData.lua</code>, a file the program writes so
						that the numbers in the game agree - your measured walks (with average and highest heart rate), your weight
						and height, the treadmill's name.
					</p>
					<p>
						And what the addon itself records: its settings and history, each character's journey and its road. The game
						saves those with your other addon settings.
					</p>
				</dd>
			</div>
			<div>
				<dt><strong>Walka's window, or your browser</strong></dt>
				<dd>
					<p>
						Your choices on the dashboard's Share page, and whether <em>Getting started</em> is hidden - kept by what
						shows the dashboard: Walka's own window, or your browser, in its own storage for the dashboard's address.
					</p>
				</dd>
			</div>
			<div>
				<dt><strong>Where you ran <code>probe</code></strong></dt>
				<dd><p>The probe report, a small text file. The window says where it was saved.</p></dd>
			</div>
		</dl>
		<p>
			Of the game's files the program touches only Walka's own: the addon folder, and the addon's saved file, which it
			only reads.
		</p>
		<p>
			These are ordinary files on your own computer. So another program that runs on your computer, or someone with
			access to it, can read them: Walka cannot defend against that.
		</p>
		<p>
			A walk can be deleted on the dashboard's <em>History</em> page: its file is removed from Walka's folder and it is
			left out of the file the game loads. That cannot be undone. The addon's own note of that session, in the game's
			saved settings, is not removed by this.
		</p>
		<p>
			Walka puts none of this anywhere else, so there is nobody to ask for a copy or a deletion: the files are yours.
		</p>

		<h3 id="dashboard">The dashboard</h3>
		<p>
			The dashboard is a page that Walka itself serves on your computer, at <code>127.0.0.1:8787</code>, and shows in a
			window of its own (version 0.7.0: in your browser). It is only reachable from the computer itself: it shows your walks, weight and height and has no password, so it is not
			offered to other devices on your network.
		</p>
		<p>
			The page loads nothing from anywhere else. In its own words: &quot;Runs on this computer. Nothing is
			uploaded.&quot;
		</p>
		<p>
			Walka's own window is drawn with what your system already has for showing pages inside programs: <em>Microsoft
			Edge WebView2</em> on Windows, WebKit on a Mac. Nothing is downloaded for it.
		</p>

		<h3 id="screen">What it looks at on your screen</h3>
		<p>
			To count a walk for your character, Walka reads a thin strip of black and white squares that the addon draws in
			the top-left corner of the game window. The long version is under
			<a href="{resolve('how-it-works/')}#what-walka-looks-at">What Walka looks at, exactly</a>.
		</p>
		<ul>
			<li>
				<strong>Normally it looks at that corner only:</strong> a picture about 700 pixels wide and 12 high, some fifteen
				times a second.
			</li>
			<li>
				<strong>From when Walka is started until it first finds the game window,</strong> it also looks at the top-left
				corner of each monitor and, every five seconds, takes one picture of the whole screen to search it for the
				strip. <code>Walka.exe beacon</code>, the command that checks whether the strip can be read, does the same once.
				Once Walka has found the game, it looks nowhere else.
			</li>
			<li>
				<strong>What happens to a picture:</strong> it is searched for the strip, in the computer's memory, and then
				dropped. No picture is saved or sent anywhere, and of what is on it nothing is kept but the strip's ten bytes.
			</li>
			<li>
				<strong>What the strip says:</strong> whether a walking session is running or paused, how fast your character is
				going and how, whether you are AFK, and the numbers of its journey. Not whether it is fighting, dead or resting.
			</li>
		</ul>
		<p>
			On a Mac, macOS asks before a program may look at the screen, and it asks about <strong>Walka</strong> by name
			(about <strong>Terminal</strong>, if your Walka runs in a Terminal window). You can change it later under
			<em>System Settings → Privacy &amp; Security → Screen &amp; System Audio Recording</em>.
		</p>

		<h3 id="share-picture">The Share picture</h3>
		<p>
			The dashboard's Share page turns your journey into a picture you can post. It is
			<a href="{resolve('how-it-works/')}#private-by-default">private by default</a>:
		</p>
		<ul>
			<li>
				The picture is drawn on your computer, from numbers that are already on it. Nothing is uploaded and
				nothing is posted for you.
			</li>
			<li>
				Your character's name, and the small line with your weight and average pace, are <strong>off</strong> until you
				tick them.
			</li>
			<li>
				The road is read from a file on your computer and goes no further than the page that draws it. On the picture it
				is a line on a simplified map and the names of the continents (or of another land your road is on) - no zones,
				no place names, no coordinates.
			</li>
			<li>The downloaded file is named after the date, never after the character.</li>
			<li>
				The realm never leaves the game: the program is only sent a number that tells your characters apart. It finds a
				character's road in the game's saved file by that number, and neither the realm nor the folder names are passed
				on or logged.
			</li>
		</ul>

		<h3 id="probe-report">The probe report</h3>
		<p>
			<code>Walka.exe probe</code> (on a Mac: <code>Walka probe</code>) listens to your treadmill and saves a small text
			report, for <a href="{resolve('downloads/')}#probe">a treadmill that is not listed, or not behaving</a>. The saved
			report is made to be posted in public. It lists fitness machines only - not the headphones, watches and
			televisions that are also in Bluetooth range, yours or a neighbour's - with their addresses cut short, and without
			the treadmill's serial number.
		</p>
		<p>
			The window the probe runs in shows everything: that is for your eyes. Post the file, not a screenshot of the
			window.
		</p>

		<h3 id="what-leaves">What leaves your computer</h3>
		{#if ACCOUNTS.on}
			<p>
				Only what you take out yourself: a Share picture you post, a walk you download as a TCX file and import
				somewhere by hand, a walk you add to <a href="#your-account">an account on this website</a>, a probe report or
				a <code>walka.log</code> you attach to an issue (the log can hold your treadmill's name and Bluetooth address).
				From then on it is with the place you gave it to, under that place's rules.
			</p>
		{:else}
			<p>
				Only what you take out yourself: a Share picture you post, a walk you download as a TCX file and import somewhere
				by hand, a probe report or a <code>walka.log</code> you attach to an issue (the log can hold your treadmill's name and
				Bluetooth address). From then on it is with the place you gave it to, under that
				place's rules.
			</p>
		{/if}
		<p>
			If you find a way to read what Walka stores from outside the computer, or to make Walka send anything anywhere,
			that is a security problem. Please <a href={LINKS.reportVulnerability}>report it in private</a>.
		</p>
	</section>

	<section id="this-website" class="prose">
		<p class="label part">Part two</p>
		<h2>This website</h2>
		{#if ACCOUNTS.on}
			<p class="lead">
				This site is plain files. It has no comments, no cookies, no analytics, no advertising, no trackers and no
				social-media widgets. Its account pages are the only ones with forms, and the only ones that talk to a
				database: they are the subject of <a href="#your-account">part three</a>.
			</p>
			<p>
				Everything a page needs - fonts, scripts, pictures - is served by the site itself. Opening a page that is not
				an account page asks no other company for anything.
			</p>
		{:else}
			<p class="lead">
				This site is plain files. It has no accounts, no forms, no comments, no cookies, no analytics, no advertising, no
				trackers and no social-media widgets.
			</p>
			<p>
				Everything a page needs - fonts, scripts, pictures - is served by the site itself. Opening a page asks no other
				company for anything.
			</p>
		{/if}

		{@render inPart('This website', IN_WEBSITE)}

		<h3 id="host">Who hosts it, and what a host sees</h3>
		<p>
			The files are kept in a <a href={LINKS.websiteRepo}>public repository</a> on GitHub, built by a GitHub Actions
			workflow and served by GitHub Pages.
		</p>
		<p>
			Like any web host, GitHub receives your IP address and your browser's details when a page is fetched, and may keep
			logs. The site's maker cannot see those logs and gets no visitor statistics{#if OWN_NAME}{' '}from GitHub{/if}.
			What GitHub does with them is in <a href={GITHUB_PRIVACY}>GitHub's privacy statement</a>.
		</p>
		{#if OWN_NAME}
			<p>
				The site's name, <code>{OWN_NAME}</code>, is registered at {NAME_KEPT_AT}, whose name servers tell the internet
				where the site is. No page of this site is fetched through {NAME_KEPT_AT}: your browser gets every page from
				GitHub directly.{#if ACCOUNTS.on}
					{' '}(The database behind the account pages is another matter: <a href="#other-services">part three</a> says
					who carries what is sent to it.){/if}
			</p>
			<p>
				<strong>The one count the site's maker can see</strong> is Google's, and it came with the name. To whoever has
				proved that a name is theirs, Google shows how often that name's pages were shown, and how often clicked, in
				Google's own search results. The maker of this site has proved it{#if otherSites.includes('google')}
					{' '}(Google asks for that before its sign-in screen may say "Walka"){/if}. Those are Google's counts of what
				happens on Google's search page. This site sends Google nothing for them, and they say nothing about what
				anybody does here.
			</p>
		{/if}

		<h3 id="in-your-browser">What is kept in your browser</h3>
		{#if ACCOUNTS.on}
			<p>
				The site sets no cookies. On every page, one thing about you is kept in your own browser: your choice of light
				or dark, if you use the switch. It is in the browser's local storage under the name <code>walka-theme</code>,
				and it is never sent anywhere.
			</p>
		{:else}
			<p>
				The site sets no cookies. One thing about you is kept in your own browser: your choice of light or dark, if you
				use the switch. It is in the browser's local storage under the name <code>walka-theme</code>, and it is never sent
				anywhere.
			</p>
		{/if}
		<p>
			To remove it, use the switch again to go back to what your system uses, or clear this site's data in your
			browser's settings.
		</p>
		<p>
			The downloads page also keeps GitHub's answer about the latest version (see below) in that tab's session storage,
			and uses it for an hour so that it does not have to ask again. That is a version number, a date, the address of
			the release page, file sizes and the time of asking - nothing about you - and the browser drops it when the tab is
			closed.
		</p>
		<p>
			The site also keeps, in that tab's session storage, how far down each page you were, so that going back puts a
			page where you left it. That is never sent anywhere, and the browser drops it when the tab is closed.
		</p>
		{#if ACCOUNTS.on}
			<p>
				The account pages keep more there, and only for those who use them. A walker's public page keeps your choice of
				miles or kilometres, under the name <code>walka-units</code>, in the same way as light or dark. A browser that
				is signed in keeps the sign-in, and the food diary a copy of your diary: see
				<a href="#account-browser">what a signed-in browser keeps</a>.
			</p>
		{/if}

		<h3 id="downloads-page">The downloads page</h3>
		<p>
			One page talks to GitHub beyond fetching the page. The <a href={resolve('downloads/')}>downloads page</a> asks
			GitHub's public API which Walka version is the latest, to show its number, its date and the sizes of the files.
			GitHub sees that request as it sees any other.
		</p>
		<p>
			The download buttons themselves are links to files on GitHub. When you use one you are on GitHub, and
			<a href={GITHUB_PRIVACY}>GitHub's privacy statement</a> applies there.
		</p>

		<h3 id="links">Links to other sites</h3>
		<p>
			This site links to other sites, GitHub first of all. When you follow a link, the site you arrive at sees your
			visit as it sees any other, and its own privacy rules apply. This site asks your browser to tell that site no more
			than this site's address - not the page you were on.
		</p>
	</section>

	{#if ACCOUNTS.on}
	<section id="your-account" class="prose">
		<p class="label part">Part three</p>
		<h2>Your account, if you make one</h2>
		<p class="lead">
			An account is for sharing your walking progress and for the food diary. Walka itself needs none, and neither do
			the other pages of this site. An account exists only if you make one. It holds what you put into it, and the record of your signing in.
		</p>
		<p>
			Walka, the program, still uploads nothing. A walk gets into an account when you add it on this website yourself.
			Later the desktop program may be able to send your walks itself; that will be a switch you turn on, and until it
			exists Walka uploads nothing.
		</p>
		<p>
			The accounts are run by the site's owner: the one maintainer who makes Walka and this website. There is no
			company behind them. Only what the two features need is kept, there is no advertising, and no data is sold. This
			part names every company that has a hand in it.
		</p>

		{@render inPart('Your account, if you make one', IN_ACCOUNT)}

		<h3 id="account-keeps">What is kept</h3>
		<p>
			An account holds nothing until you tick <em>I am 18 or older</em> on its first page. Until then only the sign-in
			itself is kept (see <a href="#signing-in">Signing in</a>), and <em>No thanks: delete this sign-in</em> on that
			page removes that too.
		</p>
		<dl class="kept">
			<div>
				<dt><strong>Your profile</strong></dt>
				<dd>
					<p>
						The name in your page's address and the name shown on it, if you chose them. Whether your page is public,
						and which of its switches are on. Whether you want miles or kilometres.
					</p>
					<p>
						When you ticked <em>I am 18 or older</em>, and when you agreed to your body numbers and your food diary being
						kept, if you did.
					</p>
				</dd>
			</div>
			<div>
				<dt><strong>Your numbers</strong></dt>
				<dd>
					<p>
						Weight, height, year of birth and sex: what the food diary makes its estimates from. All of them are
						optional, and none is kept unless <a href="#health">you have agreed</a>.
					</p>
				</dd>
			</div>
			<div>
				<dt><strong>Your walks</strong></dt>
				<dd>
					<p>
						For each walk: when it started and ended, and the calendar day it counts for. The time the belt was moving,
						the distance, the steps, the calories, and how many of those calories were on top of sitting.
					</p>
					<p>
						Whether a walking session was running in the game. How each number was come by - measured by the treadmill,
						or estimated. And how the walk got here - from one of Walka's files, from a TCX file or typed in - with the
						name that file has for it, such as <code>20261119-213000</code>.
					</p>
					<p>
						Each walk also carries how far your clock was from world time (UTC) when it started, where the file or your
						browser says so. A program that sends walks may add a random number that tells one installation from
						another.
					</p>
					<p>
						<strong>Left on your computer,</strong> because nothing here needs them: the second-by-second samples, the
						heart rate, the top speed, the treadmill's name and your character.
					</p>
				</dd>
			</div>
			<div>
				<dt><strong>Your foods</strong></dt>
				<dd>
					<p>
						A food you picked from a search or a scan, or made yourself, kept so that you can pick it again: its name,
						its brand, its calories in 100 grams, the size of a serving if the source names one, and where it came from
						- Open Food Facts (with the barcode), USDA FoodData Central (with its number there) or you.
					</p>
					<p>Only what you picked is kept, and only in your own account. There is no shared list of foods.</p>
				</dd>
			</div>
			<div>
				<dt><strong>Your food diary</strong></dt>
				<dd>
					<p>
						One entry for each thing you ate: the day, the meal if you say which, the name and the brand, the grams if
						they are known, and the calories.
					</p>
				</dd>
			</div>
			<div>
				<dt><strong>Your goal</strong></dt>
				<dd>
					<p>One number: calories eaten minus calories burned, for a day. It goes no further than 500 either way.</p>
				</dd>
			</div>
			<div>
				<dt><strong>Reports you send</strong></dt>
				<dd>
					<p>
						If you report somebody's public page: the name of that page, which of three reasons you gave, your note if
						you wrote one, and when.
					</p>
				</dd>
			</div>
		</dl>
		<p>Each of these also carries when it was made and when it was last changed.</p>
		<p>
			<strong>Not kept:</strong> no password, no location, no contacts, no pictures, no payment details, no advertising
			identifiers. Nothing that is not on this page.
		</p>

		<h3 id="who-sees-it">Who sees it</h3>
		<p>
			You. Nobody else: not a visitor, and not another person who is signed in. The database itself holds to that, with
			a rule on every table that lets a signed-in person read, add and change their own rows and nobody else's. A
			visitor who is not signed in can read no table at all.
		</p>
		<p>
			Two things leave your account, and only if you send them: what <a href="#public-page">your public page</a>
			shows, once you switch it on, and a report about somebody else's page, which the site's owner reads.
		</p>
		<p>
			The site's owner runs the database, and as its administrator can read everything in it: the rules above do not
			bind an administrator. The owner does not look into anyone's account, except to fix a fault or to act on a
			report. A public page can be taken down without opening the account behind it.
		</p>
		<p>
			Supabase, the company whose computers the database is on, can reach it as any host can. What it may do with it is
			under <a href="#where-it-is-kept">Where it is kept</a>.
		</p>
		<p>
			If you find a way to read or change an account that is not yours, that is a security problem. Please say so in
			private{#if CONTACT}, to <a href="mailto:{CONTACT}">{CONTACT}</a>,{/if} and not in a public issue.
		</p>

		<h3 id="public-page">Your public page</h3>
		<p>
			Your account is private. If you switch your page to public, anyone who knows or guesses its name can see the name
			you show, and in all: how many walks, how long and how far. Nothing else, unless you switch more on. The switches
			are on <a href={resolve('account/')}>your account page</a>, and each is off at first:
		</p>
		<ul>
			<li>
				<strong>My page is public.</strong> Anyone who knows or guesses the name can see it. Switch it off and it is
				gone at once, and the switches below go off with it.
			</li>
			<li>
				<strong>Show the last twelve weeks, day by day.</strong> A reader sees on which days you walked, for how long
				and how far, and since when you walk.
			</li>
			<li>
				<strong>Show steps.</strong> If Walka estimates your steps, it does so from your height, so a reader can work
				out roughly how tall you are.
			</li>
			<li>
				<strong>Show my single walks.</strong> Your last 20 walks, one by one: the day, the time walked and the
				distance. Never the time of day.
			</li>
		</ul>
		<p>
			Calories, your numbers and your food are never on your page, whatever is switched on. Neither is your e-mail
			address.
		</p>
		<p>
			Public means public. The address of your page has its name in it, and anyone who knows or guesses that name can
			open the page: it is not a secret link. The site asks search engines not to list these pages, and leaves them out
			of its sitemap. That is a request, and no more.
		</p>
		<p>
			Switch your page off and it is gone at once. What somebody already saw, saved or took a picture of is not: nothing
			can take that back.
		</p>
		<p>
			The name in a page's address is one of a kind. So somebody who tries to take a name learns whether it is taken,
			also when the page behind it is private.
		</p>
		<p>
			A signed-in person can report a public page - one that pretends to be somebody, or has an offensive name. The
			site's owner can then take the page down. That hides the page and changes nothing in the account. The reason is
			noted with the account, and the owner can put the page back.
		</p>

		<h3 id="health">Body numbers and the food diary</h3>
		<p>
			Your weight, height, year of birth and sex, and what you eat, are information about your health. They are kept
			only if you agree, in these words on your account page:
		</p>
		<blockquote>
			<p>
				Keep my body numbers and my food diary in my account. This is information about my health. No visitor and no other walker can see it. The site's owner, who runs the database, can: the privacy page says when. I
				can take this back on this page at any time, and then all of it is deleted at once.
			</p>
		</blockquote>
		<p>
			Until you agree, the database refuses them. When you agree, it notes the moment. Your walks need no such
			agreement, and an account works without it: it has no food diary, and that is all.
		</p>
		<p>
			To take it back, use <em>Take back my agreement...</em> under <em>Your numbers</em> on your account page. That
			deletes your body numbers, your foods, your food diary and your goal, at once. Your walks stay. It cannot be
			undone.
		</p>

		<h3 id="where-it-is-kept">Where it is kept</h3>
		<p>
			In a database at Supabase, the company that runs the database and the sign-in for this site.{#if ACCOUNTS_REGION}
				{' '}The database is in <strong>{ACCOUNTS_REGION}</strong>.{/if}
			The website itself is still plain files on GitHub, which holds no account data.
		</p>
		<p>
			Supabase keeps the data for the site's owner and on the owner's instructions. Its own words are its
			<a href={SUPABASE.privacy}>privacy notice</a> and its
			<a href={SUPABASE.processing}>data processing addendum</a>; the companies it uses in turn to run its service
			are in its <a href={SUPABASE.others}>list of sub-processors</a>.
		</p>
		<p>
			An account is kept until you delete it, or until accounts end in the way the
			<a href="{resolve('terms/')}#accounts">terms</a> describe. Nothing deletes one for not being used.
		</p>

		<h3 id="signing-in">Signing in</h3>
		<p>
			Nobody signs in with a password here, and no password is kept. Signing in is done by a service of Supabase's,
			called the sign-in below.
		</p>
		{#if byEmail}
			<p>
				<strong>By e-mail.</strong> You type your e-mail address on the account page, a six-digit code is sent to it,
				and you type the code in. The mail is sent through {MAIL_SENDER || 'a mail service'}, which is given your
				address and the mail itself in order to deliver it.
			</p>
		{/if}
		{#if otherSites.length}
			<p>
				<strong>With {otherNames}.</strong> You go to that site, say yes there, and come back signed in. That site hands
				the sign-in your e-mail address, and with it your name and user name there, the number that site knows your
				account by, and the address of the picture you have there. This website uses the e-mail address. It neither
				uses nor shows the rest; the sign-in keeps it until you delete your account. The other site, for its part,
				learns that you signed in here, and when.
			</p>
		{/if}
		<p>What the sign-in keeps:</p>
		<ul>
			<li>your e-mail address, when the account was made, and when you last signed in;</li>
			<li>
				for each browser you are signed in on, a session: when it began, when it was last renewed, the IP address it
				came from and what the browser calls itself;
			</li>
			<li>
				a log of what it did for you - a code sent, a sign-in, a session renewed - with your e-mail address and the
				time of each.
			</li>
		</ul>
		<p>
			Of all that, this website reads your e-mail address, which it shows you on your account page, and the two dates,
			which go into the file you can save.
		</p>
		<p id="account-browser">
			<strong>What a signed-in browser keeps.</strong> The sign-in is kept in the browser's local storage, under names
			that begin with <code>walka-account</code>: the keys that say this browser is signed in, what the sign-in keeps
			about you (your e-mail address and the dates above{#if otherSites.length}, and what another site handed over:
				name, user name, account number and picture address{/if}), and a one-time secret for each sign-in that was
			begun here.
		</p>
		<p>
			It is not a cookie. The keys go to Supabase with each request and to nobody else (on the way they pass through
			the network Supabase uses: see <a href="#other-services">below</a>), and all of it stays until you sign out.
		</p>
		<p>
			The food diary also keeps a copy of your diary in that browser, so that it opens and works without a connection.
			Signing out removes that as well. That copy holds what the diary shows: your entries, your foods, your body numbers, your goal, and the time and
			calories of your recent walks. Taking back your agreement, and deleting your account, remove it too. So that the
			diary opens without a connection, the browser also keeps the diary's own files - scripts, styles and icons,
			nothing about you - until the site's data is cleared in the browser's settings.
		</p>

		<h3 id="other-services">Other services your browser talks to</h3>
		<p>
			A page that is not an account page asks no other company for anything: <a href="#this-website">part two</a>
			holds for it as before. The account pages - your account, your walks, the food diary, and a walker's public page
			- talk to these, each only when there is a reason:
		</p>
		<dl class="kept">
			<div>
				<dt><strong>Supabase</strong></dt>
				<dd>
					<p>
						Every account page asks the database, and so does a walker's public page. With each request Supabase
						receives your IP address and your browser's details, as any host does, and it keeps a log of requests for a
						time.
					</p>
					<p>
						The site's owner can read that log in Supabase's dashboard for as long as Supabase keeps it, and does so
						only to find a fault.
					</p>
					<p>
						Those requests do not go to Supabase directly. They reach it through the network of Cloudflare, a
						company Supabase uses for that and names in its <a href={SUPABASE.others}>list of sub-processors</a>. So
						Cloudflare carries every request to the database and the sign-in, your IP address with it.{#if otherSites.length}
							{' '}On the way to another site's sign-in and back, your browser is at Supabase's own address for a
							moment; Cloudflare may set a short-lived cookie of its own there, which it uses to tell browsers from
							programs. It is kept under Supabase's address, not this site's: no page of this site can read it, and
							none uses it.{/if}
					</p>
				</dd>
			</div>
			<div>
				<dt>
					<strong>Open Food Facts</strong>
					<span><code>world.openfoodfacts.org</code></span>
				</dt>
				<dd>
					<p>
						When you search for a food or scan a barcode in the food diary, your browser asks Open Food Facts, an open
						database of food products. It receives the words you searched for or the barcode, and your IP address and
						your browser's details. Nothing about your account goes with them.
					</p>
					<p>What it does with a request is in <a href={OPEN_FOOD_FACTS_PRIVACY}>its privacy policy</a>.</p>
				</dd>
			</div>
			<div>
				<dt><strong>USDA FoodData Central</strong></dt>
				<dd>
					<p>
						Where the food search shows foods from the U.S. Department of Agriculture's list, your browser does not ask
						USDA itself: a small function at Supabase passes your search words on. USDA receives those words, and not
						your IP address.
					</p>
				</dd>
			</div>
			{#each otherSites as way (way)}
				<div>
					<dt>
						<strong>{WAY_NAMES[way]}</strong>
						<span>if you sign in with it</span>
					</dt>
					<dd>
						<p>
							For that step you are on its own site, and <a href={SITE_PRIVACY[way]}>its privacy rules</a> apply
							there. It learns that you signed in to this website, and when.
						</p>
					</dd>
				</div>
			{/each}
			{#if byEmail}
				<div>
					<dt>
						<strong>{MAIL_SENDER || 'The mail service'}</strong>
						<span>if you sign in by e-mail</span>
					</dt>
					<dd>
						<p>
							Sends the sign-in mail. Each time you ask for a code, it receives your e-mail address and the mail with
							the code. Your browser does not talk to it: the sign-in does.
						</p>
					</dd>
				</div>
			{/if}
			<div>
				<dt>
					<strong>GitHub</strong>
					<span>as the host</span>
				</dt>
				<dd><p>Serves these pages as it serves the rest of the site: see <a href="#host">part two</a>.</p></dd>
			</div>
		</dl>
		<p>
			Once a day a small job on GitHub asks the database one question, so that the database is not put to sleep for
			lack of use. It carries nothing about anyone.
		</p>
		<p>No advertising network, no analytics and no tracker is among them, on these pages as on the others.</p>

		<h3 id="take-out-delete">Taking it out, and deleting it</h3>
		<p>
			<strong>Taking it out.</strong> <em>Save everything as a file</em> on <a href={resolve('account/')}>your account
			page</a>. Your own browser reads your rows and saves them as one file, named <code>walka-account</code> and the
			date, in a format other programs can read (JSON). Nothing is made ready on a server, and nothing is mailed.
		</p>
		<p>
			In the file: what the sign-in keeps that the site can read - your e-mail address, when the account was made, when
			you last signed in and which ways you signed in - and everything listed under
			<a href="#account-keeps">What is kept</a>: your profile, your numbers, your walks, your foods, your diary, your
			goal and the reports you sent.
		</p>
		<p>
			<strong>Deleting one walk, food or diary entry.</strong> It is emptied at once, and what is left is a marker: of
			a walk, when it started and ended, its day, how far the clock was from world time, and how it got here; of a
			diary entry, its day; of a food, where it came from
			and its number there. The marker is kept so that another device of yours hears of the deletion and does not
			bring the entry back. Markers are in the file you can save, and they go when the account goes.
		</p>
		<p>
			<strong>Deleting the account.</strong> <em>Delete my account...</em> on your account page. At once, and for
			good, this deletes everything in your account - your page, your numbers, your walks here, your food diary, the
			markers - and the sign-in record with it: your e-mail address, your sessions and whatever the sign-in noted about you in the database. It
			cannot be undone, and there is nobody who could bring it back. The walks on your own computer, in Walka, are not
			touched.
		</p>
		<p><strong>What stays,</strong> and for how long:</p>
		<ul>
			<li>
				<strong>The name of your public page,</strong> if you had one, is kept free for 90 days - the name and a date,
				with nothing else - so that a link you once passed on does not lead to a stranger at once. The same holds for
				a name you change.
			</li>
			<li>
				<strong>A report somebody else sent about your page</strong> stays in that person's account. It names the
				page, not you.
			</li>
			<li>
				<strong>What Supabase itself keeps for a time</strong> - its log of requests, and any copies it makes of the
				database for safekeeping - is not the site's to delete. It runs out by itself.
			</li>
		</ul>

		<h3 id="adults">For adults only</h3>
		<p>
			Walka is for adults, and so is an account. It holds nothing until you tick <em>I am 18 or older</em>. The
			database notes when, and that is not taken back. A year of birth is optional, and one that could make you 17 is
			not taken.
		</p>
		<p>
			Nobody's age is checked beyond that: the site has no means to, and asks for no papers. An account that turns out
			to be a child's is deleted when the site's owner learns of it{#if CONTACT}: write to
				<a href="mailto:{CONTACT}">{CONTACT}</a>{/if}.
		</p>

		<h3 id="estimates">Estimates, not advice</h3>
		<p>
			Every calorie figure in an account is an estimate, for interest only: what a walk burned, what a body burns at
			rest, what a food holds, what is left to walk off. None of it is medical advice - for food as for walks. Do not
			use it to decide anything about your health, your diet, your medication or your training.
		</p>
		<p>
			The food numbers come from two public lists and from what you type in. A list can be wrong about a food, and the
			food diary is not a diet plan: it says nothing about what anyone should eat.
		</p>
	</section>
	{:else}
	<section id="planned" class="prose">
		<p class="label part">Part three</p>
		<h2>What is planned: accounts and food tracking</h2>
		<div class="not-built">
			<Callout kind="note" title="Not open yet">
				<p>
					Nothing in this section exists today. There are no accounts and nothing to sign up for, and Walka uploads
					nothing.
				</p>
			</Callout>
		</div>
		<p>Planned for later, on this website:</p>
		<ul>
			<li><strong>Accounts,</strong> to share your walking progress with others.</li>
			<li>
				<strong>Food tracking</strong> for signed-in people: what you eat, next to what you burn - an estimate made from
				your Walka walks plus a resting estimate.
			</li>
		</ul>
		<p>If they are built, this is what will hold:</p>
		<ul>
			<li><strong>Opt-in.</strong> Nothing will be synced or shared until you turn it on.</li>
			<li><strong>Private by default.</strong> A profile will be private until you make it public.</li>
			<li>
				<strong>Yours to take and to delete.</strong> You will be able to export your data, and delete your account and
				your data, yourself.
			</li>
			<li><strong>Only what the features need</strong> will be collected.</li>
			<li><strong>No advertising, and no selling of data.</strong></li>
			<li>
				<strong>Where it is kept.</strong> Account data will be kept in a hosted database (Supabase), with rules so that
				each person can read and write only their own rows.
			</li>
			<li>
				<strong>Estimates, not advice.</strong> Food and calorie figures will be estimates, for interest only, and not
				medical advice - as Walka's calories, steps and heart rate are today.
			</li>
			<li>
				<strong>This page first.</strong> This page and the <a href="{resolve('terms/')}#accounts">terms</a> will be
				updated before any of it is switched on. This page will then name every company that processes data.
			</li>
		</ul>
	</section>
	{/if}

	<section id="children" class="prose">
		<h2>Children</h2>
		<p>
			Walka is for adults only. Its <a href={LINKS.disclaimer}>disclaimer</a> says so, and the dashboard's body profile
			does not take an age under 18.
		</p>
		{#if ACCOUNTS.on}
			<p>
				This website is not directed at children. An account on it is <a href="#adults">for adults only</a>, and
				without an account the site itself collects nothing from anyone.
			</p>
		{:else}
			<p>This website is not directed at children, and the site itself collects nothing from anyone.</p>
		{/if}
	</section>

	<section id="your-rights" class="prose">
		<h2>Your rights, and who to ask</h2>
		{#if ACCOUNTS.on}
			<p>
				Depending on where you live, the law may give you rights over data that is held about you: to see it, to have
				it corrected, to have it deleted, to take it with you, to take back an agreement you gave.
			</p>
			<p>
				Without an account, the site's owner holds no data about you to show, correct or delete. Walka's files are on
				your own computer, and the pages of this website collect nothing.
			</p>
			<p>
				With an account, you do most of it yourself, on <a href={resolve('account/')}>your account page</a>, at any time
				and without asking anybody:
			</p>
			<ul>
				<li><strong>See it, and take it with you:</strong> <em>Save everything as a file</em>.</li>
				<li><strong>Correct it:</strong> change it where you entered it.</li>
				<li><strong>Delete it:</strong> a single entry, or the whole account (<em>Delete my account...</em>).</li>
				<li>
					<strong>Take back your agreement</strong> to your body numbers and your food diary being kept
					(<em>Take back my agreement...</em>).
				</li>
			</ul>
			<p>
				How each of them works, and what is left afterwards, is under
				<a href="#take-out-delete">Taking it out, and deleting it</a>.
			</p>
			<p>
				Where the law gives you these rights, it also lets you complain to the data-protection authority of the place
				where you live. You do not have to write to the site first.
			</p>
			<p>Who to ask:</p>
		{:else}
			<p>
				Depending on where you live, the law may give you rights over data that is held about you: to see it, to have it
				corrected, to have it deleted. Today the site's maker holds no data about you to show, correct or delete. Walka's
				files are on your own computer, and this website collects nothing.
			</p>
		{/if}
		<ul>
			{#if ACCOUNTS.on}
				<li>
					<strong>About your account, or about privacy, in private:</strong>
					{#if CONTACT}write to <a href="mailto:{CONTACT}">{CONTACT}</a>.{:else}no address is set in this build.{/if}
					The site's owner reads it. Use it for anything your account page does not do.
				</li>
			{/if}
			<li>
				<strong>For what the host keeps</strong> - GitHub's logs - ask GitHub. Start with its
				<a href={GITHUB_PRIVACY}>privacy statement</a>.
			</li>
			<li>
				<strong>For a question about this page or this site,</strong> open an issue in the
				<a href={LINKS.websiteIssues}>website's issue tracker</a>. Questions about Walka go to
				<a href={LINKS.issues}>Walka's issue tracker</a>. Both are public, so do not post private details there.
			</li>
			<li>
				<strong>For a security matter,</strong> use GitHub's
				<a href={LINKS.reportVulnerability}>private vulnerability report</a>. Only the maintainer sees it.
			</li>
		</ul>
		{#if ACCOUNTS.on}
			<p>
				Walka is a hobby project with one maintainer, who is also the owner of this site and answers for its accounts.
				There is no company behind it. An issue or a report is written with a GitHub account and kept by GitHub.
			</p>
			<p>
				Walka sends nothing about you to its maker. What reaches the maker is what you put on GitHub yourself, what you
				write to the address above, and what you put into an account.
			</p>
		{:else}
			<p>
				Walka is a hobby project with one maintainer. There is no company behind it, and no published contact e-mail. An
				issue or a report is written with a GitHub account and kept by GitHub. Neither Walka nor this website sends
				anything about you to Walka's maker: what reaches the maker is what you put on GitHub yourself.
			</p>
		{/if}
	</section>

	<section id="changes" class="prose">
		<h2>Changes to this page</h2>
		{#if ACCOUNTS.on}
			<p>
				This page describes Walka and this website as they are on the date below. Every change to it is in the
				<a href={HISTORY}>website's public history</a> on GitHub. Before anything about accounts changes - what is
				kept, who sees it, a company that is added - this page is changed first, and its date with it.
			</p>
		{:else}
			<p>
				This page describes Walka and this website as they are on the date below. Every change to it is in the
				<a href={HISTORY}>website's public history</a> on GitHub. Before any of what is <a href="#planned">planned</a> is
				switched on, this page is updated first.
			</p>
		{/if}
		<p class="stamp">
			<strong>Last updated: <time datetime={UPDATED.iso}>{UPDATED.text}</time>.</strong>
		</p>
	</section>
</Article>

<style>
	/* The date, under the sentence at the top of the page (as on the terms page). */
	.updated {
		margin-top: 0.35rem;
		color: var(--ink-3);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	/* ------------------------------------------------- the short version
	 *
	 * A raised band between the top of the page and the article, on the
	 * article's two columns (see Article.svelte): the statements stand where
	 * the text will be, the sentence that leads into the rest where the list
	 * of sections will be. On a narrow screen: the statements, then the
	 * sentence.
	 */

	.short {
		padding-block: clamp(2.5rem, 6vw, 4.5rem);
		border-bottom: 1px solid var(--line);
		background: var(--bg-raised);
	}

	.columns {
		display: grid;
		grid-template-columns: 15rem minmax(0, 1fr);
		gap: clamp(2rem, 6vw, 5.5rem);
		align-items: start;
	}

	.statements {
		grid-column: 2;
		grid-row: 1;
		max-width: var(--measure);
	}

	.short h2 {
		font-size: clamp(1.625rem, 1.4rem + 1vw, 2.125rem); /* as a heading of the article */
	}

	/* a line each, a little larger than the text; what is bold says it all */
	.points {
		margin-top: 1.4rem;
		border-bottom: 1px solid var(--line);
	}

	.points > li {
		position: relative;
		padding: 0.95rem 0 0.95rem 1.75rem;
		border-top: 1px solid var(--line);
		color: var(--ink-2);
		font-size: var(--text-lede);
		line-height: 1.5;
		text-wrap: pretty;
	}

	/* the small diamond of the site's lists */
	.points > li::before {
		content: '';
		position: absolute;
		left: 0.2rem;
		top: calc(0.95rem + 0.75em - 0.18em);
		width: 0.36em;
		height: 0.36em;
		background: var(--gold);
		transform: rotate(45deg);
	}

	/* in the manner of the article's list of sections */
	.rest {
		grid-column: 1;
		grid-row: 1;
		margin-top: 0.7rem;
		padding-left: 1rem;
		border-left: 1px solid var(--line-strong);
		font-size: var(--text-small);
		line-height: 1.65;
	}

	/* the name of a part stays in one piece */
	.rest a {
		white-space: nowrap;
	}

	/* ------------------------------------------------------ the three parts */

	.part + h2 {
		margin-top: 0.7rem;
	}

	/* the note that heads the third part: a little air under the heading */
	.not-built {
		margin-top: 1.2rem;
	}

	/* the first words of a part, a little larger */
	.lead {
		font-size: var(--text-lede);
		line-height: 1.55;
	}

	/* The headings of a long part, in one quiet line. */
	.in-part {
		margin-top: 1.9rem;
		padding-block: 0.9rem 1rem;
		border-block: 1px solid var(--line);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.in-part-label {
		color: var(--ink-3);
		font: 600 var(--text-label) / 1.4 var(--font-text);
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.in-part ul {
		columns: 2;
		column-gap: 2rem;
		margin-top: 0.35rem;
		padding-left: 0;
	}

	.in-part li {
		margin-top: 0;
		break-inside: avoid;
	}

	.in-part li::before {
		content: none;
	}

	.in-part a {
		display: block;
		padding-block: 0.3rem;
		text-decoration: none;
	}

	.in-part a:hover {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	/* -------------------------------------------- what it keeps, and where
	 *
	 * A place and what is kept there: side by side on a wide screen, one
	 * under the other on a narrow one.
	 */

	.kept {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: var(--text-small);
		line-height: 1.55;
	}

	.kept > div {
		display: grid;
		grid-template-columns: 14.5rem minmax(0, 1fr);
		gap: 0.6rem 1.5rem;
		padding: 1.15rem 1.25rem;
	}

	.kept > div + div {
		border-top: 1px solid var(--line);
	}

	.kept dt > strong,
	.kept dt > span {
		display: block;
	}

	.kept dt > span {
		margin-top: 0.3rem;
	}

	.kept dd {
		display: grid;
		gap: 0.6em;
	}

	/* The date again, under "Changes": set apart by a fine gold rule. */
	.stamp {
		padding-left: 1rem;
		border-left: 2px solid var(--gold-soft);
	}

	@media (max-width: 60rem) {
		.columns {
			grid-template-columns: minmax(0, 1fr);
			gap: 1.5rem;
		}

		.statements,
		.rest {
			grid-column: 1;
			grid-row: auto;
		}

		.rest {
			max-width: var(--measure);
			margin-top: 0;
			padding-left: 0;
			border-left: 0;
			font-size: var(--text-body);
		}
	}

	@media (max-width: 40rem) {
		.in-part ul {
			columns: 1;
		}

		/* rows to put a thumb on */
		.in-part a {
			padding-block: 0.5rem;
		}

		.kept > div {
			grid-template-columns: minmax(0, 1fr);
			padding: 1.1rem 1.1rem 1.2rem;
		}
	}
</style>
