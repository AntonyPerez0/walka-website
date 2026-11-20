<script lang="ts">
	// This page is built two ways, like the privacy page, and each must say
	// only what is true of it. WITHOUT accounts (no SUPABASE_URL at build
	// time: src/env.ts) the section "Accounts, later" says that there are
	// none. WITH accounts it is "Accounts", and holds their rules. Every
	// sentence about accounts stands inside {#if ACCOUNTS.on} ... {:else} ...
	// {/if}: after changing either side, build both ways and read both.
	import { CONTACT } from '$app/env/public';
	import { asset, resolve } from '$app/paths';
	import { ACCOUNTS, WAY_NAMES, type Way } from '#lib/account/config.ts';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import ShortVersion from '#lib/components/terms/ShortVersion.svelte';
	import { LINKS } from '#lib/site.ts';

	// The date of the last change to the words of this page. It stands at the
	// top and again under "Changes": change it whenever the text changes.
	const UPDATED = { iso: '2026-11-20', text: '20 November 2026' };

	// The website's own files on GitHub.
	const WEBSITE = {
		licence: `${LINKS.websiteRepo}/blob/HEAD/LICENSE`,
		notices: `${LINKS.websiteRepo}/blob/HEAD/THIRD-PARTY-NOTICES.md`,
		// what has changed on this page, and when
		history: `${LINKS.websiteRepo}/commits/HEAD/src/routes/terms/+page.svelte`
	};

	// The documents this page points to, beside the short version.
	const DOCUMENTS = [
		{ label: 'The disclaimer', href: LINKS.disclaimer },
		{ label: "Walka's LICENSE", href: LINKS.licence },
		{ label: "The website's LICENSE", href: WEBSITE.licence }
	];

	// "The short version" stands above the article, so it is not in its list.
	const SECTIONS = [
		{ id: 'what-this-covers', label: 'What these terms cover' },
		{ id: 'using-the-site', label: 'Using the site' },
		{ id: 'not-advice', label: 'No medical advice' },
		{ id: 'no-warranty', label: 'As is, with no warranty' },
		{ id: 'names', label: 'Names and trademarks' },
		{ id: 'licence', label: 'Licence' },
		{ id: 'links', label: 'Links to other sites' },
		{ id: 'accounts', label: ACCOUNTS.on ? 'Accounts' : 'Accounts, later' },
		{ id: 'changes', label: 'Changes' }
	];

	const DESCRIPTION = ACCOUNTS.on
		? 'Plain terms for using the Walka website - free to read, an account only if you want one, no warranty, no medical advice. Walka itself has its own disclaimer and licence.'
		: 'Plain terms for using the Walka website - free to read, no account, no warranty, no medical advice. Walka itself has its own disclaimer and licence.';

	// The ways to sign in that this build has switched on (SIGN_IN).
	const byEmail = ACCOUNTS.ways.includes('email');
	const otherSites = ACCOUNTS.ways.filter((way): way is Exclude<Way, 'email'> => way !== 'email').map((way) => WAY_NAMES[way]);
	/** "Discord", "Discord or Google", "Discord, Google or GitHub" */
	const oneOf = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`);

	// The two public lists the food diary looks foods up in, and their terms.
	const FOOD_LISTS = {
		openFoodFacts: 'https://openfoodfacts.org',
		odbl: 'https://opendatacommons.org/licenses/odbl/1-0/',
		usda: 'https://fdc.nal.usda.gov'
	};
</script>

<Seo title="Terms of use" description={DESCRIPTION} />

<PageHero label="The small print" title="Terms of use">
	<p>
		A few plain rules for using this website. Walka the program has its own disclaimer, and that is the one to read
		before your first walk.
	</p>
	<p class="updated">Last updated: <time datetime={UPDATED.iso}>{UPDATED.text}</time></p>
</PageHero>

<ShortVersion linksLabel="Disclaimer and licences" links={DOCUMENTS}>
	<li>This site is free to read, and you need no account.</li>
	{#if ACCOUNTS.on}
		<li>
			An account is free, for adults, and only if you want one: private until you say otherwise, and yours to take out
			and to delete.
		</li>
		<li>
			The site and its accounts are provided as is, with no warranty. Accounts may be unavailable, and may end - with
			notice on this page, and time to take your data out.
		</li>
		<li>
			Nothing on it is medical advice, a promise that Walka will work without fault, or a promise that walking while you
			play is safe. Calorie figures, for food as for walks, are estimates.
		</li>
	{:else}
		<li>It is provided as is, with no warranty.</li>
		<li>
			Nothing on it is medical advice, a promise that Walka will work without fault, or a promise that walking while you
			play is safe.
		</li>
	{/if}
	<li>
		Walka is a fan-made tool, not Blizzard's, and you use it at your own risk: see the
		<a href={LINKS.disclaimer}>disclaimer</a>.
	</li>
</ShortVersion>

<Article sections={SECTIONS}>
	<section id="what-this-covers" class="prose">
		<h2>What these terms cover</h2>
		<p>
			These terms are for this website. Walka itself - the program and the game addon - has its own
			<a href={LINKS.disclaimer}>disclaimer</a> and <a href={LINKS.licence}>licence</a>.
		</p>
		<Callout kind="caution" title="You use Walka at your own risk">
			<p>
				By downloading, installing or using Walka you accept that. Walka only listens to your treadmill - it cannot
				start, stop or change the speed of the belt - but you still walk on a treadmill while you look at a game. Walka
				is experimental and not yet tried on a real walking pad, it comes with no warranty, and it is not a safety
				device or a medical device. Read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.
			</p>
		</Callout>
		<p>Where this page and the disclaimer differ about Walka, the disclaimer counts.</p>
	</section>

	<section id="using-the-site" class="prose">
		<h2>Using the site</h2>
		{#if ACCOUNTS.on}
			<p>
				The site is free to read, and you need no account. An account is for the two things that need one - sharing
				your walking progress, and the food diary - and its rules are under <a href="#accounts">Accounts</a>.
			</p>
		{:else}
			<p>The site is free to read, and you need no account.</p>
		{/if}
		<p>
			The downloads are files on GitHub, and
			<a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service">GitHub's own terms</a> apply
			there.
		</p>
		<p>Be reasonable: do not attack the site, try to break it or overload it.</p>
	</section>

	<section id="not-advice" class="prose">
		<h2>No medical advice, no safety promises</h2>
		{#if ACCOUNTS.on}
			<p>
				Everything this site and Walka say about calories, steps and heart rate is an estimate, for interest only -
				and so is every figure in the food diary. It is not medical advice. Do not use it to decide anything about your
				health, your diet, your medication or your training.
			</p>
		{:else}
			<p>
				Everything this site and Walka say about calories, steps and heart rate is an estimate, for interest only. It is
				not medical advice. Do not use it to decide anything about your health, your diet, your medication or your
				training.
			</p>
		{/if}
		<p>
			If you have a health condition, are pregnant or are in any doubt, ask a doctor first: see
			<a href="{resolve('safety/')}#before-you-use-it">Before you walk</a>.
		</p>
		<p>
			Nothing on this site is a promise that Walka will work without fault or without interruption with your treadmill,
			your computer or your Bluetooth. Walka has not yet been tried on a real walking pad: see
			<a href="{resolve('safety/')}#not-a-guarantee">what has and has not been verified</a>.
		</p>
		<p>
			And nothing on this site is a promise that walking while you play is safe. Walka is not a safety device. It only
			listens to your treadmill and cannot stop a belt: the treadmill's own stop button, remote and safety key are what
			stops it. Whether walking at a desk while playing is safe for you, for your treadmill and for the room you do it
			in is for you to decide.
		</p>
	</section>

	<section id="no-warranty" class="prose">
		<h2>As is, with no warranty</h2>
		<p>
			This site is provided as is and as available, without warranty of any kind: no promise that it is free of
			mistakes, up to date or always there.
		</p>
		{#if ACCOUNTS.on}
			<p>
				That holds for accounts as well: no promise that they are always there, or that what is in one is never lost.
				Walka's own files on your computer remain the record of your walks, and <em>Save everything as a file</em> on
				your account page gives you a copy of the rest.
			</p>
		{/if}
		<p>
			To the fullest extent the law permits, the site's maker and contributors are not liable for any claim, damage or
			loss arising from this site or the use of it.
		</p>
		<p>
			The law of some places does not allow all of this. Nothing on this page takes away a right that the law says
			cannot be taken away; where that is so, this section applies as far as the law allows.
		</p>
	</section>

	<section id="names" class="prose">
		<h2>Names and trademarks</h2>
		<p>
			Walka is a fan-made tool. It is not affiliated with or endorsed by Blizzard Entertainment, UREVO, WELLFIT or any
			other maker of treadmills. World of Warcraft is a trademark of Blizzard Entertainment, Inc.; the other names
			belong to their owners. They are used here only to say what Walka works with.
		</p>
		<p>
			This site uses no Blizzard artwork, logos or fonts, and no screenshots of the game: its design and pictures are
			Walka's own. So is the map on a Share picture; the names of the game and its continents on it are Blizzard
			Entertainment's.
		</p>
	</section>

	<section id="licence" class="prose">
		<h2>Licence</h2>
		<p>Walka's code and this website's code are both published under the MIT licence:</p>
		<ul class="licences">
			<li><a href={LINKS.licence}>Walka's LICENSE</a></li>
			<li><a href={WEBSITE.licence}>The website's LICENSE</a></li>
		</ul>
		<p>Each says the same &quot;as is, no warranty&quot; about the code.</p>
		<p>
			The fonts this site uses, Inter and Spectral, are open-licensed under the SIL Open Font License (<a
				href={asset('licences/Inter-OFL.txt')}>Inter's licence</a
			>, <a href={asset('licences/Spectral-OFL.txt')}>Spectral's licence</a>), and are listed with their licences in the
			website repository's <a class="together" href={WEBSITE.notices}>third-party notices</a>.
		</p>
		{#if ACCOUNTS.on}
			<p>
				The food diary looks foods up in two public lists, which have terms of their own: see
				<a href="#food-lists">The food lists</a>.
			</p>
		{/if}
	</section>

	<section id="links" class="prose">
		<h2>Links to other sites</h2>
		<p>
			This site links to other sites - GitHub first of all, where Walka's own pages and files are. Those sites are not
			Walka's: what else is on them, and what they do when you visit, is theirs to answer for.
		</p>
	</section>

	{#if ACCOUNTS.on}
	<section id="accounts" class="prose">
		<h2>Accounts</h2>
		<p>
			You need no account to read this site or to use Walka. An account is for sharing your walking progress and for
			the food diary, and these are its rules. What an account keeps, who sees it, and how to take it out or delete it
			is on the <a href="{resolve('privacy/')}#your-account">privacy page</a>.
		</p>
		<p>
			Nobody is signed up to anything by having read this page. An account, and these rules for it, begin when you
			sign in and tick <em>I am 18 or older, and I have read the terms and the privacy page</em>.
		</p>

		<h3 id="who-may-have-one">Who may have one</h3>
		<p>
			Adults. You must be 18 or older, and the first page of an account asks you to say so. One account for each
			person. An account is free, and there is nothing in it to buy.
		</p>

		<h3 id="signing-in">Signing in</h3>
		<p>
			There is no password.
			{#if byEmail && otherSites.length}
				You sign in with a six-digit code sent to your e-mail address, or through {oneOf(otherSites)}.
			{:else if byEmail}
				You sign in with a six-digit code sent to your e-mail address.
			{:else}
				You sign in through {oneOf(otherSites)}.
			{/if}
			Signing in for the first time makes the account.
		</p>
		<p>
			{#if byEmail && otherSites.length}
				Whoever can read your mail, or use your account at that other site, can sign in as you.
			{:else if byEmail}
				Whoever can read your mail can sign in as you.
			{:else}
				Whoever can use your account at that other site can sign in as you.
			{/if}
			Looking after that is yours to do: nobody here can do it for you.
		</p>

		<h3 id="names-and-your-page">Names, and your public page</h3>
		<p>
			Your account is private until you switch your page to public. A public page has a name in its address and a name
			shown on it. Keep both plain:
		</p>
		<ul>
			<li>
				not a name that could pass for this site, for Walka or for Blizzard, or for somebody who speaks for them - the
				database refuses the plain cases;
			</li>
			<li>not somebody else's name, used to pass for them;</li>
			<li>not a name that is meant to offend.</li>
		</ul>
		<p>
			A signed-in person can report a public page. The site's owner can hide a page that breaks this rule: the page is
			taken down, the account stays as it is, and the owner can put the page back.
		</p>
		<p>A name you give up is not handed to anybody else for 90 days.</p>

		<h3 id="what-you-put-in">What you put in</h3>
		<p>
			What you put into your account is yours. The site's owner claims no right to it, and uses it for nothing but
			showing it to you - and, on your public page, to those you chose to show it to.
		</p>
		<p>
			You answer for it. Put in your own walks and your own numbers, and nothing that is somebody else's to keep
			private.
		</p>
		<p>
			One account has room for 20,000 walks, 5,000 foods and 20,000 diary entries, and every number has a range it
			must be in. Do not try to fill the database, to get round its rules, or to reach anything that is not yours.
		</p>

		<h3 id="estimates">Estimates, not advice</h3>
		<p>
			Every calorie figure in an account is an estimate, for interest only - for food as for walks: what a walk
			burned, what a body burns at rest, what a food holds, what is left to walk off. None of it is medical advice.
		</p>
		<p>
			The food diary is not a diet plan. It says nothing about what anyone should eat, and the only goal in it is one
			you set yourself. If you are in any doubt about your health, ask a doctor first.
		</p>

		<h3 id="food-lists">The food lists</h3>
		<p>The food diary looks foods up in two public lists, and says with each result which list it came from:</p>
		<ul>
			<li>
				<strong><a href={FOOD_LISTS.openFoodFacts}>Open Food Facts</a>.</strong> Its database is made available under
				the <a href={FOOD_LISTS.odbl}>Open Database License</a>.
			</li>
			<li>
				<strong><a href={FOOD_LISTS.usda}>USDA FoodData Central</a>.</strong> Its data is in the public domain. The
				source, as it asks to be named: U.S. Department of Agriculture, Agricultural Research Service. FoodData
				Central, 2019. fdc.nal.usda.gov.
			</li>
		</ul>
		<p>
			Neither list is Walka's, and neither answers for what this site makes of it. A figure in a list can be wrong or
			out of date; so can one you type in yourself.
		</p>

		<h3 id="free-and-may-end">Free, and with no promise that it stays</h3>
		<p>Accounts are free, and they run on services that are free. So:</p>
		<ul>
			<li>
				<strong>They may be unavailable.</strong> When the database does not answer, the account pages say
				<em>Accounts are temporarily unavailable</em>. The rest of the site works as usual, and so does Walka.
			</li>
			<li>
				<strong>They may end.</strong> If accounts are closed for good, this page says so beforehand, and leaves you
				time to take your data out with <em>Save everything as a file</em>.
			</li>
		</ul>

		<h3 id="closing-an-account">Closing an account</h3>
		<p>
			You can delete your account at any time, on <a href={resolve('account/')}>your account page</a>, and need give no
			reason. The site's owner may close an account that breaks these terms.
		</p>
	</section>
	{:else}
	<section id="accounts" class="prose">
		<h2>Accounts, later</h2>
		<p>This site has no accounts today. They are planned for later, and not built yet.</p>
		<p>
			If they are added, terms for them will be added here, and the
			<a href={resolve('privacy/')}>privacy page</a> updated, before they open. Syncing and sharing will be opt-in, a
			profile will be private until its owner makes it public, and you will be able to export and delete your account
			and data yourself.
		</p>
		<p>Nobody is signed up to anything by having read this page.</p>
	</section>
	{/if}

	<section id="changes" class="prose">
		<h2>Changes</h2>
		<p>
			These terms may change. The date below is that of the last change, and
			<a href={WEBSITE.history}>the history</a> is public in the
			<a href={LINKS.websiteRepo}>website's repository</a> on GitHub.
		</p>
		{#if ACCOUNTS.on}
			<p>A change to the rules for accounts is on this page before it applies.</p>
		{/if}
		<p class="stamp">
			<strong>Last updated: <time datetime={UPDATED.iso}>{UPDATED.text}</time>.</strong>
		</p>
		{#if ACCOUNTS.on}
			<p>
				A question about these terms or this site? Open an issue in the
				<a href={LINKS.websiteIssues}>website's issue tracker</a>. Questions about Walka go to
				<a href={LINKS.issues}>Walka's issue tracker</a>. Both are public.
			</p>
			<p>
				For something private - about your account, or a way you found into somebody else's -
				{#if CONTACT}write to <a href="mailto:{CONTACT}">{CONTACT}</a>.{:else}see the
					<a href="{resolve('privacy/')}#your-rights">privacy page</a>.{/if}
				A security problem in Walka itself is <a href={LINKS.reportVulnerability}>reported in private</a> on GitHub.
			</p>
		{:else}
			<p>
				A question about these terms or this site? Open an issue in the
				<a href={LINKS.websiteIssues}>website's issue tracker</a>. Questions about Walka go to
				<a href={LINKS.issues}>Walka's issue tracker</a>. Both are public; a security problem in Walka is
				<a href={LINKS.reportVulnerability}>reported in private</a> instead.
			</p>
		{/if}
	</section>
</Article>

<style>
	/* The date, under the sentence at the top of the page. */
	.updated {
		margin-top: 0.35rem;
		color: var(--ink-3);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.licences a {
		font-weight: 550;
	}

	/* "third-party" is not to be broken at its hyphen */
	.together {
		white-space: nowrap;
	}

	/* The date again, under "Changes": set apart by a fine gold rule. */
	.stamp {
		padding-left: 1rem;
		border-left: 2px solid var(--gold-soft);
	}
</style>
