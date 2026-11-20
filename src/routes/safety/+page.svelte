<script lang="ts">
	import { resolve } from '$app/paths';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { LINKS } from '#lib/site.ts';

	// The order is deliberate: what Walka cannot do, and whose the belt is,
	// come first.
	const SECTIONS = [
		{ id: 'at-your-own-risk', label: 'At your own risk' },
		{ id: 'only-listens', label: 'Walka only listens' },
		{ id: 'what-walka-does', label: 'What it does to a treadmill' },
		{ id: 'made-sure', label: 'How that is made sure of' },
		{ id: 'the-addon', label: 'What the addon does' },
		{ id: 'not-a-guarantee', label: 'Verified, and not yet' },
		{ id: 'before-you-use-it', label: 'Before you walk' },
		{ id: 'before-your-first-walk', label: 'Before your first walk' },
		{ id: 'is-and-is-not', label: 'What Walka is, and is not' },
		{ id: 'your-decision', label: 'It is your decision' },
		{ id: 'report', label: 'Found a problem?' },
		{ id: 'read-more', label: 'The long versions' }
	];

	// Where the two files are that docs/SAFETY.md names: the interface through
	// which the program reaches a treadmill, and the reader built on it.
	const SOURCE = `${LINKS.repo}/blob/HEAD/companion/src/walka/treadmill`;
</script>

<Seo
	title="Safety and walking at your own risk"
	description="Walka only listens to your treadmill: it cannot move the belt. Walking while you play is at your own risk. Not yet tried on a real walking pad."
/>

<PageHero label="Read before you walk" title="Safety">
	<p>Walka does not move your treadmill. It only listens to it: the belt is started, stopped and set to a speed by you, at the treadmill itself. You walk on it while you look at a game, and you do that at your own risk.</p>
	<p class="jump">
		<a class="more" href="#only-listens">Walka only listens</a>
		<a class="more" href="#before-your-first-walk">Before your first walk</a>
	</p>
</PageHero>

