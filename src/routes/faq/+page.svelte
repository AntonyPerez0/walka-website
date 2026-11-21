<script lang="ts">
	// Questions and answers, in ten groups. Every answer is folded until it is
	// asked - a <details>, so it opens without scripts, and a link to the page
	// with #<question> opens that one. Two things are never folded: the
	// caution at the top, and "Can Walka start or stop my belt?".
	//
	// A site with accounts (src/env.ts) has an eleventh group, "Accounts",
	// and a few answers under "Your data" read differently: every sentence
	// about accounts stands inside {#if ACCOUNTS.on} ... {:else} ... {/if},
	// so that neither build says what is not so.
	import { resolve } from '$app/paths';
	import { ACCOUNTS, WAY_NAMES, type Way } from '#lib/account/config.ts';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import Frame from '#lib/components/Frame.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Picture from '#lib/components/Picture.svelte';
	import Question from '#lib/components/Question.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { OWN_NAME } from '#lib/own-name.ts';
	import { DOWNLOADS, LINKS } from '#lib/site.ts';

	// The groups of questions. The list down the left of the page jumps to them.
	const SECTIONS = [
		{ id: 'basics', label: 'The basics' },
		{ id: 'getting-it', label: 'Getting it' },
		{ id: 'treadmills', label: 'Treadmills' },
		{ id: 'in-the-game', label: 'In the game' },
		{ id: 'safety', label: 'Safety' },
		{ id: 'your-data', label: 'Your data' },
		...(ACCOUNTS.on ? [{ id: 'your-account', label: 'Accounts' }] : []),
		{ id: 'numbers', label: 'The numbers' },
		{ id: 'sharing', label: 'Sharing' },
		{ id: 'troubleshooting', label: 'When something is wrong' },
		{ id: 'project', label: 'The project' }
	];

	// The ways to sign in that this build has switched on (SIGN_IN).
	const byEmail = ACCOUNTS.ways.includes('email');
	const otherSites = ACCOUNTS.ways.filter((way): way is Exclude<Way, 'email'> => way !== 'email').map((way) => WAY_NAMES[way]);
	/** "Discord", "Discord or Google", "Discord, Google or GitHub" */
	const oneOf = (names: string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`);
</script>

<Seo
	title="Questions and answers"
	description="Short, honest answers about Walka - which treadmills work, why it cannot move the belt, what it looks at on your screen and what stays on your computer."
/>

<PageHero label="Short answers first" title="Questions and answers">
	<p>
		A few sentences each, with a link to the long version. Walka is experimental, and walking while you play is at your own risk.
	</p>
</PageHero>

<Article sections={SECTIONS}>
	<div class="caution">
		<Callout kind="caution" title="Experimental, and at your own risk">
			<p>Walka has not yet been tried on a real walking pad. Walking while you play is at your own risk: your eyes are on a game, not on your feet. Walka comes with no warranty, and it is not a safety device or a medical device. Read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.</p>
		</Callout>
	</div>

	<div class="groups">
		<section id="basics" class="group">
			<h2>The basics</h2>
			<div class="questions">
				<Question id="what-is-walka" q="What is Walka?">
					<p>Walka is a walking log for people who walk on an under-desk pad while they play World of Warcraft: Forever. You walk at the speed you set on the pad; Walka counts your time, steps, distance and calories, shows them in the game, keeps them per character, and draws your character&#39;s road on the map.</p>
					<p>It is two pieces, and you need both - an addon in the game that marks your walking sessions and knows which character they belong to, and a small program on your computer (<code>Walka.exe</code>, or <code>Walka</code> on a Mac) that listens to the walking pad over Bluetooth and records your walks. Neither of them moves the belt. It is a fan-made hobby project, and an early version.</p>
					<p class="further">The long version: <a href="{resolve('how-it-works/')}">How Walka works</a>.</p>
				</Question>
				<Question id="free" q="Is it free?">
					<p>Yes. Walka is free, and stays free: no paid version, no advertising and no asking for money - in the game or outside it. Its code is published under the <a href={LINKS.licence}>MIT licence</a>.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#free">Free, and stays free</a>.</p>
				</Question>
				<Question id="what-you-need" q="What do I need?">
					<p>A Windows 11 PC (Windows 10 generally works) or a Mac, with Bluetooth; a walking pad or treadmill that shows its numbers to apps over Bluetooth; and World of Warcraft: Forever.</p>
					<p>The treadmill is switched on, not paired in the computer&#39;s Bluetooth settings, and its own phone app is closed - most treadmills accept one connection at a time. The game runs in <em>Windowed</em> or <em>Windowed (Fullscreen)</em> mode, with its top-left corner visible.</p>
					<p class="further">The list in full: <a href="{resolve('downloads/')}#what-you-need">What you need</a>.</p>
				</Question>
				<Question id="mac" q="Does it work on a Mac?">
					<p>There is a Mac version, for a Mac with an Apple chip (M1 or later) and for an older Mac with an Intel processor - and it is new. GitHub&#39;s Macs build it, run its tests and check that the finished program starts, records a walk on a simulated pad and saves it when it is closed. Nobody has yet tried it with the game and a walking pad on a real Mac. If you do, do everything under <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a>, and <a href={LINKS.issues}>say how it went</a>.</p>
					<p class="further">What is different from Windows: <a href="{resolve('how-it-works/')}#on-a-mac">On a Mac</a>.</p>
				</Question>
				<Question id="other-games" q="Does it work with other games, or without a game?">
					<p>Yes, and there is nothing to set up: the companion records a walk whenever the belt moves. Start the belt with the treadmill&#39;s remote and play anything, or nothing. Such a walk is in the dashboard&#39;s history as <em>No game session</em>, and in your totals.</p>
					<p>Counting a walk for a character is for World of Warcraft: Forever. Plugins for other games, which would say which character a walk is for, are an idea for later, not something Walka has.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#no-game">Other games, or no game</a>.</p>
				</Question>
			</div>
		</section>

		<section id="getting-it" class="group">
			<h2>Getting it</h2>
			<div class="questions">
				<Question id="is-the-download-safe" q="Is the download safe?">
					<p><code>Walka.exe</code> - like <code>Walka</code> for the Mac - is a program from the internet that your computer does not recognise, so it is right to ask. Every release is scanned for viruses by Microsoft Defender before it is published, and if it finds anything, nothing is published. A scan that finds nothing is not proof that a file is harmless - no scanner can give that.</p>
					<p>So there is more to go on: GitHub builds the program in the open from code that is there to read, you can drop your download on <a href={LINKS.virusTotal}>virustotal.com</a> yourself, and <code>SHA256SUMS.txt</code> lets you check that your download is the file that was built.</p>
					<p class="further">All of it: <a href="{resolve('downloads/')}#is-the-download-safe">Is the download safe?</a></p>
				</Question>
				<Question id="windows-protected" q={'Why does Windows say "Windows protected your PC"?'}>
					<p>Windows shows that message for every program that is new and not signed by a company. Walka is not signed by a company, so Windows does not recognise it yet. It does not mean that anything was found. To go on, click <strong>More info</strong>, then <strong>Run anyway</strong>.</p>
					<p class="further">Step by step: <a href="{resolve('downloads/')}#first-time-windows">Opening it for the first time, on Windows</a>.</p>
				</Question>
				<Question id="mac-could-not-verify" q="Why does my Mac say it could not verify Walka?">
					<p>macOS says <em>&quot;Apple could not verify Walka is free of malware&quot;</em> about every program that was not signed with an Apple developer account and sent to Apple to be checked. It does not mean that anything was found.</p>
					<p>Click <strong>Done</strong>, open <strong>System Settings → Privacy &amp; Security</strong>, scroll down to <em>Security</em> and click <strong>Open Anyway</strong> next to Walka. On macOS 14 and older: hold Control, click <code>Walka</code>, choose <strong>Open</strong>, then <strong>Open</strong>.</p>
					<p class="further">Step by step: <a href="{resolve('downloads/')}#first-time-mac">Opening it for the first time, on a Mac</a>.</p>
				</Question>
				<Question id="scanner-flags" q="A virus scanner flags it: what now?">
					<p><code>Walka.exe</code> is a Python program packed into one file, and it is not signed by a company. A few scanners are wary of every file like that, so one or two flags with a vague name (<em>Generic</em>, <em>Suspicious</em>, ...) on VirusTotal are usually a false alarm. The report shows which scanners flag it and what they call it: you decide. If many of them flag it, do not open it, and <a href={LINKS.issues}>open an issue</a>.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#check-it-yourself">Check it yourself</a>.</p>
				</Question>
				<Question id="install-addon" q="How do I install the addon?">
					<p>Walka can put it in the game for you: with the game closed, click <em>Install</em> under <em>Getting started</em> on the dashboard (or <em>Settings → Game addon → Install automatically</em>). Then start the game and tick <em>Walka</em> in the AddOns list.</p>
					<p>By hand instead: unzip the <a href={DOWNLOADS.addon}>addon download</a> into <code>World of Warcraft\<wbr />_forever_\<wbr />Interface\<wbr />AddOns</code> (on a Mac: <code>/Applications/<wbr />World of Warcraft/<wbr />_forever_/<wbr />Interface/<wbr />AddOns/</code>), so that there is a <code>Walka</code> folder in it. If your game is somewhere Walka does not look, choose the addon folder yourself under <em>Settings → Game addon</em>.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#addon">The game addon</a>. Walka is experimental, and you use it at your own risk: read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.</p>
				</Question>
			</div>
		</section>

		<section id="treadmills" class="group">
			<h2>Treadmills</h2>
			<div class="questions">
				<Question id="which-treadmills" q="Which treadmills work?">
					<p>Walka reads Bluetooth FTMS, the standard that fitness apps use to show a treadmill&#39;s speed and distance. It is built around the UREVO Strol 2E, and made to read any treadmill that reports its data over standard Bluetooth FTMS.</p>
					<p>It finds UREVO pads and WELLFIT treadmills (the TM029 Pro among them) by name, and any other FTMS treadmill by what it advertises, after a 15-second scan - or you pick it yourself on the dashboard, under <em>Treadmill → Scan</em>. None of these has been tried by Walka&#39;s author on the real machine yet.</p>
					<p class="further">The table: <a href="{resolve('downloads/')}#which-treadmills-work">Which treadmills work</a>; what is known and where it comes from: <a href={LINKS.hardware}>the hardware notes</a>.</p>
				</Question>
				<Question id="apps-can-control" q="Does my treadmill have to be one that apps can control?">
					<p>No. The treadmill does not have to be one that apps can control: Walka controls nothing. It has to show its numbers to apps over Bluetooth FTMS. A treadmill that apps can watch and not drive is all Walka needs.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#which-treadmills-work">Which treadmills work</a>.</p>
				</Question>
				<Question id="not-listed" q="Mine is not listed: will it work?">
					<p>It depends on the treadmill. If an app other than the maker&#39;s own can <em>show the speed</em> of your treadmill, Walka very likely can too.</p>
					<p>To see what yours offers, run <code class="cmd">Walka.exe probe</code> (on a Mac it is typed in Terminal: see <a href="{resolve('how-it-works/')}#on-a-mac">On a Mac</a>) with the treadmill on. Like Walka itself it only listens - it sends the treadmill no commands - and saves a small text report. <a href={LINKS.issues}>Open an issue</a> with that report and the treadmill&#39;s make and model, and it can be added. The report is made to be posted in public; post the file, not a screenshot of the window.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#probe">Is yours not listed, or not behaving?</a></p>
				</Question>
				<Question id="will-not-work" q="What will not work?">
					<p>Treadmills that only talk to their maker&#39;s app in a private language (many NordicTrack / iFIT machines, the older KingSmith WalkingPads), and bikes or rowers - Walka only reads treadmills.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#what-will-not-work">What will not work</a>.</p>
				</Question>
				<Question id="phone-app" q="Can I use the treadmill's own phone app at the same time?">
					<p>Not with most treadmills: they talk to one app at a time. While Walka is connected, the maker&#39;s phone app cannot be - and the other way round.</p>
					<p>So close the treadmill&#39;s own app before you start Walka. To use the app again, press <em>Disconnect</em> on the dashboard (or close Walka) first: that lets go of the treadmill, and leaves the belt as it is.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#things-to-know">Things to know</a>.</p>
				</Question>
				<Question id="how-fast" q="Does Walka set or limit the speed?">
					<p>No. The speed is yours: Walka sets none and limits none. How fast you walk is between you and the treadmill, and you set it there, with the treadmill&#39;s own remote and buttons.</p>
					<p>Start slow. Studies of treadmill desks find people settle at 1-2 mph, that typing is barely affected there, and that mouse work suffers most.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#things-to-know">Things to know</a>.</p>
				</Question>
				<Question id="incline" q="Does it change the incline?">
					<p>No. Walka does not touch the incline, any more than the speed: set it on the treadmill.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#things-to-know">Things to know</a>.</p>
				</Question>
			</div>
		</section>

		<section id="in-the-game" class="group">
			<h2>In the game</h2>
			<div class="questions">
				<Question id="is-this-allowed" q="Is this allowed by Blizzard?">
					<p>Honestly: it is not approved by Blizzard, and you use it at your own risk. The addon uses only the public addon API, and the companion never sends input to the game, never automates anything in the game and never reads the game&#39;s memory. Blizzard&#39;s enforcement statements target automation, input broadcasting, client modification and tools that get around addon restrictions for an advantage; Walka is none of those.</p>
					<p>But Blizzard&#39;s EULA is written broadly (it prohibits unauthorised software that &quot;reads&quot; information from the game), Blizzard does not pre-approve third-party tools, and no statement says a passive screen reader like this is fine. Similar addon-plus-reader projects exist publicly for this client; that is not the same as permission. The long version is the README&#39;s <a href={LINKS.isThisAllowed}>Is this allowed?</a>, and the <a href={LINKS.disclaimer}>disclaimer</a> names action taken against a game account among the things its authors are not liable for.</p>
				</Question>
				<Question id="input" q="Does Walka press keys, move the mouse or read the game's memory?">
					<p>No. Walka never sends input to the game - no key presses, no mouse input, no memory reading. An addon cannot use Bluetooth, files or the network, so it draws its state as a thin strip of black and white squares in the top-left corner of the game window, and the companion reads that strip off the screen.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#signal">How the signal travels</a>.</p>
				</Question>
				<Question id="what-it-looks-at" q="What exactly does it look at?">
					<p>The top-left corner of the game window: a picture about 700 pixels wide and 12 high, some fifteen times a second. Once Walka has found the game it looks nowhere else. From when it is started until it first finds the game window, it also looks at the top-left corner of each monitor and, every five seconds, takes one picture of the whole screen to search it for the strip; <code class="cmd">Walka.exe beacon</code>, the command that checks whether the strip can be read, does the same once.</p>
					<p>Each picture is searched in the computer&#39;s memory and then dropped: no picture is saved or sent anywhere, and nothing of it is kept but the strip&#39;s ten bytes. Of the game&#39;s files it touches only Walka&#39;s own - the addon folder, and the addon&#39;s saved file, which it only reads.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#what-walka-looks-at">What Walka looks at, exactly</a>.</p>
				</Question>
				<Question id="your-pace" q={'What is "Your pace"?'}>
					<p>The speed you tell the addon your treadmill is set to. An addon cannot be told what the treadmill is doing while the game runs, so the HUD counts with the speed you say the belt is set to: <code class="cmd">/walka pace 1.5</code>, the <strong>-</strong> and <strong>+</strong> buttons on the HUD, or <em>Your pace</em> in <code class="cmd">/walka options</code>. It starts at 1.5 mph.</p>
					<p>It only feeds the HUD&#39;s estimate; it changes nothing at the treadmill. The measured numbers replace the estimate later: press <strong>Sync</strong> in the history window after a walk, or just log in next time.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#your-pace">Your pace</a>.</p>
				</Question>
				<Question id="pause-stop" q="What do Pause and Stop in the game do?">
					<p>They pause and end the <em>session</em> - the addon&#39;s count - and nothing else. The commands <code class="cmd">/walka pause</code>, <code class="cmd">/walka resume</code> and <code class="cmd">/walka stop</code> mark the session in the same way. The belt does not react to any of them: it runs at the speed you set until you stop it at the treadmill.</p>
					<p>The companion goes by the belt, not by those buttons. A walk is counted while the belt moves, and not while it stands still - with the session paused in the game, it is recorded all the same.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#pause">Pause, stop and going AFK</a>.</p>
				</Question>
				<Question id="afk" q="What happens when I go AFK?">
					<p>Going AFK pauses the session automatically, and it carries on when your character next moves. That is the addon&#39;s count, and nothing else: the belt is not touched by it.</p>
					<p>You can turn the automatic pause off in <code class="cmd">/walka options</code>. Either way, do not leave the belt running when you walk away: stop it yourself, at the treadmill.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#pause">Pause, stop and going AFK</a>.</p>
				</Question>
				<Question id="combat" q="What happens in combat?">
					<p>The game hides your character&#39;s exact speed from addons during combat, and Walka does not work around that. While the speed is hidden the addon estimates: moving or not, at your last known run speed. The HUD tooltip tells you when this is happening.</p>
					<p>That only matters for the road and the journey&#39;s &quot;character steps&quot; - your own walk is counted from the treadmill, not from the character. The strip does not say whether your character is fighting: the companion does not need to know, so the addon does not say.</p>
					<p>For you, not for Walka: do the first sessions out of combat, somewhere quiet. Mouse work suffers most on a treadmill desk, so expect your aim to be worse than seated.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#in-combat">In combat</a>.</p>
				</Question>
			</div>
		</section>

		<section id="safety" class="group">
			<h2>Safety</h2>

			<!-- The one answer that is never folded away. -->
			<div class="listens" id="walka-only-listens">
				<Frame pad="clamp(1.1rem, 4.5vw, 2rem)">
					<h3>
						<span class="sign"><Icon name="info" size={26} /></span>
						Can Walka start or stop my belt?
					</h3>
					<div class="prose">
						<p><strong>No.</strong> Walka only listens to your treadmill. It cannot start, stop or change the speed of the belt: you set the speed on the treadmill itself. Not from the game, not from the dashboard, not when something goes wrong.</p>
						<ul>
							<li><strong>You start the belt</strong> with the treadmill&#39;s remote or buttons, and <strong>you stop it</strong> the same way - or with its safety key. Keep the remote where your hand finds it without looking.</li>
							<li><strong>Closing Walka, or pressing <em>Disconnect</em>,</strong> ends the recording and lets go of the treadmill. The belt goes on doing what it was doing.</li>
							<li><strong>When you step off, stop the belt.</strong> Nothing else will.</li>
						</ul>
						<p class="further">More: <a href="{resolve('safety/')}#only-listens">Walka only listens</a>.</p>
					</div>
				</Frame>
			</div>

			<div class="questions">
				<Question id="why-it-changed" q="Walka used to move the belt. Why did that change?">
					<p>Earlier versions did move the belt: the program started it, changed its speed and stopped it. That has been taken out, not switched off. A motorised belt under someone who is looking at a game was not worth the risk of a program getting it wrong.</p>
					<p>Since version 0.7.0 Walka only listens to the treadmill. The code that sent commands to a treadmill has been deleted, and there is no setting that brings it back. The earlier versions have been withdrawn: do not use one.</p>
					<p class="further">More: <a href="{resolve('safety/')}#made-sure">How that is made sure of</a>.</p>
				</Question>
				<Question id="older-version" q="I have an older version: what should I do?">
					<p>Replace it. A version older than 0.7.0 could move the belt, and those downloads have been removed. <a href={resolve('downloads/')}>Download the current one</a> and delete the old <code>Walka.exe</code>. The addon is updated with <em>Install</em> on the dashboard.</p>
					<p>Your walks and settings are kept. The settings that were about moving the belt are simply no longer read.</p>
					<p class="further">The current one is experimental too, and you use it at your own risk: read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.</p>
				</Question>
				<Question id="at-your-own-risk" q="Is it safe to walk while I play?">
					<p>That is for you to decide, and you do it at your own risk. You are walking on a motorised belt while you look at a game: your eyes are on the game, not on your feet. Walka is not a safety device. It cannot move the belt, and it cannot stop one either.</p>
					<p>Start slow, keep the treadmill&#39;s remote within reach, stop the belt when you step off, and keep children and pets away from it. Walking at a desk while you play is for adults. Do not do it when you are tired or have been drinking.</p>
					<p class="further">More: <a href="{resolve('safety/')}#at-your-own-risk">At your own risk</a>; the whole of it is the <a href={LINKS.disclaimer}>disclaimer</a>.</p>
				</Question>
				<Question id="lost-signal" q="What if the game freezes, or Walka loses sight of it?">
					<p>Nothing happens to the belt. Nothing the game shows reaches the treadmill: the belt runs at the speed you set until you stop it at the treadmill.</p>
					<p>Walka loses sight of the game whenever the companion cannot see the strip in the corner of the game window: a loading screen, the game minimised, another window on top of that corner, the game frozen. That is expected, and nothing depends on it but the filing - your walk is recorded all the same. In the middle of a session the walk stays with that session; when the game is closed, the session is over.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#signal">How the signal travels</a>.</p>
				</Question>
				<Question id="crash" q="What happens to the belt if Walka is closed, or crashes?">
					<p>Nothing. Closing Walka, or pressing <em>Disconnect</em>, ends the recording and lets go of the treadmill. The belt goes on doing what it was doing. A crash changes nothing about that: Walka does not stop the belt when something goes wrong, because it cannot. Stop it yourself, at the treadmill.</p>
					<p>Your walk is saved when Walka is closed. A walk in progress is also saved every half minute, so after a crash or a forced quit it is picked up from its last half-minute checkpoint at the next start.</p>
				</Question>
				<Question id="not-a-safety-device" q="Is Walka a safety device?">
					<p>No. Walka is not a safety device, and it cannot stop a belt: the treadmill&#39;s own stop button, remote and safety key are what does. Keep them within reach.</p>
					<p>It is not a medical device either, and nothing in it is medical advice. Its calories, steps and heart rate are estimates, for interest only.</p>
					<p class="further">More: <a href="{resolve('safety/')}#is-and-is-not">What Walka is, and is not</a> and the <a href={LINKS.disclaimer}>disclaimer</a>.</p>
				</Question>
				<Question id="doctor" q="Should I ask a doctor first?">
					<p>Ask a doctor first if you have a heart condition, high blood pressure, trouble with balance or dizziness, an injury, if you are pregnant, if you take medicine that affects your balance or your heart rate, if you have not exercised for a long time - or if you are in any doubt.</p>
					<p>Stop at once if you feel dizzy, faint, short of breath, have pain in your chest, or anything hurts: stop the belt at the treadmill and step off. Walka is not a medical device, and nothing in it is medical advice.</p>
					<p class="further">More: <a href="{resolve('safety/')}#before-you-use-it">Before you walk</a>; the whole of it is the <a href={LINKS.disclaimer}>disclaimer</a>.</p>
				</Question>
			</div>
		</section>

		<section id="your-data" class="group">
			<h2>Your data</h2>
			<div class="questions">
				<Question id="uploads" q="Does Walka upload anything?">
					<p>No. Nothing is uploaded. Walka runs on your computer: no picture of your screen is saved or sent anywhere, the Share picture is drawn on your computer, and the road your character travels never leaves your PC. Posting a picture or importing a walk somewhere else is something you do yourself, by hand.</p>
					{#if ACCOUNTS.on}
						<p>That goes for an account on this website too: a walk gets into one only when <a href="#add-walks">you add it there yourself</a>.</p>
					{/if}
					<p class="further">More: <a href="{resolve('privacy/')}#what-leaves">Privacy</a>.</p>
				</Question>
				<Question id="what-it-keeps" q="What does it keep, and where?">
					<p>Walka keeps your settings (with the weight and height you entered), your walks (with heart rate, if you use a sensor) and the journey numbers of your characters (with each character&#39;s name, without the realm), in a folder of its own: <code class="cmd">%APPDATA%\Walka</code> on Windows, <code>~/Library/<wbr />Application Support/<wbr />Walka</code> on a Mac. Versions after 0.7.0 also keep <code>walka.log</code> there: what Walka connected to and what went wrong. It can hold your treadmill&#39;s name and Bluetooth address, and it stays on your computer unless you send it to somebody.</p>
					<p>In the game&#39;s folder it writes only into Walka&#39;s own addon folder - the addon, and <code>CompanionData.lua</code>, the file from which the game loads what the treadmill measured (your walks, with your body profile and the treadmill&#39;s name). What the addon itself records, the road included, is saved by the game with your other addon settings.</p>
					<p>Walks shorter than 20 seconds are not kept, and a walk can be deleted on the dashboard&#39;s <em>History</em> page.</p>
					<p class="further">More: <a href="{resolve('privacy/')}#what-it-keeps">Privacy</a>.</p>
				</Question>
				<Question id="dashboard-network" q="Can other devices on my network open the dashboard?">
					<p>No. The dashboard is only reachable from the computer Walka runs on, at <code>127.0.0.1:8787</code>. It shows your walks, weight and height and has no password, so it is not offered to other devices on your network. A way round that would be a security problem: see <a href={LINKS.security}>Reporting a security or safety problem</a>.</p>
				</Question>
				<Question id="website" q="Does this website track me?">
					{#if ACCOUNTS.on}
						<p>No. This website has no cookies, no analytics, no advertising and no trackers, and everything a page needs is served by the site itself. It keeps data about you only if you make <a href="#your-account">an account</a>, and then only what you put into it.</p>
					{:else}
						<p>No. This website has no accounts, no forms, no cookies, no analytics, no advertising and no trackers, and everything a page needs is served by the site itself.</p>
					{/if}
					<p>GitHub hosts it and, like any web host, receives your IP address and browser details when a page is fetched, and may keep logs; the site&#39;s maker cannot see those logs and gets no visitor statistics{#if OWN_NAME}{' '}from GitHub (the one count the maker can see is Google&#39;s own, of how often the site is shown and clicked in Google&#39;s search results){/if}. The downloads page also asks GitHub which Walka version is the latest. Your choice of light or dark, if you use the switch, is kept in your own browser, and it is never sent anywhere.</p>
					<p class="further">The whole of it: <a href="{resolve('privacy/')}#this-website">Privacy</a>.</p>
				</Question>
				{#if !ACCOUNTS.on}
					<Question id="accounts" q="Will there be accounts?">
						<p>They are planned, and not open yet: later this website is to offer accounts, for sharing your walking progress with others and for keeping track of food. Walka today has no accounts and uploads nothing.</p>
						<p>Syncing and sharing will be opt-in, a profile will be private until its owner makes it public, and you will be able to export and delete your account and your data yourself. The <a href="{resolve('privacy/')}#planned">privacy page</a> and the <a href="{resolve('terms/')}#accounts">terms</a> will be updated before any of it is switched on.</p>
					</Question>
				{/if}
			</div>
		</section>

		{#if ACCOUNTS.on}
			<section id="your-account" class="group">
				<h2>Accounts</h2>
				<div class="questions">
					<Question id="need-an-account" q="Do I need an account?">
						<p>No. Walka works without one and uploads nothing, and every other page of this site is free to read. An account is only for the two things that need one: sharing your walking progress, and the food diary.</p>
						<p class="further">More: <a href="{resolve('privacy/')}#your-account">Your account, if you make one</a>.</p>
					</Question>
					<Question id="account-for" q="What is an account for?">
						<p>For a page of your own that shows how long and how far you have walked, to the people you give its address to; and for a food diary next to your walks. Both are opt-in: your account is private until you switch your page to public, and the food diary keeps nothing until you agree to that.</p>
						<p class="further">It starts on <a href={resolve('account/')}>the account page</a>.</p>
					</Question>
					<Question id="sign-in" q="How do I sign in, and why is there no password?">
						<p>
							{#if byEmail}On <a href={resolve('account/')}>the account page</a>, type your e-mail address: a six-digit code is sent to it, and you type the code in.{:else}On <a href={resolve('account/')}>the account page</a>, choose {oneOf(otherSites)}: you go to that site, say yes there, and come back signed in.{/if}
							{#if byEmail && otherSites.length}Or choose {oneOf(otherSites)}: you go to that site, say yes there, and come back signed in.{/if}
							New here? Signing in makes your account.
						</p>
						<p>A password would be one more secret to make up, to remember and to keep safe - for you and for this site. So there is none: nobody signs in with one here, and none is kept.</p>
						<p class="further">What signing in keeps: <a href="{resolve('privacy/')}#signing-in">Signing in</a>.</p>
					</Question>
					<Question id="add-walks" q="How do my walks get into it?">
						<p>You add them yourself, on your account&#39;s <a href={resolve('account/walks/')}>Walks page</a>, from Walka&#39;s own files. Walka keeps every finished walk as a file in the <code>sessions</code> folder inside its own folder: <code class="cmd">%APPDATA%\Walka</code> on Windows, <code>~/Library/<wbr />Application Support/<wbr />Walka</code> on a Mac. A TCX file downloaded from the dashboard works too.</p>
						<p>Walka itself uploads nothing. One day the desktop program may be able to send your walks, if you switch that on; today it cannot.</p>
						<p class="further">Which numbers of a walk are kept, and what stays on your computer: <a href="{resolve('privacy/')}#account-keeps">What is kept</a>.</p>
					</Question>
					<Question id="who-sees-my-page" q="Who can see my page?">
						<p>Nobody, until you switch it to public. Then anyone who knows or guesses its name can see the name you show, and in all: how many walks, how long and how far. The last twelve weeks day by day, your steps and your single walks are each a switch of their own, off at first.</p>
						<p>Calories, your numbers and your food are never on your page, whatever is switched on. Switch the page off and it is gone at once.</p>
						<p class="further">More: <a href="{resolve('privacy/')}#public-page">Your public page</a>.</p>
					</Question>
					<Question id="food-diary" q="What does the food diary do, and what are its numbers worth?">
						<p>You enter what you eat, and <a href={resolve('food/')}>the food diary</a> shows calories eaten against calories burned - your walks plus an estimate of what your body burns at rest - and how much is left to walk off toward a goal you set yourself. On a phone it can be put on the home screen as an app of its own.</p>
						<p>Every one of those figures is an estimate, for interest only, and not medical advice. The food diary is not a diet plan, and it says nothing about what anyone should eat.</p>
						<p class="further">More: <a href="{resolve('terms/')}#estimates">Estimates, not advice</a>.</p>
					</Question>
					<Question id="take-out-delete" q="How do I take my data out, or delete my account?">
						<p>Both are on <a href={resolve('account/')}>your account page</a>, under <em>Your data</em>. <em>Save everything as a file</em> gives you one file with everything your account holds. <em>Delete my account...</em> deletes the account and everything in it, at once, and cannot be undone. The walks on your own computer, in Walka, are not touched.</p>
						<p class="further">What is in the file, and the little that stays after deleting: <a href="{resolve('privacy/')}#take-out-delete">Taking it out, and deleting it</a>.</p>
					</Question>
					<Question id="account-free" q="Is an account free?">
						<p>Yes. An account is free, like Walka: nothing to buy, and no advertising. It runs on services that are free as well, so it comes with no promise that it stays. Accounts may be unavailable for a while, and may end one day - with notice, and time to take your data out.</p>
						<p class="further">More: <a href="{resolve('terms/')}#free-and-may-end">Free, and with no promise that it stays</a>.</p>
					</Question>
				</div>
			</section>
		{/if}

		<section id="numbers" class="group">
			<h2>The numbers</h2>
			<div class="questions">
				<Question id="no-game-session" q={'What is "No game session" in the history?'}>
					<p>A walk that was recorded while no session was running in the game. A walk is recorded whenever the belt moves, with a game or without. If a session is running in the game - <code class="cmd">/walka start</code>, or the play button on the HUD - the walk is filed under that session, and so under your character.</p>
					<p>With no session - another game, no game at all - it is recorded all the same, as a walk of its own: <em>No game session</em> in the dashboard&#39;s history, and in your totals.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#no-game">Other games, or no game</a>.</p>
				</Question>
				<Question id="calories" q="How are calories worked out, and how accurate are they?">
					<p>Calories come from belt speed and your weight, using an equation validated at slow desk-walking speeds (the usual treadmill formula reads 11-35% low there). Expect roughly ±10% for an individual. The dashboard also shows how much of it is <em>on top of</em> what sitting would have burned. It is always an estimate, for interest only: do not use it to decide anything about your health, your diet, your medication or your training.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#calories-and-steps">Calories and steps</a>.</p>
				</Question>
				<Question id="steps" q="How are steps counted?">
					<p>Steps are the treadmill&#39;s own count if it reports one; otherwise they are estimated from belt speed and your height. People differ by 6-20% at slow speeds, so there is a <em>step calibration</em> setting: count your steps for a minute, divide by what Walka counted.</p>
					<p>In the game, live numbers marked <code>~</code> are the addon&#39;s estimate; after a walk, press <strong>Sync</strong> in the history window or just log in next time, and the history switches to what the treadmill measured.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#calories-and-steps">Calories and steps</a>.</p>
				</Question>
				<Question id="watch" q="Why does my watch not count these steps?">
					<p>With your hands on the keyboard your arm does not swing, so a wrist watch will not count these steps. Walka&#39;s count is the record.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#calories-and-steps">Calories and steps</a>.</p>
				</Question>
				<Question id="heart-rate" q="Can I use a heart-rate sensor?">
					<p>Yes, if you want to. Any Bluetooth heart-rate sensor works: a chest strap, an arm band, or a watch that can broadcast - dashboard → <em>Settings → Heart-rate sensor → Scan</em>. Watch-to-Windows Bluetooth is known to be hit-and-miss, so a cheap Bluetooth chest strap or arm band is the dependable option.</p>
					<p>Heart rate is shown live and stored with each walk; it only drives the calorie figure when you have entered age and sex <em>and</em> your heart rate is in real exercise territory (above 60% of the maximum for your age, for a minute). Like the other numbers it is an estimate, for interest only.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#heart-rate">Heart rate</a>.</p>
				</Question>
				<Question id="garmin-strava" q="Can I send walks to Garmin Connect or Strava?">
					<p>Not automatically - Walka uploads nothing. Each walk can be downloaded as a <strong>TCX</strong> file (dashboard → <em>History</em> → a walk → <em>TCX</em>) and imported by hand: on connect.garmin.com, <em>Activities</em> → <em>Import</em>.</p>
					<p>Imported walks show time, distance, calories and heart rate; Garmin does not add their steps to your daily step total. The dashboard&#39;s <em>Download TCX</em> button says the file imports into Garmin Connect, Strava and most fitness sites; the README spells out the steps for Garmin only.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#tcx">Garmin Connect, Strava and others</a>.</p>
				</Question>
			</div>
		</section>

		<section id="sharing" class="group sharing">
			<div class="beside">
				<h2>Sharing</h2>
				<div class="questions">
					<Question id="share-picture" q="What is the Share picture?">
						<p>Walka keeps a record for every character you play: the level it has reached, its time played and how far it has travelled on foot - and next to that the real walking <em>you</em> did while playing it.</p>
						<p>The dashboard&#39;s <strong>Share</strong> page turns it into a picture you can post, in a theme (Sapphire, Ember, Wildwood, Frost or Parchment) and a size of your choice. Then <strong>Download PNG</strong> - or <strong>Copy image</strong> and paste it straight into a post or a chat.</p>
						<p class="further">More: <a href="{resolve('how-it-works/')}#share">Your journey, and a picture to share</a>.</p>
					</Question>
					<Question id="on-the-picture" q="What is on it, and what is left off unless I tick it?">
						<p>You tick what should be on it: your real-world steps with the distance you walked, the road your character has travelled, the character&#39;s level, its time played, its steps and the calories. Your character&#39;s name, and the small line with your weight and average pace, are <strong>off</strong> until you tick them. The realm never leaves the game.</p>
						<p>The road is a line on a simplified map with the names of the continents (or of another land your road is on, such as Zephras Isle) - no zones, no place names, no coordinates - and the downloaded file is named after the date, never after the character.</p>
						<p class="further">More: <a href="{resolve('how-it-works/')}#on-the-picture">What is on it</a>.</p>
					</Question>
					<Question id="posted" q="Is anything posted for me?">
						<p>No. The picture is drawn on your computer, from numbers that are already on it. Nothing is uploaded and nothing is posted for you: you choose where it goes.</p>
						<p class="further">More: <a href="{resolve('how-it-works/')}#private-by-default">Private by default</a>.</p>
					</Question>
					<Question id="artwork" q="Does the picture use the game's artwork?">
						<p>No. The design is Walka&#39;s own and is drawn by the page itself: no game artwork, logos or fonts are used. The continents behind the road are not the game&#39;s map but a low-poly drawing of Walka&#39;s own. How their outlines were made is in the <a href={LINKS.thirdParty}>third-party notices</a>.</p>
					</Question>
				</div>
				<figure class="figure share-picture">
					<div class="only-dark">
						<Picture
							name="share-sapphire"
							sizes="min(22rem, calc(100vw - 2.5rem))"
							alt="A Share picture in the Sapphire theme: real-world steps and miles walked, the character's level, time played, and the road it travelled on a map of the world"
						/>
					</div>
					<div class="only-light">
						<Picture
							name="share-parchment"
							sizes="min(22rem, calc(100vw - 2.5rem))"
							alt="A Share picture in the Parchment theme: real-world steps and miles walked, the character's level, time played, and the road it travelled on a map of the world"
						/>
					</div>
					<figcaption>
						A Share picture in the <span class="only-dark">Sapphire</span><span class="only-light">Parchment</span> theme,
						made with the demo character.
					</figcaption>
				</figure>
			</div>
		</section>

		<section id="troubleshooting" class="group">
			<h2>When something is wrong</h2>
			<div class="questions">
				<Question id="belt-does-not-start" q="Why does the belt not start, stop or change speed from Walka?">
					<p>It is not meant to: Walka only listens. Use the treadmill&#39;s remote or buttons.</p>
					<p class="further">More: <a href="#walka-only-listens">Can Walka start or stop my belt?</a></p>
				</Question>
				<Question id="treadmill-not-found" q="Why does Walka not find my treadmill?">
					<p>Is it on? Close the treadmill&#39;s own phone app (force-quit it), and remove the treadmill from Windows <em>Bluetooth &amp; devices</em> if you paired it there. On a Mac, check that <strong>Walka</strong> is switched on under <em>System Settings → Privacy &amp; Security → Bluetooth</em> (<strong>Terminal</strong>, if your Walka runs in a Terminal window), then close Walka and open it again.</p>
					<p>If it is not a UREVO or a WELLFIT, give it the whole scan (15 seconds), or press <em>Scan</em> on the dashboard and pick it - if it is not in the list either, it does not speak Bluetooth FTMS. A USB Bluetooth 5 adapter helps with weak built-in radios.</p>
				</Question>
				<Question id="no-speed-shown" q="It connects, but shows no speed while the belt moves. Why?">
					<p>If Walka connects but the dashboard shows no speed while the belt moves, the treadmill may not send standard treadmill data. Run <code class="cmd">Walka.exe probe</code> (on a Mac it is typed in Terminal: see <a href="{resolve('how-it-works/')}#on-a-mac">On a Mac</a>) and <a href={LINKS.issues}>open an issue</a> with the report it saves.</p>
					<p class="further">More: <a href="#not-listed">Mine is not listed: will it work?</a></p>
				</Question>
				<Question id="no-game-signal" q={'Why does the dashboard say "no game signal"?'}>
					<p>Run the game windowed or borderless, and keep the top-left corner uncovered. In the game, type <code class="cmd">/walka beacon on</code> and try <code class="cmd">/walka beacon size 6</code>; then run <code class="cmd">Walka.exe beacon</code> (<code class="cmd">Walka beacon</code> on a Mac), which checks that the strip can be read from your screen. Your walk is recorded all the same - it is only not filed under a character.</p>
					<p>On a Mac, if the dashboard says macOS has not allowed recording the screen - or says <em>no game signal</em> although the game is there - open <em>System Settings → Privacy &amp; Security → Screen &amp; System Audio Recording</em>, switch on <strong>Walka</strong> (<strong>Terminal</strong>, if your Walka runs in a Terminal window), then close Walka and open it again.</p>
				</Question>
								<Question id="black-window" q="Why does a black window open, and the dashboard in my browser?">
					<p>That is version 0.7.0, the one before Walka had a window of its own. It works the same. The black window is Walka (on a Mac it is a Terminal window): leave it open while you walk - closing it ends the recording, and the belt is not touched.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#before-the-window">The version before the window</a>.</p>
				</Question>
				<Question id="opens-in-browser" q={'Why does Walka open in my web browser, with a small box that says "Walka is running"?'}>
					<p>That Windows has no <em>Microsoft Edge WebView2</em>, which Walka&#39;s own window is drawn with. Walka works the same in the browser; the box is how you close it. To get the window, install the <em>WebView2 Runtime</em> from Microsoft.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#walkas-window">Walka&#39;s window</a>.</p>
				</Question>
				<Question id="nothing-happens" q="I open Walka and nothing happens. What now?">
					<p>Is it open already? Look on the taskbar (or in the Dock). Otherwise <code>walka.log</code>, in the folder with your settings and walks, says how far it got: please <a href={LINKS.issues}>open an issue</a> with it. The log can hold your treadmill&#39;s name and Bluetooth address.</p>
				</Question>
				<Question id="not-my-character" q="Why is a walk not counted for my character?">
					<p>Was a session running in the game while you walked? <code class="cmd">/walka status</code> says what the addon is doing right now. Without a session the walk is recorded as <em>No game session</em>.</p>
					<p class="further">More: <a href="#no-game-session">What is &quot;No game session&quot; in the history?</a></p>
				</Question>
				<Question id="hud-numbers" q="Why are the HUD's numbers off?">
					<p>They are an estimate from the pace you told the addon: set it with <code class="cmd">/walka pace</code> to what the treadmill shows. The measured numbers arrive with <em>Sync</em>.</p>
					<p class="further">More: <a href="#your-pace">What is &quot;Your pace&quot;?</a></p>
				</Question>
				<Question id="full-list" q="Where is the full list?">
					<p>In the README, under <a href={LINKS.troubleshooting}>Troubleshooting</a>: the rows above and the rest, such as walks that are no longer recorded after the pad was switched off and on, <code>~</code> numbers in the history, or an addon marked out of date after a game patch. If nothing there helps, <a href={LINKS.issues}>open an issue</a>.</p>
				</Question>
			</div>
		</section>

		<section id="project" class="group">
			<h2>The project</h2>
			<div class="questions">
				<Question id="who" q="Who makes Walka?">
					<p>Walka is a hobby project with one maintainer. There is no company behind it. It is a fan-made tool: it is not affiliated with or endorsed by Blizzard Entertainment, UREVO, WELLFIT or any other maker of treadmills. World of Warcraft is a trademark of Blizzard Entertainment, Inc., and is named here only to say what Walka works with.</p>
					<p class="further">More: the <a href={LINKS.disclaimer}>disclaimer</a>, under <em>Names</em>.</p>
				</Question>
				<Question id="open-source" q="Is it open source?">
					<p>Yes. Walka&#39;s code is published under the <a href={LINKS.licence}>MIT licence</a>, and all of it is in <a href={LINKS.repo}>the repository</a> to read. Nobody makes <code>Walka.exe</code> or the Mac programs on their own computer: GitHub <a href={LINKS.build}>builds them</a> from that code.</p>
					<p>What Walka owes to other projects is in the <a href={LINKS.thirdParty}>third-party notices</a>. This website is under the MIT licence too, in <a href={LINKS.websiteRepo}>a repository of its own</a>.</p>
				</Question>
				<Question id="report" q="How do I report a bug, or a security problem?">
					<p>Ordinary bugs - a walk is not recorded, a number is wrong, a treadmill is not found - go to the <a href={LINKS.issues}>issue tracker</a>, which is public.</p>
					<p>Walka only listens to a treadmill, so the worst thing that could be wrong with it is that this is not true. If you have found a way to make Walka send a treadmill anything at all, or to get at what it stores, please say so in private first: <a href={LINKS.reportVulnerability}>report a vulnerability</a> on GitHub, where only the maintainer sees the report. There is no bounty and no promised time to answer, and a report that concerns the belt is looked at before everything else. {#if ACCOUNTS.on}For a private word about an account on this website, or a way you found into somebody else&#39;s, there is an e-mail address on the <a href="{resolve('privacy/')}#your-rights">privacy page</a>.{:else}There is no published contact e-mail.{/if}</p>
					<p class="further">What counts and what does not: <a href={LINKS.security}>Reporting a security or safety problem</a>.</p>
				</Question>
				<Question id="help-test" q="Can I help test it on a real treadmill?">
					<p>Yes - the README asks for exactly this, because the pad and the game have not been tested against this code. Nothing in Walka can move the belt, so what there is to check is whether your walk is <em>counted right</em>.</p>
					<p>Start with <code class="cmd">Walka.exe probe</code>, which only listens, and keep the report: it settles open questions in the <a href={LINKS.hardware}>hardware notes</a>. Then walk for a few minutes with the dashboard open and compare it with the treadmill&#39;s own display: the speed, and after the walk the distance and the steps. The rest is under <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a>.</p>
					<p><a href={LINKS.issues}>Open an issue</a> with the report and the treadmill&#39;s make and model, and say how it went - on a Mac too. You do this at your own risk, like everything with Walka - read the <a href={LINKS.disclaimer}>disclaimer</a> first. Start slow, and know where the remote is.</p>
				</Question>
			</div>
		</section>

		<p class="elsewhere">A question that is not here? Ask it on <a href={LINKS.issues}>Walka's issue tracker</a>, which is public.</p>
	</div>
</Article>

<style>
	/* One column, as wide as a comfortable line of text. */
	.caution,
	.group,
	.elsewhere {
		max-width: var(--measure);
		min-width: 0;
	}

	.groups {
		min-width: 0;
	}

	.group + .group {
		margin-top: clamp(3.25rem, 7vw, 5.5rem);
	}

	.group h2 {
		font-size: clamp(1.625rem, 1.4rem + 1vw, 2.125rem);
	}

	/* The questions of a group: each brings the line under it, this is the
	   line above the first. */
	.questions {
		margin-top: clamp(1rem, 2.5vw, 1.5rem);
		border-top: 1px solid var(--line);
	}

	/* Where the long version is: the last line of an answer, set apart. */
	.further {
		margin-top: 0.9em;
		color: var(--ink-3);
		font-size: var(--text-small);
	}

	/* Short commands are not broken over two lines. */
	.cmd {
		white-space: nowrap;
	}

	/* ---- Can Walka start or stop my belt? Always open, and framed: the one
	   answer that matters most. */
	.listens {
		margin-top: clamp(1.1rem, 2.5vw, 1.5rem);
	}

	.listens h3 {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0.7rem;
	}

	.sign {
		color: var(--accent);
	}

	.listens .prose {
		max-width: none;
		margin-top: 0.9rem;
	}

	.listens + .questions {
		margin-top: 0.75rem;
		border-top: 0;
	}

	/* ---- Sharing: a real Share picture beside the group where there is
	   room, under it where there is not. */
	.sharing {
		max-width: none;
		container-type: inline-size;
	}

	.share-picture {
		width: min(22rem, 100%);
		margin-top: clamp(1.75rem, 5vw, 2.5rem);
	}

	@container (min-width: 38rem) {
		.beside {
			display: grid;
			grid-template-columns: minmax(0, 1fr) clamp(13rem, 30%, 16.5rem);
			grid-template-rows: auto 1fr;
			column-gap: clamp(1.75rem, 5%, 2.75rem);
		}

		.beside h2,
		.beside .questions {
			grid-column: 1;
		}

		.share-picture {
			grid-column: 2;
			grid-row: 1 / 3;
			align-self: start;
			width: auto;
			margin-top: 0.35rem;
		}
	}

	/* ---- the last line of the page */
	.elsewhere {
		margin-top: clamp(1.75rem, 4vw, 2.25rem);
		color: var(--ink-3);
		font-size: var(--text-small);
	}
</style>
