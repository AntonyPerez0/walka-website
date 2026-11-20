<script lang="ts">
	import { resolve } from '$app/paths';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { LINKS } from '#lib/site.ts';

	// The date of the last change to the words of this page. It stands at the
	// top and again under "Changes": change it whenever the text changes.
	const UPDATED = { iso: '2026-11-20', text: '20 November 2026' };

	const GITHUB_PRIVACY = 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement';
	// what has changed on this page, and when
	const HISTORY = `${LINKS.websiteRepo}/commits/HEAD/src/routes/privacy/+page.svelte`;

	// "The short version" stands above the article, so it is not in its list.
	const SECTIONS = [
		{ id: 'walka', label: 'Walka, the program' },
		{ id: 'this-website', label: 'This website' },
		{ id: 'planned', label: 'What is planned' },
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
</script>

<Seo
	title="Privacy"
	description="Walka uploads nothing, and this website has no accounts, no cookies, no analytics and no advertising. What is kept, where, and what is planned."
/>

<PageHero label="Nothing is uploaded" title="Privacy">
	<p>
		Walka runs on your computer and uploads nothing. This website has no accounts, no cookies and no analytics - the
		rest is below, in plain words.
	</p>
	<p class="updated">Last updated: <time datetime={UPDATED.iso}>{UPDATED.text}</time></p>
</PageHero>

<!-- The short version: a raised band on the article's own two columns (as on
     the terms page) - the statements where the text will be, and the way
     into the rest of the page where the list of sections will be. -->
<section class="short" id="short-version" aria-labelledby="short-version-title">
	<div class="container columns">
		<div class="statements">
			<h2 id="short-version-title">The short version</h2>
			<ul class="points">
				<li><strong>Walka uploads nothing.</strong> What it records stays on your computer.</li>
				<li><strong>This website has no accounts, no cookies, no analytics and no advertising.</strong></li>
				<li>
					<strong>GitHub hosts the site and the downloads.</strong> Opening a page asks no other company for anything.
				</li>
				<li><strong>The site's maker gets no visitor statistics</strong> and holds no data about you.</li>
				<li>
					<strong>Accounts are planned for later, and are not built.</strong> If they come, they will be opt-in, private
					by default, and yours to export and delete.
				</li>
			</ul>
		</div>

		<p class="rest">
			The rest of this page says the same at length, in three parts: <a href="#walka">Walka, the program</a>,
			<a href="#this-website">this website</a> as it is today, and <a href="#planned">what is planned</a>.
		</p>
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
				<dt><strong>Your browser</strong></dt>
				<dd>
					<p>
						Your choices on the dashboard's Share page, and whether <em>Getting started</em> is hidden - in the
						browser's own storage for the dashboard's address.
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
			The dashboard is a page that Walka itself serves on your computer, at <code>127.0.0.1:8787</code>. It is only
			reachable from the computer itself: it shows your walks, weight and height and has no password, so it is not
			offered to other devices on your network.
		</p>
		<p>
			The page loads nothing from anywhere else. In its own words: &quot;Runs on this computer. Nothing is
			uploaded.&quot;
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
			On a Mac, macOS asks before a program may look at the screen. Walka runs inside Terminal, so the permission is
			asked for, and given to, <strong>Terminal</strong>. You can change it later under
			<em>System Settings → Privacy &amp; Security → Screen &amp; System Audio Recording</em>.
		</p>

		<h3 id="share-picture">The Share picture</h3>
		<p>
			The dashboard's Share page turns your journey into a picture you can post. It is
			<a href="{resolve('how-it-works/')}#private-by-default">private by default</a>:
		</p>
		<ul>
			<li>
				The picture is drawn in your browser from numbers that are already on your computer. Nothing is uploaded and
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
		<p>
			Only what you take out yourself: a Share picture you post, a walk you download as a TCX file and import somewhere
			by hand, a probe report you attach to an issue. From then on it is with the place you gave it to, under that
			place's rules.
		</p>
		<p>
			If you find a way to read what Walka stores from outside the computer, or to make Walka send anything anywhere,
			that is a security problem. Please <a href={LINKS.reportVulnerability}>report it in private</a>.
		</p>
	</section>

	<section id="this-website" class="prose">
		<p class="label part">Part two</p>
		<h2>This website</h2>
		<p class="lead">
			This site is plain files. It has no accounts, no forms, no comments, no cookies, no analytics, no advertising, no
			trackers and no social-media widgets.
		</p>
		<p>
			Everything a page needs - fonts, scripts, pictures - is served by the site itself. Opening a page asks no other
			company for anything.
		</p>

		{@render inPart('This website', IN_WEBSITE)}

		<h3 id="host">Who hosts it, and what a host sees</h3>
		<p>
			The files are kept in a <a href={LINKS.websiteRepo}>public repository</a> on GitHub, built by a GitHub Actions
			workflow and served by GitHub Pages.
		</p>
		<p>
			Like any web host, GitHub receives your IP address and your browser's details when a page is fetched, and may keep
			logs. The site's maker cannot see those logs and gets no visitor statistics. What GitHub does with them is in
			<a href={GITHUB_PRIVACY}>GitHub's privacy statement</a>.
		</p>

		<h3 id="in-your-browser">What is kept in your browser</h3>
		<p>
			The site sets no cookies. One thing about you is kept in your own browser: your choice of light or dark, if you
			use the switch. It is in the browser's local storage under the name <code>walka-theme</code>, and it is never sent
			anywhere.
		</p>
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

	<section id="planned" class="prose">
		<p class="label part">Part three</p>
		<h2>What is planned: accounts and food tracking</h2>
		<div class="not-built">
			<Callout kind="note" title="Not built yet">
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

	<section id="children" class="prose">
		<h2>Children</h2>
		<p>
			Walka is for adults only. Its <a href={LINKS.disclaimer}>disclaimer</a> says so, and the dashboard's body profile
			does not take an age under 18.
		</p>
		<p>This website is not directed at children, and the site itself collects nothing from anyone.</p>
	</section>

	<section id="your-rights" class="prose">
		<h2>Your rights, and who to ask</h2>
		<p>
			Depending on where you live, the law may give you rights over data that is held about you: to see it, to have it
			corrected, to have it deleted. Today the site's maker holds no data about you to show, correct or delete. Walka's
			files are on your own computer, and this website collects nothing.
		</p>
		<ul>
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
		<p>
			Walka is a hobby project with one maintainer. There is no company behind it, and no published contact e-mail. An
			issue or a report is written with a GitHub account and kept by GitHub. Neither Walka nor this website sends
			anything about you to Walka's maker: what reaches the maker is what you put on GitHub yourself.
		</p>
	</section>

	<section id="changes" class="prose">
		<h2>Changes to this page</h2>
		<p>
			This page describes Walka and this website as they are on the date below. Every change to it is in the
			<a href={HISTORY}>website's public history</a> on GitHub. Before any of what is <a href="#planned">planned</a> is
			switched on, this page is updated first.
		</p>
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