<Article sections={SECTIONS}>
	<section id="at-your-own-risk" class="prose">
		<h2>At your own risk</h2>
		<p>Walka does not move the belt, but you still walk on a treadmill while you play, and that is at your own risk. This page says what Walka does to a treadmill and what it cannot do, what has and has not been verified, what is yours to check before you walk, and when to ask a doctor first.</p>
		<Callout kind="warning" title="Experimental - not yet tried on a real walking pad">
			<p>Walka's author has not yet run it against a physical treadmill, and nobody has yet tried the Mac version with the game and a walking pad on a real Mac. Read <a href="#before-your-first-walk">Before your first walk</a>.</p>
		</Callout>
		<Callout kind="caution" title="Walking while you play is at your own risk">
			<p>Your eyes are on a game, not on your feet. Walka comes with no warranty, and it is not a safety device or a medical device. If you have a health condition, are pregnant or are in any doubt, ask a doctor first - and stop if you feel dizzy or unwell. The whole of it: the <a href={LINKS.disclaimer}>disclaimer</a>.</p>
		</Callout>
		<p>The long versions are in Walka's repository: <a href={LINKS.safety}>docs/SAFETY.md</a> for what Walka does to a treadmill and how that is made sure of, and <a href={LINKS.disclaimer}>DISCLAIMER.md</a> for risk, health and no warranty. Please read the disclaimer before your first walk.</p>
	</section>

	<section id="only-listens" class="prose">
		<h2>Walka only listens</h2>
		<p class="know">Walka does not start, stop, pause or steer the belt. Not from the game, not from the dashboard, not when something goes wrong.</p>
		<ol class="ways">
			<li>
				<span class="n" aria-hidden="true">1</span>
				<div>
					<h3><strong>You start the belt</strong> with the treadmill's remote or buttons, and <strong>you stop it</strong> the same way - or with its safety key</h3>
					<p>Keep the remote where your hand finds it without looking.</p>
				</div>
			</li>
			<li>
				<span class="n" aria-hidden="true">2</span>
				<div>
					<h3><strong>The speed is the one you set</strong> at the treadmill</h3>
					<p>Walka reads it; it cannot change it. It sets no speed and limits none.</p>
				</div>
			</li>
			<li>
				<span class="n" aria-hidden="true">3</span>
				<div>
					<h3><strong>Closing Walka, or pressing <em>Disconnect</em>,</strong> ends the recording and lets go of the treadmill</h3>
					<p>The belt goes on doing what it was doing.</p>
				</div>
			</li>
			<li>
				<span class="n" aria-hidden="true">4</span>
				<div>
					<h3><strong>When you step off, stop the belt</strong></h3>
					<p>Nothing else will.</p>
				</div>
			</li>
		</ol>
		<div class="with-it">
			<Callout kind="warning" title="Walka is not a safety device: it cannot stop a belt">
				<p>The treadmill's own stop button, remote and safety key are what stops it - keep them within reach. Use the safety key or clip if your treadmill has one.</p>
			</Callout>
		</div>
		<p>Walka listens to what your treadmill reports - its speed, its distance, on some pads its steps - and writes your walks down. Starting the belt, stopping it and choosing its speed are yours, with the treadmill's own remote, buttons and safety key, exactly as if Walka were not there.</p>
		<p>The dashboard - Walka's own page - says so on its <em>Live</em> view:</p>
		<blockquote>
			<p>Walka only listens to your treadmill. It cannot start, stop or change the speed of the belt: you set the speed on the treadmill itself.</p>
		</blockquote>

		<h3 id="earlier-versions">If you used an earlier Walka</h3>
		<p>Earlier versions were different: the belt followed your character, and the companion - the Walka program on your computer - started, stopped and steered it. That has been taken out, not switched off. A motorised belt under someone who is looking at a game was not worth the risk of a program getting it wrong. Those versions have been withdrawn; do not use one.</p>
		<p><strong>If you have a version older than 0.7.0:</strong> it could move the belt. Those downloads have been removed; replace it with <a href={resolve('downloads/')}>the current one</a> and delete the old <code>Walka.exe</code>. Your walks and settings are kept (the settings that were about steering the belt are simply no longer read), and the addon is updated with <em>Install</em> on the dashboard.</p>
		<p>What went with the belt commands - the STOP button and its hotkey among them - is listed under <a href="#made-sure">How that is made sure of</a>. None of it is there any more: you stop the belt at the treadmill.</p>
	</section>

	<section id="what-walka-does" class="prose">
		<h2>What Walka does to a treadmill, all of it</h2>
		<p>Two words come up all the time. The <em>companion</em> is the program on your computer (<code>Walka.exe</code>, or <code>Walka</code> on a Mac) that listens to the treadmill, records your walks and shows the dashboard. The <em>addon</em> is the part of Walka in the game. More on <a href={resolve('how-it-works/')}>how it works</a>.</p>
		<p>When the companion connects to a treadmill it reads one value, and switches notifications on for three things it listens to:</p>
		<div class="reads">
			<p class="reads-legend"><span>On the treadmill</span><span class="visually-hidden">: </span><span>What Walka does with it</span></p>
			<dl>
				<div><dt>Supported Speed Range</dt><dd>reads it, once - the treadmill's speed range, which the dashboard shows</dd></div>
				<div><dt>Treadmill Data</dt><dd>listens: speed, distance, time, and steps where the pad sends them</dd></div>
				<div><dt>Fitness Machine Status</dt><dd>listens: the pad saying that it was started, stopped, paused or set to another speed</dd></div>
				<div><dt>Training Status</dt><dd>listens: its countdown</dd></div>
				<div class="never"><dt>Fitness Machine Control Point</dt><dd><strong>never written to and never listened to</strong> - the one channel through which an app can start, stop or steer a belt</dd></div>
			</dl>
		</div>
		<p>That is everything. Switching a notification on is the only thing Walka ever writes to a treadmill, and it is what every app that shows a treadmill's numbers has to do. Walka does not ask the treadmill for control.</p>
		<p>What Walka does not do on any treadmill: start it, stop it, change its speed or touch the incline. It has no speed limit of its own, because it sets no speed. So the treadmill does not have to be one that apps can control: one that apps can watch and not drive is all Walka needs.</p>
	</section>

	<section id="made-sure" class="prose">
		<h2>How that is made sure of</h2>
		<p>Not by a setting, and not by a rule that could be got round. The parts that moved the belt are gone:</p>
		<ul>
			<li><strong>There is no command to send.</strong> The code that builds treadmill commands (request control, start, stop, pause, set speed) has been deleted, with the rules that decided when to send them, the manual session, the STOP button and hotkey, and the second process that stopped the belt if the companion was killed.</li>
			<li><strong>There is no way to send one.</strong> The companion reaches a treadmill through one small interface (<code>BleClient</code> in <a href="{SOURCE}/ftms_ble.py"><code class="path">treadmill/ftms_ble.py</code></a>), which can connect, read a value and switch notifications on. It has no write. The treadmill reader built on it (<code>Treadmill</code> in <a href="{SOURCE}/base.py"><code class="path">treadmill/base.py</code></a>) can connect and disconnect, and nothing else.</li>
			<li><strong>Nothing the game shows reaches the treadmill.</strong> The strip of squares that the addon draws in the corner of the game window says one thing the companion uses: which walking session of which character a walk is filed under. The old "belt speed wanted" field of the strip is always zero now, and a companion ignores it whatever an older addon puts there.</li>
			<li><strong>Nothing the dashboard does reaches the treadmill either.</strong> Its buttons connect and disconnect the companion, change settings, install the addon and delete walks. <em>Disconnect</em> and closing the companion let go of the treadmill and leave the belt exactly as it is.</li>
		</ul>
		<p>The automated tests check each of these: that the reader and the Bluetooth adapter have no method that could write; that no command builder exists; that an emulated treadmill which records every byte written to it has recorded none after long runs of everything the game, the dashboard and the radio can do; and that a belt does the same, tick for tick, whether or not a companion is listening to it and whatever the game shows meanwhile.</p>
		<p>It is also the one rule for changes to Walka: the companion listens to the treadmill and never writes to it, and tests fail if a way to do so comes back. Those tests run against a simulated and an emulated treadmill, not a real one - see <a href="#not-a-guarantee">what has and has not been verified</a>.</p>
	</section>

	<section id="the-addon" class="prose">
		<h2>What the addon does</h2>
		<p>The addon in the game does not move anything either - it never could; it only ever drew the strip.</p>
		<ul>
			<li><strong><em>Start</em> on the HUD - the small Walka box in the game - or <code>/walka start</code> marks a walking session:</strong> "I am walking now, for this character". The companion files the walk it records under that session.</li>
			<li><strong>The numbers on the HUD are estimates</strong>, counted from the pace you tell the addon (<code>/walka pace</code>, or the&nbsp;<strong>-</strong>&nbsp;and&nbsp;<strong>+</strong> buttons on the HUD): an addon cannot be told what the treadmill is really doing while the game runs. The pace only feeds the HUD's estimate; it changes nothing at the treadmill. What the treadmill measured replaces the estimates after the next <code>/reload</code> or login.</li>
			<li><strong><em>Pause</em> and <em>Stop</em> on the HUD pause and end the session</strong> - the addon's count - and nothing else: stop the belt yourself, at the treadmill, when you step off.</li>
			<li><strong>Going AFK pauses the session</strong> - that is, the addon's count - if you leave that option on. The belt is not touched by it: stop the belt yourself when you step off.</li>
		</ul>
		<aside class="heed" role="note">
			<span class="heed-icon"><Icon name="warning" size={22} /></span>
			<p><strong>The belt does not react to any of this.</strong> Pausing or stopping a session, going AFK, covering the game's top-left corner with another window, closing the game: the belt runs at the speed you set until you stop it at the treadmill.</p>
		</aside>
	</section>

	<section id="not-a-guarantee" class="prose">
		<h2>What has and has not been verified</h2>
		<p>This software has <strong>not yet been run against a physical treadmill</strong> by its author. What that leaves open is whether your walks are <em>counted right</em> - whether a particular treadmill is found, and whether its numbers are read as it means them. It does not leave open whether the belt can be moved: there is nothing in Walka that could.</p>
		<p>That is the whole of the claim. You still walk on a treadmill while you play, at your own risk and with no warranty: see the <a href={LINKS.disclaimer}>disclaimer</a>.</p>

		<h3 id="checked">What has been checked</h3>
		<ul>
			<li>Walka's logic is exercised by a large automated test-suite against a simulated treadmill and against an emulated one at the Bluetooth level, both modelled on the documented behaviour of UREVO firmware.</li>
			<li>The reader listens to the same standard characteristics as open-source projects that work with UREVO pads, including one that lists the Strol 2E (URTM030) as verified on hardware.</li>
			<li>The Mac version is built on GitHub's Macs, which run its tests and check that the finished program starts, records a walk on a simulated pad and saves it when it is closed.</li>
		</ul>
		<p>Walka's own hardware notes call the evidence from those other projects moderate. For the Strol 2E itself there is one person's report and a community-reported list. Everything else comes from sibling models, which share a firmware family but are not the same pad.</p>

		<h3 id="not-checked">What has not</h3>
		<ul>
			<li><strong>A real treadmill.</strong> None of the treadmills Walka names - UREVO, WELLFIT or any other - has been tried by its author on the real machine yet.</li>
			<li><strong>The game itself.</strong> The addon was tested under a mock of the game client - never in the game itself.</li>
			<li><strong>A real Mac.</strong> Nobody has yet tried the Mac version with the game and a walking pad on a real Mac.</li>
			<li><strong>Walka's own window.</strong> GitHub's machines open it in every build and load the dashboard in it. It has not been looked at on a real PC yet, and nobody has clicked in it on a real Mac.</li>
			<li><strong>Shutting Windows down.</strong> Saving the walk when Windows logs off or shuts down has not been tried on a real PC yet. A walk in progress is also saved every half minute, and picked up again at the next start.</li>
			<li><strong>Some of what the Strol 2E does over Bluetooth.</strong> Still unknown for this pad: the exact speed range and step it advertises, where (or whether) it reports steps, how it reports what is done at the pad, and whether it switches itself off, and drops the connection, after a long pause.</li>
		</ul>

		<h3 id="other-makes">Treadmills of other makes</h3>
		<p>A WELLFIT, or any other treadmill that sends standard treadmill data, is read in the same way - also one that cannot be driven by apps at all. But the simulated and the emulated treadmill are modelled on UREVO firmware. For a WELLFIT there is one owner's report, with another program; for other makes nothing is known first-hand.</p>
		<p>That is what the checks are for. Run the probe - like Walka itself it only listens; it sends the treadmill no commands - and then compare the dashboard with the treadmill's own display. The steps are under <a href="#before-your-first-walk">Before your first walk</a>.</p>
	</section>

	<section id="before-you-use-it" class="prose">
		<h2>Before you walk</h2>
		<p>Walka is not a medical device and nothing in it is medical advice. Its calories, steps and heart rate are estimates, for interest only.</p>
		<ul>
			<li><strong>Ask a doctor first</strong> if you have a heart condition, high blood pressure, trouble with balance or dizziness, an injury, if you are pregnant, if you take medicine that affects your balance or your heart rate, if you have not exercised for a long time - or if you are in any doubt.</li>
			<li><strong>Stop at once</strong> if you feel dizzy, faint, short of breath, have pain in your chest, or anything hurts. Stop the belt at the treadmill and step off.</li>
			<li><strong>Follow your treadmill's own manual:</strong> its weight limit, its safety key or clip, the free space it asks for behind and beside the belt, the floor it stands on, what to wear on your feet.</li>
			<li><strong>Adults only.</strong> Keep children and pets away from the treadmill, and stop the belt when you step off.</li>
			<li><strong>Your eyes are on a game.</strong> Walking while you play takes more care than walking. Choose a slow speed, keep the treadmill's remote within reach, and do not do it when you are tired or have been drinking.</li>
		</ul>
	</section>

	<section id="before-your-first-walk" class="prose">
		<h2>Before your first walk</h2>
		<p>The pad and the game have not been tested against this code. Nothing here can move the belt, so what there is to check is whether your walk is <em>counted right</em>:</p>
		<ol class="steps">
			<li>
				<h3><code>Walka.exe probe</code></h3>
				<p>On a Mac it is typed in Terminal: drag the <code>Walka</code> application into a Terminal window (that types where it is), then - with no space in between - type <code class="path">/Contents/MacOS/Walka probe</code> and press Return. How to type a command on Windows is under <a href="{resolve('how-it-works/')}#walkas-window">Walka's window</a>.</p>
				<p>It lists what the pad exposes and listens while you operate it with the remote. It sends the treadmill no commands. Keep the report - it settles the open questions in the <a href={LINKS.hardware}>hardware notes</a>.</p>
			</li>
			<li>
				<h3>Walk for a few minutes with the dashboard open</h3>
				<p>Compare it with the treadmill's own display: the speed, and after the walk the distance and the steps. If they disagree, please <a href={LINKS.issues}>open an issue</a> with the probe report.</p>
			</li>
			<li>
				<h3><code>Walka.exe beacon</code> with the game running</h3>
				<p>On a Mac: <code>Walka beacon</code>.</p>
				<p>Checks that the strip of squares the addon draws in the corner of the game window can be read from your screen.</p>
			</li>
			<li>
				<h3>In game</h3>
				<p>The checks in the <a href={LINKS.checklist}>in-game checklist</a>.</p>
			</li>
		</ol>
		<p>And for you, not for Walka: start slow, and know where the remote is. You walk at your own risk, and Walka has not yet been tried on a real walking pad: read the <a href={LINKS.disclaimer}>disclaimer</a> first.</p>

		<h3 id="when-you-do-walk">When you do walk</h3>
		<ul>
			<li><strong>Start slow.</strong> Studies of treadmill desks find people settle at 1-2 mph, that typing is barely affected there, and that mouse work suffers most. Expect your aim to be worse than seated.</li>
			<li><strong>Keep the remote where your hand finds it without looking</strong>, and use the safety key or clip if your treadmill has one.</li>
			<li><strong>Choose a speed and leave it.</strong> Changing the speed in the middle of a fight is one more thing to do with a hand you need.</li>
			<li><strong>Do the first sessions out of combat</strong>, somewhere quiet.</li>
			<li><strong>Leave the pad's buzzer on.</strong> Its countdown is the warning that the belt is about to move, for you and for whoever else is in the room.</li>
			<li><strong>Stop the belt when you step off.</strong> Walka will not do it for you - nothing will. Children and pets: a belt left running is a hazard.</li>
		</ul>
	</section>

	<section id="is-and-is-not" class="prose">
		<h2>What Walka is, and is not</h2>
		<ul>
			<li><strong>A notebook, not a remote control.</strong> Walka reads what your treadmill reports over Bluetooth - speed, distance, on some pads steps - and writes your walks down. It has no way to start or stop a belt or to change its speed, and it sends the treadmill no commands (<a href="#made-sure">how that is made sure of</a>). <a href="#earlier-versions">Earlier versions</a> did drive the belt. They have been withdrawn: do not use one.</li>
			<li><strong>A free hobby project, and an early one.</strong> Its author has not yet run it against a physical treadmill (see <a href="#not-a-guarantee">what has and has not been verified</a>).</li>
			<li><strong>Not a safety device.</strong> Walka cannot stop a belt. The treadmill's own stop button, remote and safety key are what stops it - keep them within reach.</li>
			<li><strong>Not a medical device, and not medical advice.</strong> Calories, steps, heart rate and everything worked out from them are estimates, for interest only. Do not use them to decide anything about your health, your diet, your medication or your training.</li>
			<li><strong>Not made, tested or approved by the maker of your treadmill.</strong> Walka connects to the treadmill the way a fitness app does, to read its numbers. Most treadmills accept one such connection at a time, so the maker's own app cannot be connected while Walka is.</li>
			<li><strong>Not approved by Blizzard.</strong> See <a href="{resolve('faq/')}#is-this-allowed">Is this allowed?</a></li>
		</ul>
		<p>Walka is a fan-made tool. It is not affiliated with or endorsed by Blizzard Entertainment, UREVO, WELLFIT or any other maker of treadmills. World of Warcraft is a trademark of Blizzard Entertainment, Inc.; the other names belong to their owners.</p>
	</section>

	<section id="your-decision" class="prose">
		<h2>It is your decision</h2>
		<p>By downloading, installing or using Walka you accept that you do so at your own risk. Whether walking at a desk while playing is safe for you, for your treadmill and for the room you do it in is for you to decide - and so is whether to let anyone else do it on your equipment.</p>
		<p><strong>No warranty, and a limit of liability.</strong> In plain words: Walka is provided as is and as available, with no warranty of any kind, express or implied - not of safety, accuracy or fitness for a particular purpose, nor any other - and nothing in Walka, its documentation or its dashboard is a promise that it will work without fault or without interruption. To the fullest extent the law permits, its authors, contributors and copyright holders are not liable for any claim, damages or other liability arising from, out of or in connection with Walka or the use of it - in contract, in tort (including negligence) or otherwise - and that includes personal injury, death, damage to property or equipment, loss of data, and action taken against a game account. The law of some places does not allow all of this; nothing here takes away a right that the law says cannot be taken away, and where that is so, the above applies as far as the law allows.</p>
		<p>That is a summary, and it changes nothing in the text itself. The full text is <a href={LINKS.disclaimer}>DISCLAIMER.md</a>: please read it before your first walk.</p>
		<p>The dashboard's <em>Live</em> view says the short of it whenever Walka is open: Walka only listens to your treadmill, and walking while you play is at your own risk. It points to the disclaimer.</p>
	</section>

	<section id="report" class="prose">
		<h2>Found a safety or security problem?</h2>
		<p>Walka only listens to a treadmill: it has no way to start or stop a belt or to change its speed. The worst thing that could be wrong with it is therefore that this is not true. If you have found a way to make Walka send a treadmill anything at all, or to get at what it stores, please say so in private first.</p>
		<p><strong>How to report.</strong> On GitHub, open the Security tab of <a href={LINKS.repo}>Walka's repository</a> and choose <strong>Report a vulnerability</strong> (<a href={LINKS.reportVulnerability}>direct link</a>). Only the maintainer sees the report. Please do not open a public issue for it, and do not post the details anywhere else until there is a fix.</p>
		<p>Say what you did, what happened, on which version (the dashboard's footer and <code>Walka.exe --version</code> show it) and on which system. A way to repeat it is worth more than anything else.</p>
		<p>Walka is a hobby project with one maintainer: there is no bounty, and no promised time to answer. A report that concerns the belt is looked at before everything else. You will be told what was found and when a fixed version is out, and named in its notes if you want to be.</p>
		<p><strong>What counts.</strong></p>
		<ul>
			<li><strong>Walka writing to a treadmill.</strong> Any way - through the dashboard, the game's signal, a setting, a file, a crafted Bluetooth device - to make the companion send a treadmill a command, or write to any of its characteristics beyond switching on the notifications it listens to.</li>
			<li>Anything that lets someone or something other than the person at the computer read what Walka stores (walks, weight and height, heart rate), change its settings or delete walks - for example another web page open in the same browser, or another device on the network - or make Walka send anything anywhere.</li>
			<li>A picture or video on the screen that is taken for the game's signal. It can no longer move anything, but it could file a walk under the wrong character.</li>
			<li>Writing files outside Walka's own folders and the game's addon folder.</li>
			<li>Putting something into a release that is not built from the repository's code.</li>
		</ul>
		<p><strong>What does not.</strong> A program that already runs on the same computer, someone with physical access to the computer or the treadmill, other software on a treadmill's Bluetooth - a treadmill takes commands from whatever connects to it, and that is the treadmill's design, not Walka's - and antivirus programs that flag <code>Walka.exe</code> without naming anything. Ordinary bugs - a walk is not recorded, a number is wrong, a treadmill is not found - go to the <a href={LINKS.issues}>issue tracker</a>.</p>
		<p>Only the latest release is fixed. <a href="#earlier-versions">Earlier versions</a> could start, stop and steer a belt; they have been withdrawn and are not supported. If you still have one, replace it with the latest release. The whole policy is in <a href={LINKS.security}>SECURITY.md</a>.</p>
	</section>

	<section id="read-more" class="prose">
		<h2>The long versions</h2>
		<ul>
			<li><a href={LINKS.safety}>docs/SAFETY.md</a> - what Walka does to a treadmill, how that is made sure of, and what has and has not been verified.</li>
			<li><a href={LINKS.disclaimer}>DISCLAIMER.md</a> - what Walka is and is not, before you walk, no warranty, limit of liability, names.</li>
			<li><a href={LINKS.hardware}>docs/HARDWARE.md</a> - what is known about the treadmills, where it comes from, and what still needs confirming.</li>
			<li><a href={LINKS.checklist}>docs/IN-GAME-CHECKLIST.md</a> - the checks to do in the game.</li>
			<li><a href={LINKS.security}>SECURITY.md</a> - reporting a security or safety problem.</li>
		</ul>
	</section>
</Article>

<style>
	/* A section is never wider than the screen, whatever a table or a long
	   word in it would like. */
	section {
		min-width: 0;
	}

	/* ---- the top: two ways straight to what most people come for ---- */
	.jump {
		display: flex;
		flex-wrap: wrap;
		gap: 0 2.25rem;
		margin-top: 0.25rem;
		font-size: var(--text-body);
	}

	/* ---- whose the belt is: four things, in the order of a walk ---- */
	.know {
		color: var(--ink);
		font-size: var(--text-lede);
		line-height: 1.5;
	}

	.ways {
		display: grid;
		padding: 0;
		list-style: none;
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.ways li {
		display: grid;
		grid-template-columns: 3.25rem minmax(0, 1fr);
		gap: 0 1.1rem;
		align-items: baseline;
		margin: 0;
		padding: 1.15rem 1.6rem 1.45rem 1.5rem;
	}

	.ways li + li {
		border-top: 1px solid var(--line);
	}

	.n {
		color: var(--gold);
		font: 600 2.75rem/1 var(--font-display);
		font-variant-numeric: lining-nums;
	}

	.ways h3 {
		margin: 0;
		font: 500 1.1875rem/1.45 var(--font-text);
		letter-spacing: -0.005em;
		text-wrap: pretty;
	}

	.ways h3 strong {
		font-weight: 700;
	}

	.ways h3 em {
		font-style: italic;
	}

	.ways p {
		margin-top: 0.35rem;
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.6;
	}

	/* A short command stays on one line; the name of a file may break. */
	code {
		white-space: nowrap;
	}

	code.path {
		white-space: normal;
		overflow-wrap: anywhere;
	}

	/* the remark that belongs to the four things stands right under them */
	.with-it {
		margin-top: 0.75rem;
	}

	/* ---- what Walka does with each thing a treadmill offers ---- */
	.reads {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.reads-legend,
	.reads dl > div {
		display: grid;
		grid-template-columns: 12.5rem minmax(0, 1fr);
		gap: 0 1.25rem;
		padding: 0.85rem 1.15rem 0.85rem 2.75rem;
	}

	.reads-legend {
		border-bottom: 1px solid var(--line);
		color: var(--ink-3);
		font: 600 var(--text-label) / 1.4 var(--font-text);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.reads dl > div {
		position: relative;
	}

	.reads dl > div + div {
		border-top: 1px solid var(--line);
	}

	.reads dt {
		color: var(--ink);
		font-weight: 600;
	}

	/* a full mark for what Walka reads or listens to ... */
	.reads dl > div::before {
		content: '';
		position: absolute;
		left: 1.15rem;
		top: 1.3rem;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--gold);
	}

	/* ... and an empty one for the channel it leaves alone */
	.reads dl > .never::before {
		border: 1.5px solid var(--ink-3);
		background: none;
	}

	/* ---- a warning inside running text: marked, not boxed ---- */
	.heed {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.85rem;
		padding: 0.2rem 0 0.2rem 1.1rem;
		border-left: 3px solid var(--warn);
		color: var(--ink);
	}

	.heed-icon {
		margin-top: 0.15rem;
		color: var(--warn);
	}

	/* ---- things to do in order ---- */
	.steps h3 {
		text-wrap: pretty;
	}

	.steps p {
		margin-top: 0;
	}

	@media (max-width: 40rem) {
		/* the name above, what Walka does with it below */
		.reads-legend,
		.reads dl > div {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.2rem;
			padding-left: 2.5rem;
		}

		.reads dl > div::before {
			left: 1rem;
		}
	}

	@media (max-width: 30rem) {
		.ways li {
			grid-template-columns: 2.25rem minmax(0, 1fr);
			gap: 0 0.75rem;
			padding: 0.95rem 1.1rem 1.2rem 1rem;
		}

		.n {
			font-size: 2.25rem;
		}

		.ways h3 {
			font-size: 1.125rem;
		}

		.heed {
			gap: 0.7rem;
			padding-left: 0.9rem;
		}
	}
</style>
