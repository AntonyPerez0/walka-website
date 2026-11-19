<script lang="ts">
	// Questions and answers, in ten groups. Every answer is folded until it is
	// asked - a <details>, so it opens without scripts, and a link to the page
	// with #<question> opens that one. Two things are never folded: the
	// caution at the top, and "How do I stop the belt?".
	import { resolve } from '$app/paths';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import Frame from '#lib/components/Frame.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Picture from '#lib/components/Picture.svelte';
	import Question from '#lib/components/Question.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { DOWNLOADS, LINKS } from '#lib/site.ts';

	// The groups of questions. The list down the left of the page jumps to them.
	const SECTIONS = [
		{ id: 'basics', label: 'The basics' },
		{ id: 'getting-it', label: 'Getting it' },
		{ id: 'treadmills', label: 'Treadmills' },
		{ id: 'in-the-game', label: 'In the game' },
		{ id: 'safety', label: 'Safety' },
		{ id: 'your-data', label: 'Your data' },
		{ id: 'numbers', label: 'The numbers' },
		{ id: 'sharing', label: 'Sharing' },
		{ id: 'troubleshooting', label: 'When something is wrong' },
		{ id: 'project', label: 'The project' }
	];
</script>

<Seo
	title="Questions and answers"
	description="Short, honest answers about Walka - which treadmills work, how to stop the belt, what it looks at on your screen and what stays on your computer."
/>

<PageHero label="Short answers first" title="Questions and answers">
	<p>
		A few sentences each, with a link to the long version. Walka is experimental, and you use it at your own risk.
	</p>
</PageHero>

