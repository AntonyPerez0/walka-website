<script lang="ts">
	import { resolve } from '$app/paths';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import DownloadOptions from '#lib/components/DownloadOptions.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import ThemedPicture from '#lib/components/ThemedPicture.svelte';
	import { detectPlatform, type Platform } from '#lib/platform.ts';
	import { isDate, latestRelease, type Release } from '#lib/release.ts';
	import { DOWNLOADS, LINKS } from '#lib/site.ts';

	const SECTIONS = [
		{ id: 'before-you-download', label: 'Before you download' },
		{ id: 'what-you-need', label: 'What you need' },
		{ id: 'which-treadmills-work', label: 'Which treadmills work' },
		{ id: 'first-time', label: 'Opening it for the first time' },
		{ id: 'is-the-download-safe', label: 'Is the download safe?' },
		{ id: 'free', label: 'Free, and stays free' }
	];

	// Which system the visitor is on (a guess from the browser), and which
	// release is the latest (asked from GitHub). Both only add to the page:
	// without them every download is there, as plain links.
	let platform = $state<Platform | null>(null);
	let release = $state<Release | null>(null);

	$effect(() => {
		platform = detectPlatform();
		latestRelease().then((found) => (release = found));
	});

	// (the date is looked at once more here: an answer kept in the tab from
	// before may hold anything)
	const published = $derived.by(() => {
		const when = release?.published;
		return isDate(when) ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(when)) : '';
	});
</script>

<Seo
	title="Downloads for Windows and Mac"
	description="Download Walka for Windows or Mac, and the game addon - free, experimental and at your own risk. How to open it the first time and how to check the file."
/>

<PageHero label="Free for Windows and Mac" title="Download Walka">
	<p>
		The program for your computer, and the addon for the game. Experimental, and at your own risk - it has not yet been
		tried on a real walking pad.
	</p>
</PageHero>

