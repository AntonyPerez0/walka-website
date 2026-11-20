<script lang="ts">
	import { asset, resolve } from '$app/paths';
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
		{ id: 'accounts', label: 'Accounts, later' },
		{ id: 'changes', label: 'Changes' }
	];
</script>

<Seo
	title="Terms of use"
	description="Plain terms for using the Walka website - free to read, no account, no warranty, no medical advice. Walka itself has its own disclaimer and licence."
/>

<PageHero label="The small print" title="Terms of use">
	<p>
		A few plain rules for using this website. Walka the program has its own disclaimer, and that is the one to read
		before your first walk.
	</p>
	<p class="updated">Last updated: <time datetime={UPDATED.iso}>{UPDATED.text}</time></p>
</PageHero>

<ShortVersion linksLabel="Disclaimer and licences" links={DOCUMENTS}>
	<li>This site is free to read, and you need no account.</li>
	<li>It is provided as is, with no warranty.</li>
	<li>
		Nothing on it is medical advice, a promise that Walka will work without fault, or a promise that walking while you
		play is safe.
	</li>
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
		<p>The site is free to read, and you need no account.</p>
		<p>
			The downloads are files on GitHub, and
			<a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service">GitHub's own terms</a> apply
			there.
		</p>
		<p>Be reasonable: do not attack the site, try to break it or overload it.</p>
	</section>

	<section id="not-advice" class="prose">
		<h2>No medical advice, no safety promises</h2>
		<p>
			Everything this site and Walka say about calories, steps and heart rate is an estimate, for interest only. It is
			not medical advice. Do not use it to decide anything about your health, your diet, your medication or your
			training.
		</p>
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
	</section>

	<section id="links" class="prose">
		<h2>Links to other sites</h2>
		<p>
			This site links to other sites - GitHub first of all, where Walka's own pages and files are. Those sites are not
			Walka's: what else is on them, and what they do when you visit, is theirs to answer for.
		</p>
	</section>

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

	<section id="changes" class="prose">
		<h2>Changes</h2>
		<p>
			These terms may change. The date below is that of the last change, and
			<a href={WEBSITE.history}>the history</a> is public in the
			<a href={LINKS.websiteRepo}>website's repository</a> on GitHub.
		</p>
		<p class="stamp">
			<strong>Last updated: <time datetime={UPDATED.iso}>{UPDATED.text}</time>.</strong>
		</p>
		<p>
			A question about these terms or this site? Open an issue in the
			<a href={LINKS.websiteIssues}>website's issue tracker</a>. Questions about Walka go to
			<a href={LINKS.issues}>Walka's issue tracker</a>. Both are public; a security problem in Walka is
			<a href={LINKS.reportVulnerability}>reported in private</a> instead.
		</p>
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