<Article sections={SECTIONS}>
	<div class="caution">
		<Callout kind="caution" title="Experimental, and at your own risk">
			<p>Walka moves a motorised belt while you stand on it, and it has not yet been tried on a real walking pad. It comes with no warranty, and it is not a safety device or a medical device. Read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.</p>
		</Callout>
	</div>

	<div class="groups">
		<section id="basics" class="group">
			<h2>The basics</h2>
			<div class="questions">
				<Question id="what-is-walka" q="What is Walka?">
					<p>Walka lets you walk on your walking pad while you play World of Warcraft: Forever. The belt follows your character: faster when it runs, slower when it stands still.</p>
					<p>It is two pieces, and you need both - an addon in the game that watches your character, and a small program on your computer (<code>Walka.exe</code>, or <code>Walka</code> on a Mac) that talks to the walking pad over Bluetooth. It is a fan-made hobby project, and an early version.</p>
					<p class="further">The long version: <a href="{resolve('how-it-works/')}">How Walka works</a>.</p>
				</Question>
				<Question id="free" q="Is it free?">
					<p>Yes. Walka is free, and stays free: no paid version, no advertising and no asking for money - in the game or outside it. Its code is published under the <a href={LINKS.licence}>MIT licence</a>.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#free">Free, and stays free</a>.</p>
				</Question>
				<Question id="what-you-need" q="What do I need?">
					<p>A Windows 11 PC (Windows 10 generally works) or a Mac, with Bluetooth; a walking pad or treadmill that apps can control over Bluetooth; and World of Warcraft: Forever.</p>
					<p>The treadmill is switched on, not paired in the computer&#39;s Bluetooth settings, and its own phone app is closed - most treadmills accept one connection at a time. The game runs in <em>Windowed</em> or <em>Windowed (Fullscreen)</em> mode, with its top-left corner visible.</p>
					<p class="further">The list in full: <a href="{resolve('downloads/')}#what-you-need">What you need</a>.</p>
				</Question>
				<Question id="mac" q="Does it work on a Mac?">
					<p>There is a Mac version, for a Mac with an Apple chip (M1 or later) and for an older Mac with an Intel processor - and it is new. GitHub&#39;s Macs build it, run its tests and check that the finished program starts, drives the simulated belt and stops it when it is closed. Nobody has yet tried it with the game and a walking pad on a real Mac. If you do, do everything under <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a> first, and <a href={LINKS.issues}>say how it went</a>.</p>
					<p class="further">What is different from Windows: <a href="{resolve('how-it-works/')}#on-a-mac">On a Mac</a>.</p>
				</Question>
				<Question id="other-games" q="Does it work with other games, or without a game?">
					<p>Yes, with you setting the speed. The dashboard has a manual session - start, pause, stop and speed buttons - for any game, or for a plain walk. And if you just walk with the treadmill&#39;s remote while Walka is running, that walk is recorded too. A belt that follows your character is for World of Warcraft: Forever; plugins for other games are an idea for later, not something Walka has.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#no-game">Other games, or no game</a>.</p>
				</Question>
			</div>
		</section>

		<section id="getting-it" class="group">
			<h2>Getting it</h2>
			<div class="questions">
				<Question id="is-the-download-safe" q="Is the download safe?">
					<p><code>Walka.exe</code> - like <code>Walka</code> for the Mac - is a program from the internet that your computer does not recognise, so it is right to ask. Every release is scanned for viruses by Microsoft Defender before it is published, and if it finds anything, nothing is published. A scan that finds nothing is not proof that a file is harmless - no scanner can give that.</p>
					<p>So there is more to go on: GitHub builds the program in the open from code that is there to read, you can drop your download on <a href="https://www.virustotal.com/gui/home/upload">virustotal.com</a> yourself, and <code>SHA256SUMS.txt</code> lets you check that your download is the file that was built.</p>
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
					<p class="further">More: <a href="{resolve('downloads/')}#addon">The game addon</a>.</p>
				</Question>
			</div>
		</section>

		<section id="treadmills" class="group">
			<h2>Treadmills</h2>
			<div class="questions">
				<Question id="which-treadmills" q="Which treadmills work?">
					<p>Walka speaks Bluetooth FTMS, the standard that fitness apps use to control a treadmill. It is built around the UREVO Strol 2E. It finds UREVO pads and WELLFIT treadmills (the TM029 Pro among them) by name, and any other FTMS treadmill by what it advertises, after a 15-second scan. None of these has been tried by Walka&#39;s author on the real machine yet.</p>
					<p class="further">The table: <a href="{resolve('downloads/')}#which-treadmills-work">Which treadmills work</a>; what is known and where it comes from: <a href={LINKS.hardware}>the hardware notes</a>.</p>
				</Question>
				<Question id="not-listed" q="Mine is not listed: will it work?">
					<p>It depends on the treadmill. If an app other than the maker&#39;s own can <em>set the speed</em> of your treadmill, Walka very likely can too.</p>
					<p>To see what yours offers, run <code class="cmd">Walka.exe probe</code> (on a Mac: <code class="cmd">Walka probe</code>, typed in Terminal) with the treadmill on: it only listens - it sends the treadmill no commands - and saves a small text report. <a href={LINKS.issues}>Open an issue</a> with that report and the treadmill&#39;s make and model, and it can be added. The report is made to be posted in public; post the file, not a screenshot of the window.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#probe">Is yours not listed, or not behaving?</a></p>
				</Question>
				<Question id="will-not-work" q="What will not work?">
					<p>Treadmills that only talk to their maker&#39;s app in a private language (many NordicTrack / iFIT machines, the older KingSmith WalkingPads), and bikes or rowers - Walka only connects to treadmills. A treadmill that shows its numbers to apps but does not take speed commands cannot be driven either. Walka then still counts your walk, with you setting the speed on the treadmill.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#what-will-not-work">What will not work</a>.</p>
				</Question>
				<Question id="how-fast" q="How fast can the belt go?">
					<p>Walka stays at walking pace. The companion&#39;s hard speed cap is 3.0 mph until you raise it under <em>Settings → Safety limits</em>, and it cannot be set above 6.5 km/h (4.0 mph), whatever the treadmill can do.</p>
					<p>Out of the box the belt goes slower than that: 0.8 mph when your character stands still, 1.2 mph when it walks, 1.6 mph when it runs and 2.0 mph on a fast mount, with a maximum of 2.5 mph in the addon. Every one of those numbers is yours to set in <code class="cmd">/walka options</code>.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#using-it">Using it</a>.</p>
				</Question>
				<Question id="incline" q="Does it change the incline?">
					<p>No. Incline is left alone: set it on the treadmill.</p>
					<p class="further">More: <a href="{resolve('downloads/')}#full-size-treadmills">With a treadmill that is not a walking pad</a>.</p>
				</Question>
				<Question id="warranty" q="Will it affect my treadmill's warranty?">
					<p>It may. Walka is not made, tested or approved by the maker of your treadmill. Driving a treadmill from software other than its maker&#39;s own may be something the maker does not support, and may affect its warranty. That is yours to check.</p>
					<p class="further">More: the <a href={LINKS.disclaimer}>disclaimer</a>.</p>
				</Question>
			</div>
		</section>

		<section id="in-the-game" class="group">
			<h2>In the game</h2>
			<div class="questions">
				<Question id="is-this-allowed" q="Is this allowed by Blizzard?">
					<p>Honestly: it is not approved by Blizzard, and you use it at your own risk. The addon uses only the public addon API, and the companion never sends input to the game, never automates anything in the game and never reads the game&#39;s memory. Blizzard&#39;s enforcement statements target automation, input broadcasting, client modification and tools that get around addon restrictions for an advantage; Walka is none of those.</p>
					<p>But Blizzard&#39;s EULA is written broadly (it prohibits unauthorised software that &quot;reads&quot; information from the game), Blizzard does not pre-approve third-party tools, and no statement says a passive screen reader like this is fine. Similar addon-plus-reader projects exist publicly for this client; that is not the same as permission. The long version is the README&#39;s <a href="https://github.com/AntonyPerez0/walka-addon/blob/HEAD/README.md#is-this-allowed">Is this allowed?</a>, and the <a href={LINKS.disclaimer}>disclaimer</a> names action taken against a game account among the things its authors are not liable for.</p>
				</Question>
				<Question id="input" q="Does Walka press keys, move the mouse or read the game's memory?">
					<p>No. Walka never sends input to the game - no key presses, no mouse input, no memory reading. An addon cannot use Bluetooth, files or the network, so it draws its state as a thin strip of black and white squares in the top-left corner of the game window, and the companion reads that strip off the screen. The STOP key <span class="keys">(<kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd>,</span> or <span class="keys"><kbd>Control</kbd>+<kbd>Option</kbd>+<kbd>X</kbd></span> on a Mac) is a hotkey of the system, and its key press is not passed on to the game.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#signal">How the signal travels</a>.</p>
				</Question>
				<Question id="what-it-looks-at" q="What exactly does it look at?">
					<p>The top-left corner of the game window: a picture about 700 pixels wide and 12 high, some fifteen times a second. Once Walka has found the game it looks nowhere else. From when it is started until it first finds the game window, it also looks at the top-left corner of each monitor and, every five seconds, takes one picture of the whole screen to search it for the strip; <code class="cmd">Walka.exe beacon</code>, the command that checks whether the strip can be read, does the same once.</p>
					<p>Each picture is searched in the computer&#39;s memory and then dropped: no picture is saved or sent anywhere, and nothing of it is kept but the strip&#39;s ten bytes. Of the game&#39;s files it touches only Walka&#39;s own - the addon folder, and the addon&#39;s saved file, which it only reads.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#what-walka-looks-at">What Walka looks at, exactly</a>.</p>
				</Question>
				<Question id="combat" q="What happens in combat?">
					<p>The game hides your character&#39;s exact speed from addons during combat, and Walka does not work around that. While the speed is hidden the addon estimates: moving or not, at your last known run speed. The HUD tooltip tells you when this is happening. The strip does not say whether your character is fighting - the belt does not need to know, so the addon does not say. Do your first sessions out of combat, somewhere quiet, until you know how the belt responds to the way you play.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#in-combat">In combat</a>.</p>
				</Question>
				<Question id="afk" q="What happens when I go AFK?">
					<p>Going AFK pauses the session, and the belt, automatically. The session resumes when your character next starts moving - typing a chat line does not start a belt - if that is within ten minutes. After a longer break it stays paused until you press the play button on the HUD (or type <code class="cmd">/walka resume</code>): by then nobody can say what stands on the belt.</p>
					<p>You can turn the automatic pause off in <code class="cmd">/walka options</code>. Either way, do not leave a session running when you walk away: stop it.</p>
					<p class="further">More: <a href="{resolve('how-it-works/')}#pause">Pause, stop and going AFK</a>.</p>
				</Question>
			</div>
		</section>

		<section id="safety" class="group">
			<h2>Safety</h2>

			<!-- The one answer that is never folded away. -->
			<div class="stopping" id="stopping">
				<Frame pad="clamp(1.1rem, 4.5vw, 2rem)">
					<h3>
						<span class="stop-sign"><Icon name="stop" size={26} /></span>
						How do I stop the belt?
					</h3>
					<div class="prose">
						<p>Fastest first:</p>
						<ol>
							<li>the treadmill&#39;s <strong>remote</strong>, stop button or safety key - Walka is built to leave the belt stopped then;</li>
							<li><span class="keys"><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd></span> anywhere on the computer, even inside the game <span class="keys">(<kbd>Control</kbd>+<kbd>Option</kbd>+<kbd>X</kbd></span> on a Mac; change it under <em>Settings → Safety limits</em>);</li>
							<li>the red <strong class="stop-button">STOP</strong> on the dashboard;</li>
							<li><em>Stop</em> on the HUD, or <code class="cmd">/walka stop</code>.</li>
						</ol>
						<p>Bluetooth is not an emergency stop: keep the remote within reach.</p>
						<p class="further">More: <a href="{resolve('safety/')}#stopping">Stopping the belt</a>.</p>
					</div>
				</Frame>
			</div>

			<div class="questions">
				<Question id="lost-signal" q="What if the game freezes, or Walka loses sight of it?">
					<p>Walka is built so that a lost signal slows the belt down and does not speed it up. The signal is lost whenever the companion cannot see the strip in the corner of the game window: a loading screen, the game minimised, another window on top of that corner, the game frozen or closed.</p>
					<p>Counted from the last picture it saw: after 1 second the belt is no longer sped up, until 5 seconds it holds its speed, then it slows to the <em>safe speed</em> (0.8 mph by default), and after 2 minutes of that it pauses. If the game window disappears altogether, the session ends and the belt stops. That is what the code is written to do, and what its tests check against a simulated treadmill - not a guarantee.</p>
					<p class="further">More: <a href="{resolve('safety/')}#rules">What Walka is built to do</a>.</p>
				</Question>
				<Question id="crash" q="What if Walka crashes?">
					<p>Closing Walka in the ordinary way is built to stop the belt it was driving. A Walka that is killed cannot do that - a crash, <em>End task</em> in Task Manager - so there is the <em>guard</em>: a small second process that is built to connect to the treadmill itself when that happens, and stop the belt. It keeps trying for three minutes, and a stop is the only command it has.</p>
					<p>It is a net, not a promise: reaching the pad takes several seconds at best, and nothing stops the belt if the guard goes down with Walka (<em>End process tree</em>, a power cut, a computer that freezes). Then the belt keeps its speed until you stop it at the treadmill.</p>
					<p class="further">More: <a href="{resolve('safety/')}#rules">What Walka is built to do</a>, and rule 8 of the <a href={LINKS.safety}>long version</a>.</p>
				</Question>
				<Question id="sleep" q="What if my computer goes to sleep?">
					<p>Walka is built to stop the belt first, exactly as by STOP, when the computer says it is about to sleep. Not every computer says so in time - a laptop with &quot;Modern Standby&quot; may not - and asleep, the companion can watch neither the game nor the belt: the treadmill would keep the speed it was last given.</p>
					<p>So the companion is also built to notice on waking that it has not been running, and to stop the belt then. Either way the belt stays stopped until you resume: press <em>Resume</em> on the dashboard.</p>
					<p class="further">More: <a href="{resolve('safety/')}#rules">What Walka is built to do</a>, and rule 14 of the <a href={LINKS.safety}>long version</a>.</p>
				</Question>
				<Question id="not-a-safety-device" q="Is Walka a safety device?">
					<p>No. Walka is not a safety device: the treadmill&#39;s own stop button, remote and safety key are. Its safety rules are what it is designed to do, and what its tests check against a simulated treadmill - they are not a guarantee. Software has bugs, Bluetooth drops and computers freeze, so Walka must not be the only thing between you and a moving belt. It is not a medical device either, and nothing in it is medical advice.</p>
					<p class="further">More: <a href="{resolve('safety/')}#not-a-guarantee">A design, not a guarantee</a> and the <a href={LINKS.disclaimer}>disclaimer</a>.</p>
				</Question>
				<Question id="doctor" q="Should I ask a doctor first?">
					<p>Ask a doctor first if you have a heart condition, high blood pressure, trouble with balance or dizziness, an injury, if you are pregnant, if you take medicine that affects your balance or your heart rate, if you have not exercised for a long time - or if you are in any doubt.</p>
					<p>Stop at once if you feel dizzy, faint, short of breath, have pain in your chest, or anything hurts: stop the belt at the treadmill and step off. Walka is not a medical device, and nothing in it is medical advice.</p>
					<p class="further">More: <a href="{resolve('safety/')}#before-you-use-it">Before you use it</a>; the whole of it is the <a href={LINKS.disclaimer}>disclaimer</a>.</p>
				</Question>
			</div>
		</section>

		<section id="your-data" class="group">
			<h2>Your data</h2>
			<div class="questions">
				<Question id="uploads" q="Does Walka upload anything?">
					<p>No. Nothing is uploaded. Walka runs on your computer: no picture of your screen is saved or sent anywhere, the Share picture is drawn in your browser, and the road your character travels never leaves your PC. Posting a picture or importing a walk somewhere else is something you do yourself, by hand.</p>
					<p class="further">More: <a href="{resolve('privacy/')}#what-leaves">Privacy</a>.</p>
				</Question>
				<Question id="what-it-keeps" q="What does it keep, and where?">
					<p>Walka keeps your settings (with the weight and height you entered), your walks (with heart rate, if you use a sensor) and the journey numbers of your characters (with each character&#39;s name, without the realm), in a folder of its own: <code class="cmd">%APPDATA%\Walka</code> on Windows, <code>~/Library/<wbr />Application Support/<wbr />Walka</code> on a Mac.</p>
					<p>In the game&#39;s folder it writes only into Walka&#39;s own addon folder - the addon, and <code>CompanionData.lua</code>, the file from which the game loads what the treadmill measured (your walks, with your body profile and the treadmill&#39;s limits). What the addon itself records, the road included, is saved by the game with your other addon settings.</p>
					<p>Walks shorter than 20 seconds are not kept, and a walk can be deleted on the dashboard&#39;s <em>History</em> page.</p>
					<p class="further">More: <a href="{resolve('privacy/')}#what-it-keeps">Privacy</a>.</p>
				</Question>
				<Question id="dashboard-network" q="Can other devices on my network open the dashboard?">
					<p>No. The dashboard is only reachable from the computer Walka runs on, at <code>127.0.0.1:8787</code>. It can start and stop the belt, so it is not offered to other devices on your network. A way round that would be a security problem: see <a href={LINKS.security}>Reporting a security or safety problem</a>.</p>
				</Question>
				<Question id="website" q="Does this website track me?">
					<p>No. This website has no accounts, no forms, no cookies, no analytics, no advertising and no trackers, and everything a page needs is served by the site itself.</p>
					<p>GitHub hosts it and, like any web host, receives your IP address and browser details when a page is fetched, and may keep logs; the site&#39;s maker cannot see those logs and gets no visitor statistics. The downloads page also asks GitHub which Walka version is the latest. Your choice of light or dark, if you use the switch, is kept in your own browser, and it is never sent anywhere.</p>
					<p class="further">The whole of it: <a href="{resolve('privacy/')}#this-website">Privacy</a>.</p>
				</Question>
				<Question id="accounts" q="Will there be accounts?">
					<p>They are planned, and not built yet: later this website is to offer accounts, for sharing your walking progress with others and for keeping track of food. Walka today has no accounts and uploads nothing.</p>
					<p>Syncing and sharing will be opt-in, a profile will be private until its owner makes it public, and you will be able to export and delete your account and your data yourself. The <a href="{resolve('privacy/')}#planned">privacy page</a> and the <a href="{resolve('terms/')}#accounts">terms</a> will be updated before any of it is switched on.</p>
				</Question>
			</div>
		</section>

		<section id="numbers" class="group">
			<h2>The numbers</h2>
			<div class="questions">
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
					<p>Imported walks show time, distance, calories and heart rate; Garmin does not add their steps to your daily step total. The dashboard says the same file imports into Strava and most fitness sites; the README spells out the steps for Garmin only.</p>
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
						<p>No. The picture is drawn in your browser from numbers that are already on your computer. Nothing is uploaded and nothing is posted for you: you choose where it goes.</p>
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
				<Question id="treadmill-not-found" q="Why does Walka not find my treadmill?">
					<p>Is it on? Close the treadmill&#39;s own phone app (force-quit it), and remove the treadmill from Windows <em>Bluetooth &amp; devices</em> if you paired it there. On a Mac, check that <strong>Terminal</strong> is switched on under <em>System Settings → Privacy &amp; Security → Bluetooth</em>, then close Walka and open it again.</p>
					<p>If it is not a UREVO or a WELLFIT, give it the whole scan (15 seconds), or press <em>Scan</em> on the dashboard and pick it - if it is not in the list either, it does not speak Bluetooth FTMS. A USB Bluetooth 5 adapter helps with weak built-in radios.</p>
				</Question>
				<Question id="no-game-signal" q={'Why does the dashboard say "no game signal"?'}>
					<p>Run the game windowed or borderless, and keep the top-left corner uncovered. In the game, type <code class="cmd">/walka beacon on</code> and try <code class="cmd">/walka beacon size 6</code>; then run <code class="cmd">Walka.exe beacon</code> (<code class="cmd">Walka beacon</code> on a Mac), which checks that the strip can be read from your screen.</p>
					<p>On a Mac, if the dashboard says macOS has not allowed recording the screen - or says <em>no game signal</em> although the game is there - open <em>System Settings → Privacy &amp; Security → Screen &amp; System Audio Recording</em>, switch on <strong>Terminal</strong>, then close Walka and open it again.</p>
				</Question>
				<Question id="no-speed-commands" q="It connects, but the belt does not start or change speed. Why?">
					<p>The treadmill may only <em>show</em> its numbers to apps. Look for &quot;does not take speed commands&quot; under <em>Activity</em> on the dashboard, and <a href={LINKS.issues}>open an issue</a> with a <code class="cmd">Walka.exe probe</code> report. Walka then still counts your walk, with you setting the speed on the treadmill.</p>
				</Question>
				<Question id="belt-does-not-follow" q="Why does the belt not follow my character?">
					<p>Have you accepted the disclaimer on the dashboard? It says <em>Waiting for you to accept the disclaimer</em> until you have. Is a session started? <code class="cmd">/walka status</code> says what the addon is doing right now. If the dashboard says <em>waiting for you to move your character</em> or <em>stopped at the treadmill</em>, press Resume.</p>
				</Question>
				<Question id="no-restart" q="Why does the belt not restart after a break?">
					<p>After more than ten minutes AFK the session stays paused until you press the play button on the HUD (or type <code class="cmd">/walka resume</code>). After the computer has slept, press <em>Resume</em> on the dashboard. And for about ten seconds after a stop, &quot;Waiting for the treadmill to finish its previous workout&quot; is normal: the pad ignores a start until then.</p>
				</Question>
				<Question id="two-entries" q={'Why are there two "Walka" entries in Task Manager?'}>
					<p>One is the <em>guard</em>: a small second copy that is built to stop the belt if Walka itself is killed or crashes. It ends when you close Walka.</p>
					<p class="further">More: <a href="#crash">What if Walka crashes?</a></p>
				</Question>
				<Question id="full-list" q="Where is the full list?">
					<p>In the README, under <a href="https://github.com/AntonyPerez0/walka-addon/blob/HEAD/README.md#troubleshooting">Troubleshooting</a>: the rows above and the rest, such as a speed that is one step off, <code>~</code> numbers in the history, or an addon marked out of date after a game patch. If nothing there helps, <a href={LINKS.issues}>open an issue</a>.</p>
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
					<p>Ordinary bugs - the belt does not follow, a number is wrong, a treadmill is not found - go to the <a href={LINKS.issues}>issue tracker</a>, which is public.</p>
					<p>If you have found a way to make Walka do something to the belt that its user did not ask for, please say so in private first: <a href={LINKS.reportVulnerability}>report a vulnerability</a> on GitHub, where only the maintainer sees the report. There is no bounty and no promised time to answer, and a report that concerns the belt is looked at before everything else. There is no published contact e-mail.</p>
					<p class="further">What counts and what does not: <a href={LINKS.security}>Reporting a security or safety problem</a>.</p>
				</Question>
				<Question id="help-test" q="Can I help test it on a real treadmill?">
					<p>Yes - the README asks for exactly this, because the pad and the game have not been tested against this code. Start with <code class="cmd">Walka.exe probe</code>, which only listens, and keep the report: it settles open questions in the <a href={LINKS.hardware}>hardware notes</a>. Then do the rest of <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a>, in order - it goes on with a manual session while you stand next to the pad, not on it.</p>
					<p><a href={LINKS.issues}>Open an issue</a> with the report and the treadmill&#39;s make and model, and say how it went - on a Mac too. You do this at your own risk, like everything with Walka: slowly at first, with the pad&#39;s remote in your hand.</p>
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

	/* Keys to press, and short commands, are not broken over two lines. */
	.keys,
	.cmd {
		white-space: nowrap;
	}

	kbd {
		font-size: 0.8em;
	}

	/* ---- How do I stop the belt? Always open, and framed: the one answer
	   that matters most. */
	.stopping {
		margin-top: clamp(1.1rem, 2.5vw, 1.5rem);
	}

	.stopping h3 {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		align-items: center;
		gap: 0.7rem;
	}

	.stop-sign {
		color: var(--stop);
	}

	.stopping .prose {
		max-width: none;
		margin-top: 0.9rem;
	}


	/* the dashboard's own red button, in small (as on the home page) */
	.stop-button {
		display: inline-block;
		padding: 0.08em 0.6em;
		border-radius: 6px;
		background: var(--stop);
		color: #fff;
		font-size: 0.82em;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	.stopping + .questions {
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