<section class="get" id="get-walka" aria-labelledby="get-walka-title">
	<div class="container">
		<h2 id="get-walka-title" class="visually-hidden">The downloads</h2>
		<p class="intro">
			Walka is two pieces: a program on your computer and an addon in the game. You need both: the addon knows which
			character you are playing, and the program listens to your walking pad. One download is enough, though - the
			program carries a copy of the addon and can put it in the game for you.
		</p>

		{#if platform === 'other'}
			<p class="elsewhere">Walka is a program for Windows and for Mac. The files below are for that computer.</p>
		{/if}

		<DownloadOptions {release} />

		<div class="in-short">
			<h3 class="visually-hidden" id="in-short">In short</h3>
			<p>
				<span class="i"><Icon name="bluetooth" size={22} /></span>
				<span>
					<strong>Walka only listens to your treadmill.</strong> It cannot start, stop or change the speed of the belt:
					you do that at the treadmill itself.
				</span>
			</p>
			<p>
				<span class="i warn"><Icon name="warning" size={22} /></span>
				<span>
					<strong>Experimental:</strong> not yet tried on a real walking pad. Walking while you play is at your own risk -
					read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.
				</span>
			</p>
			<p>
				<span class="i"><Icon name="shield" size={22} /></span>
				<span>
					<strong>Is it safe to open?</strong> It is a program from the internet that your computer does not recognise,
					so it is right to ask. Every release is scanned for viruses by Microsoft Defender before it is published, and
					it is built in the open by GitHub from public code. A scan that finds nothing is not proof that a file is
					harmless, so there is more to go on, and there are ways to check your own download:
					<a href="#is-the-download-safe">Is the download safe?</a>
				</span>
			</p>
			<p>
				<span class="i"><Icon name="check" size={22} /></span>
				<span>
					<strong>Always the latest release.</strong> These links always give the latest release. A published release
					is never replaced: a fix is a new version, and older versions are not fixed.
					<span class="release" aria-live="polite">
						{#if release}
							<a href={LINKS.latestRelease}>Latest release</a>: Walka {release.version}{#if published}, published {published}{/if}.
						{:else}
							Which version these links give, and when it was published, is on the
							<a href={LINKS.latestRelease}>latest release page</a>.
						{/if}
					</span>
				</span>
			</p>
		</div>

		<div class="notes prose">
			<p>
				<strong>Not sure which Mac you have?</strong> <em>Apple menu → About This Mac</em> says which:
				<em>Chip: Apple M...</em> is <a href={DOWNLOADS.macAppleSilicon}><code>Walka-mac-apple-silicon.zip</code></a>,
				<em>Processor: ... Intel ...</em> is <a href={DOWNLOADS.macIntel}><code>Walka-mac-intel.zip</code></a>. Inside
				each zip is one file, <code>Walka</code>, and that is what you open. The Mac version is new and has not been tried
				with the game on a real Mac yet: see <a href="#before-you-download">Before you download</a>.
			</p>
			<p>
				<strong>The addon, by hand.</strong> You do not have to download it yourself: Walka can put it in the game for
				you, with <em>Install</em> under <em>Getting started</em> on the dashboard. The download is for doing it by hand.
				Unzip it into <code>World of Warcraft\_forever_\Interface\AddOns</code> (on a Mac:
				<code>/Applications/World of Warcraft/_forever_/Interface/AddOns/</code>), so that there is a
				<code>Walka</code> folder in it. Then start the game and tick <em>Walka</em> in the AddOns list.
			</p>
			<p>
				<strong>Have a version of Walka that moved the belt?</strong> The versions that could start a belt, change its
				speed and stop it have been withdrawn, and their downloads removed: do not use one. Replace it with the current
				one and delete the old <code>Walka.exe</code>. Your walks and settings are kept (the settings that were about
				steering the belt are simply no longer read), and the addon is updated with <em>Install</em> on the dashboard.
			</p>
			<p class="fine">
				To show the latest version's number and date, this page asks GitHub which Walka release is the latest. The buttons themselves are
				links to files on GitHub. More on the <a href={resolve('privacy/')}>privacy page</a>.
			</p>
		</div>
	</div>
</section>

<Article sections={SECTIONS}>
<section id="before-you-download" class="prose">
<h2>Before you download</h2>
<Callout kind="warning" title="Early version - not yet tried on a real walking pad">
<p>The pad and the game have not been tested against this code. Read <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a>.</p>
</Callout>
<Callout kind="caution" title="Walking while you play is at your own risk">
<p>Your eyes are on a game, not on your feet. Walka comes with no warranty, and it is not a safety device or a medical device. If you have a health condition, are pregnant or are in any doubt, ask a doctor first - and stop if you feel dizzy or unwell. The whole of it: <a href={LINKS.disclaimer}>the disclaimer</a>.</p>
</Callout>
<Callout kind="warning" title="The Mac version is new">
<p>GitHub&#39;s Macs build it, run its tests and check that the finished program starts, records a walk on a simulated pad and saves it when it is closed. Nobody has yet tried it with the game and a walking pad on a real Mac. Do everything under <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a> - and if you do, <a href={LINKS.issues}>say how it went</a>.</p>
</Callout>
<h3 id="what-walka-is">What Walka is, and is not</h3>
<ul>
<li><strong>A notebook, not a remote control.</strong> Walka reads what your treadmill reports over Bluetooth - speed, distance, on some pads steps - and writes your walks down. It has no way to start or stop a belt or to change its speed, and it sends the treadmill no commands (the safety page says <a href="{resolve('safety/')}#made-sure">how that is made sure of</a>). Earlier versions did drive the belt. They have been withdrawn: do not use one.</li>
<li><strong>A free hobby project, and an early one.</strong> Its author has not yet run it against a physical treadmill.</li>
<li><strong>Not a safety device.</strong> Walka cannot stop a belt. The treadmill&#39;s own stop button, remote and safety key are what stops it - keep them within reach.</li>
<li><strong>Not a medical device, and not medical advice.</strong> Calories, steps, heart rate and everything worked out from them are estimates, for interest only. Do not use them to decide anything about your health, your diet, your medication or your training.</li>
<li><strong>Not made, tested or approved by the maker of your treadmill.</strong> Walka connects to the treadmill the way a fitness app does, to read its numbers. Most treadmills accept one such connection at a time, so the maker&#39;s own app cannot be connected while Walka is.</li>
<li><strong>Not approved by Blizzard.</strong> See <a href="{resolve('faq/')}#is-this-allowed">Is this allowed by Blizzard?</a></li>
<li><strong>For adults.</strong> Keep children and pets away from the treadmill, and stop the belt when you step off.</li>
</ul>
<p>By downloading, installing or using Walka you accept that you do so at your own risk. Whether walking at a desk while playing is safe for you, for your treadmill and for the room you do it in is for you to decide - and so is whether to let anyone else do it on your equipment.</p>
</section>

<section id="what-you-need" class="prose">
<h2>What you need</h2>
<ul>
<li><strong>A computer with Bluetooth.</strong> Windows 11 (Windows 10 generally works) with Bluetooth 4.0 / &quot;LE&quot; or newer - or a Mac, with an Apple chip or an Intel processor and a recent macOS.</li>
<li><strong>A walking pad or treadmill that shows its numbers to apps over Bluetooth:</strong> a UREVO Strol 2E, a WELLFIT TM029 Pro, or another Bluetooth FTMS treadmill - see <a href="#which-treadmills-work">which treadmills work</a>. It has to be switched on, <strong>not</strong> paired in the computer&#39;s Bluetooth settings, and with its own phone app <strong>closed</strong> (most accept one connection at a time).</li>
<li><strong>World of Warcraft: Forever</strong>, in <em>Windowed</em> or <em>Windowed (Fullscreen)</em> mode, with the top-left corner of the game visible.</li>
</ul>
<p>Playing another game, or none? Then you need the program only, not the addon, and there is nothing to set up: Walka records a walk whenever the belt moves. Start the belt with the treadmill&#39;s remote and play anything, or nothing. Such a walk is in the dashboard&#39;s history as <em>No game session</em>, and in your totals.</p>
</section>

<section id="which-treadmills-work" class="prose">
<h2>Which treadmills work</h2>
<p>Walka reads <strong>Bluetooth FTMS</strong>, the standard that fitness apps use to show a treadmill&#39;s speed and distance. If an app other than the maker&#39;s own can <em>show the speed</em> of your treadmill, Walka very likely can too. The treadmill does not have to be one that apps can control: Walka controls nothing.</p>
<div class="table">
<table>
	<thead><tr><th scope="col">Treadmill</th><th scope="col">How Walka finds it</th><th scope="col">What is known</th></tr></thead>
	<tbody>
		<tr><th scope="row"><strong>UREVO Strol 2E</strong> and other UREVO pads</th><td>By name (<code>URTM...</code>), at once</td><td>Other open-source projects read it the same way.</td></tr>
		<tr><th scope="row"><strong>WELLFIT TM029 Pro</strong> and other WELLFIT treadmills</th><td>By name (<code>WELLFIT TM Linker</code>), at once</td><td>Another open-source project works with a WELLFIT over FTMS.</td></tr>
		<tr><th scope="row"><strong>Any other FTMS treadmill</strong></th><td>By what it advertises, after a 15-second scan - or pick it yourself: dashboard → <em>Treadmill → Scan</em></td><td>Depends on the treadmill. Check its numbers as in <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a>.</td></tr>
	</tbody>
</table>
</div>
<p><strong>None of these has been tried by Walka&#39;s author on the real machine yet</strong> - the warning at the top of this page is for all of them. Details and sources: <a href={LINKS.hardware}>the hardware notes</a>.</p>
<h3 id="things-to-know">Things to know</h3>
<ul>
<li><strong>The speed is yours.</strong> Walka sets none and limits none. How fast you walk is between you and the treadmill. That goes for the incline too, on any treadmill: Walka does not touch it.</li>
<li><strong>One connection at a time.</strong> Most treadmills talk to one app. While Walka is connected, the maker&#39;s phone app cannot be - and the other way round.</li>
<li><strong>Walka remembers your treadmill.</strong> After the first connection it only reconnects to that one, so that a neighbour&#39;s walk is never counted as yours. <em>Forget this treadmill</em> on the dashboard lets you move to another.</li>
</ul>
<h3 id="what-will-not-work">What will not work</h3>
<p>Treadmills that only talk to their maker&#39;s app in a private language (many NordicTrack / iFIT machines, the older KingSmith WalkingPads), and bikes or rowers - Walka only reads treadmills.</p>
<h3 id="probe">Is yours not listed, or not behaving?</h3>
<p>Run <code>Walka.exe probe</code> (on a Mac: <code>Walka probe</code>) with the treadmill on. Like Walka itself it only listens: it sends the treadmill no commands. The one thing it writes is the switch that turns notifications on. It listens while you operate the treadmill with its remote, and saves a small text report - the window says where.</p>
<p>On a Mac a command is typed in Terminal: drag the <code>Walka</code> file into a Terminal window, type a space and <code>probe</code>, press Return.</p>
<p><a href={LINKS.issues}>Open an issue</a> with that report and the treadmill&#39;s make and model, and it can be added.</p>
<p>The saved report is made to be posted in public.</p>
<ul>
<li><strong>What is in it:</strong> the treadmill&#39;s Bluetooth name, the services it offers, its speed range and what it says it can do, and what it sent while you used the remote.</li>
<li><strong>What is left out:</strong> every Bluetooth device in range that is not a fitness machine - the headphones, watches and televisions, yours or a neighbour&#39;s - is counted, not named. Addresses are cut short, and the treadmill&#39;s serial number is not in it.</li>
<li><strong>The window the probe runs in shows everything:</strong> that is for your eyes. Post the file, not a screenshot of the window.</li>
</ul>
<Callout kind="note" title="The maker of your treadmill has not made, tested or approved Walka">
<p>Walka connects to the treadmill the way a fitness app does, to read its numbers. It is a fan-made tool, not affiliated with or endorsed by UREVO, WELLFIT or any other maker of treadmills.</p>
</Callout>
</section>

<section id="first-time" class="prose">
<h2>Opening it for the first time</h2>
<p>Your computer does not recognise Walka, so the first time it may stop and warn you before it opens it. This is what you may see and what to click. What those messages mean, and do not mean, is under <a href="#the-warnings">Is the download safe?</a></p>
<p>Walka is experimental, and you use it at your own risk. Read the <a href={LINKS.disclaimer}>disclaimer</a> first.</p>
<h3 id="first-time-windows">On Windows</h3>
<ol>
<li><strong>Download <code>Walka.exe</code>.</strong> It goes to your <em>Downloads</em> folder. If the browser says it &quot;isn&#39;t commonly downloaded&quot;, choose <strong>Keep</strong> (in Edge: <strong>...</strong> → <strong>Keep</strong> → <strong>Show more</strong> → <strong>Keep anyway</strong>).</li>
<li><strong>Double-click it.</strong> The first time, Windows may say <em>&quot;Windows protected your PC&quot;</em>. Click <strong>More info</strong>, then <strong>Run anyway</strong>.</li>
<li><strong>A black window opens: that is Walka.</strong> Leave it open while you walk - closing it ends the recording (the belt is not touched). The <em>dashboard</em> page opens in your browser (if not, go to <code>127.0.0.1:8787</code>).</li>
</ol>
<h3 id="first-time-mac">On a Mac</h3>
<ol>
<li><strong>Download the zip for your Mac</strong> - Apple chip or Intel, <a href="#mac">as above</a>.</li>
<li><strong>Open the zip</strong> (double-click it in <em>Downloads</em>). Inside is one file, <code>Walka</code>.</li>
<li><strong>Double-click <code>Walka</code>.</strong> The first time, macOS refuses: <em>&quot;Apple could not verify Walka is free of malware&quot;</em>. Click <strong>Done</strong>, open <strong>System Settings → Privacy &amp; Security</strong>, scroll down to <em>Security</em> and click <strong>Open Anyway</strong> next to Walka. (On macOS 14 and older: hold Control, click <code>Walka</code>, choose <strong>Open</strong>, then <strong>Open</strong>.)</li>
<li><strong>A Terminal window opens: that is Walka.</strong> Leave it open while you walk. Closing it ends the recording (the belt is not touched). The dashboard opens in your browser.</li>
</ol>
<p>macOS asks before a program may use Bluetooth or look at the screen. Walka runs inside Terminal, so it asks about <strong>Terminal</strong>.</p>
<ul>
<li><strong>Bluetooth</strong> - to listen to the walking pad. Click <strong>Allow</strong>.</li>
<li><strong>Screen Recording</strong> - to see the strip the addon draws in the corner of the game. The dashboard says when this is what is missing. Open <strong>System Settings → Privacy &amp; Security → Screen &amp; System Audio Recording</strong> (<em>Screen Recording</em> on older versions), switch on <strong>Terminal</strong>, then close Walka and open it again. Recent versions of macOS ask again every few weeks whether Terminal may still do this: choose <strong>Allow</strong>.</li>
</ul>
<p>Both can be changed later in the same place in System Settings. Walka reads the top-left corner of the game window - and, until it has found the game for the first time, searches the screen for it. No picture is saved or sent anywhere. Nothing leaves your computer.</p>
<h3 id="on-the-dashboard">Then, on the dashboard</h3>
<figure class="figure shot">
	<ThemedPicture
		name="dashboard"
		narrow="dashboard-phone"
		sizes="(min-width: 60rem) 46rem, calc(100vw - 2.5rem)"
		narrowSizes="calc(100vw - 2.75rem)"
		alt="The Walka dashboard's Live view: the belt's speed as the treadmill reports it, and the state of the connections. On a wide screen it also shows the numbers of the walk: time, distance, steps, calories and heart rate."
	/>
	<figcaption>The dashboard's Live view, with the demo character.</figcaption>
</figure>
<p><em>Getting started</em> on the dashboard takes you through the rest and ticks each step off as you do it: connect the treadmill, install the game addon, let Walka see the game, enter your weight and height.</p>
<ul>
<li><strong>The rest, step by step:</strong> <a href="{resolve('how-it-works/')}#get-started">Get started</a>.</li>
<li><strong>Before your first walk:</strong> the pad and the game have not been tested against this code. Nothing in Walka can move the belt, so what there is to check is whether your walk is counted right. The checks are under <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a>.</li>
</ul>
<p><strong>The belt is yours.</strong> Start it, stop it and change its speed at the treadmill - its remote, its buttons, its safety key. Walka has no button for any of that. Start slow, and keep the remote where your hand finds it without looking. Closing Walka ends the recording and leaves the belt as it is: when you step off, stop the belt. Nothing else will. More under <a href="{resolve('safety/')}#only-listens">Walka only listens</a>.</p>
</section>

<section id="is-the-download-safe" class="prose">
<h2>Is the download safe?</h2>
<p><code>Walka.exe</code> - like <code>Walka</code> for the Mac - is a program from the internet that your computer does not recognise, so it is right to ask. This is what there is to go on.</p>
<h3 id="before-a-release">What is done before a release</h3>
<ul>
<li><strong>Every release is scanned for viruses before it is published.</strong> Microsoft Defender - the antivirus that is part of Windows - scans <code>Walka.exe</code>, the Mac programs and the addon&#39;s files on one of GitHub&#39;s Windows machines, with the virus definitions of that day, after showing that it catches the standard test file. If it finds anything, nothing is published.</li>
<li><strong>A scan that finds nothing is not proof that a file is harmless</strong> - no scanner can give that - which is why the rest of this list is here.</li>
<li><strong>It is built in the open.</strong> Nobody makes <code>Walka.exe</code> or the Mac programs on their own computer: GitHub <a href={LINKS.build}>builds it</a> from the code in <a href={LINKS.repo}>Walka&#39;s repository</a>, and all of that code is there to read.</li>
<li><strong>What else is in it is fixed and listed.</strong> The program also carries Python and a handful of libraries. The build takes exact versions of them, checked against checksums that are part of the repository (<code>companion/requirements-build.lock</code>), so a library that is tampered with tomorrow does not get into Walka by being the newest. <code>Walka.exe licenses</code> lists them, with their licences.</li>
<li><strong>A published release is never replaced.</strong> A fix is a new version.</li>
</ul>
<p>The result of the scan for the latest release is in <a href={DOWNLOADS.virusScan}><code>virus-scan.json</code></a>, on the <a href={LINKS.latestRelease}>release page</a>: what Microsoft Defender found, when, with which virus definitions and of which day, and the checksums of <code>Walka.exe</code> and the Mac zips it scanned.</p>
<h3 id="check-it-yourself">Check it yourself</h3>
<p>Drop the file you downloaded on <a href={LINKS.virusTotal}>virustotal.com</a> - no account needed. It runs the file past the scanners of about 70 antivirus makers.</p>
<p><strong>If a scanner or two flag it:</strong> <code>Walka.exe</code> is a Python program packed into one file, and it is not signed by a company. A few scanners are wary of every file like that, so one or two flags with a vague name (<em>Generic</em>, <em>Suspicious</em>, ...) are usually a false alarm. The report shows which scanners flag it and what they call it: you decide.</p>
<p><strong>If many of them flag it,</strong> do not open it, and <a href={LINKS.issues}>open an issue</a>.</p>
<h3 id="check-your-download">Check that your download is the file that was built</h3>
<p><strong>The checksum.</strong> <a href={DOWNLOADS.checksums}><code>SHA256SUMS.txt</code></a> on the release page has the checksum of every download. Work out the checksum of your own file and compare it with the line for that file.</p>
<ul>
<li><p>On Windows, in PowerShell, in the folder the download is in:</p>
<pre><code>Get-FileHash Walka.exe</code></pre>
</li>
<li><p>On a Mac, in Terminal, in the folder the download is in (for an Intel Mac the file is <code>Walka-mac-intel.zip</code>):</p>
<pre><code>shasum -a 256 Walka-mac-apple-silicon.zip</code></pre>
</li>
</ul>
<p>On a Mac it is the zip that is listed, so check the zip, not the <code>Walka</code> file inside it. PowerShell shows the checksum in capital letters and the list has small ones: that is the same checksum.</p>
<p><strong>The build record.</strong> GitHub also keeps a signed, public record that these files were built by the repository&#39;s workflow from this version of the code. GitHub&#39;s <code>gh</code> tool checks a download against it.</p>
<pre><code>gh attestation verify Walka.exe --repo AntonyPerez0/walka-addon</code></pre>
<p>For a Mac zip or the addon zip, put that file&#39;s name in place of <code>Walka.exe</code>.</p>
<h3 id="the-warnings">What the warnings from Windows and macOS mean</h3>
<p><strong>&quot;Windows protected your PC&quot;:</strong> Windows shows it for every program that is new and not signed by a company. Walka is not signed by a company, so Windows does not recognise it yet. It does not mean that anything was found.</p>
<p><strong>&quot;Apple could not verify Walka is free of malware&quot;</strong> is the same on a Mac. macOS says that about every program that was not signed with an Apple developer account and sent to Apple to be checked. It does not mean that anything was found.</p>
<p>So neither message means that something was found - and neither means that the file is harmless. What there is to go on is the list above, and whether to open the file is your decision.</p>
<h3 id="report">Found a problem with a release?</h3>
<p>A way to put something into a release that is not built from the repository&#39;s code is a security problem. Please report it in private, not in a public issue: <a href={LINKS.reportVulnerability}>report a vulnerability</a>. An antivirus program that flags <code>Walka.exe</code> without naming anything is not one - that is what this section is for.</p>
</section>

<section id="free" class="prose">
<h2>Free, and stays free</h2>
<p>Walka is free, and stays free: no paid version, no advertising and no asking for money - in the game or outside it.</p>
<p>Its code is published under the <a href={LINKS.licence}>MIT licence</a>, which says the same &quot;as is, no warranty&quot; about the code as the <a href={LINKS.disclaimer}>disclaimer</a> says about Walka. If you pass Walka on or build on it, that licence and the disclaimer go with it.</p>
<p>The program you download is Walka&#39;s code together with Python and the libraries it runs on, in one file, and their licences go with it: <code>Walka.exe licenses</code> prints all of them, with the exact version of each. The game addon contains no third-party code. What Walka owes to other projects is in the <a href={LINKS.thirdParty}>third-party notices</a>.</p>
<p>All of the code is in <a href={LINKS.repo}>Walka&#39;s repository</a>. You can also run Walka from source instead of downloading the program: it needs Python 3.10 or newer, and the commands are in the README there.</p>
<p>Honestly: Walka is not approved by Blizzard, and you use it at your own risk. It is a fan-made tool, not affiliated with or endorsed by Blizzard Entertainment, UREVO, WELLFIT or any other maker of treadmills. More under <a href="{resolve('faq/')}#is-this-allowed">Is this allowed by Blizzard?</a></p>
</section>
</Article>

<style>
	.get {
		padding-block: clamp(2.5rem, 6vw, 4.5rem);
		border-bottom: 1px solid var(--line);
		background: var(--bg-raised);
	}

	.intro {
		max-width: var(--measure);
		margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
		font-size: var(--text-lede);
		line-height: 1.55;
	}

	.elsewhere {
		margin-bottom: 1.25rem;
		color: var(--ink);
		font-weight: 600;
	}

	.in-short {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1.5rem clamp(1.5rem, 4vw, 3rem);
		margin-top: clamp(1.5rem, 4vw, 2.5rem);
		font-size: var(--text-small);
		line-height: 1.6;
	}

	.in-short p {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
		gap: 0.75rem;
	}

	.i {
		margin-top: 0.05rem;
		color: var(--gold);
	}

	.i.warn {
		color: var(--warn);
	}

	.release {
		display: block;
		margin-top: 0.5em;
		color: var(--ink);
	}

	.notes {
		max-width: none;
		margin-top: clamp(1.5rem, 4vw, 2.5rem);
		padding-top: clamp(1.5rem, 4vw, 2.5rem);
		border-top: 1px solid var(--line);
		font-size: var(--text-small);
	}

	.notes p {
		max-width: 56rem;
	}

	.shot {
		max-width: 46rem;
	}

	@media (max-width: 60rem) {
		.in-short {
			grid-template-columns: 1fr;
		}
	}
</style>
