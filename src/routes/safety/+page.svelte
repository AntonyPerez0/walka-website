<script lang="ts">
	import { resolve } from '$app/paths';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import { LINKS } from '#lib/site.ts';

	// The order is deliberate: stopping comes first.
	const SECTIONS = [
		{ id: 'at-your-own-risk', label: 'At your own risk' },
		{ id: 'stopping', label: 'Stopping the belt' },
		{ id: 'rules', label: 'What Walka is built to do' },
		{ id: 'not-a-guarantee', label: 'A design, not a guarantee' },
		{ id: 'before-you-use-it', label: 'Before you use it' },
		{ id: 'before-your-first-walk', label: 'Before your first walk' },
		{ id: 'is-and-is-not', label: 'What Walka is, and is not' },
		{ id: 'your-decision', label: 'It is your decision' },
		{ id: 'report', label: 'Found a problem?' },
		{ id: 'read-more', label: 'The long versions' }
	];

	// The parts of "What Walka is built to do": their headings, word for word.
	// (They are written to be safe to show on their own - each rule's own
	// sentence, with its hedge, stands under its heading.)
	const RULES = [
		{ id: 'before-you-press-start', label: 'Before you press Start' },
		{ id: 'speed-cap', label: 'The speed cap' },
		{ id: 'speed-changes', label: 'How fast the speed changes' },
		{ id: 'signal-lost', label: 'When the game signal is lost' },
		{ id: 'stopped-at-the-treadmill', label: 'When you stop the belt at the treadmill' },
		{ id: 'what-starts-the-belt', label: 'What starts the belt' },
		{ id: 'command-not-through', label: 'When a command does not get through' },
		{ id: 'closed-or-asleep', label: 'When Walka is closed, or the computer sleeps' },
		{ id: 'guard', label: 'The guard, and its limits' },
		{ id: 'three-more-things', label: 'Three more things' },
		{ id: 'as-walka-comes', label: 'These are the rules as Walka comes' }
	];
</script>

<Seo
	title="Safety and stopping the belt"
	description="How to stop the belt, what Walka is built to do, what it does not promise and when not to use it. Not yet tried on a real walking pad."
/>

<PageHero label="Read before you walk" title="Safety">
	<p>Walka moves a motorised belt while you stand on it and look at a game. You use it at your own risk.</p>
	<p class="jump">
		<a class="more" href="#stopping">Stopping the belt</a>
		<a class="more" href="#before-your-first-walk">Before your first walk</a>
	</p>
</PageHero>

<Article sections={SECTIONS}>
	<section id="at-your-own-risk" class="prose">
		<h2>At your own risk</h2>
		<p>Walka changes the speed of a motorised belt you are standing on, based on what a video game character is doing. That deserves some care. This page says how to stop the belt, what the software is built to do and not to do, what it does not promise, and when not to use it.</p>
		<Callout kind="warning" title="Experimental - not yet tried on a real walking pad">
			<p>Walka&#39;s author has not yet run it against a physical treadmill. Do everything under <a href="#before-your-first-walk">Before your first walk</a>, and keep the pad&#39;s remote in your hand the first time.</p>
		</Callout>
		<Callout kind="caution" title="You use Walka at your own risk">
			<p>It moves a motorised belt while you stand on it. It comes with no warranty, and it is not a safety device or a medical device. If you have a health condition, are pregnant or are in any doubt, ask a doctor first - and stop if you feel dizzy or unwell. The whole of it: the <a href={LINKS.disclaimer}>disclaimer</a>.</p>
		</Callout>
		<p>The long versions are in Walka&#39;s repository: <a href={LINKS.safety}>docs/SAFETY.md</a> for the rules the belt is built to follow, and <a href={LINKS.disclaimer}>DISCLAIMER.md</a> for risk, health and no warranty. Please read the disclaimer before your first walk.</p>
	</section>

	<section id="stopping" class="prose">
		<h2>Stopping the belt</h2>
		<p class="know">Know these before you stand on the belt. Fastest first:</p>
		<ol class="ways">
			<li>
				<span class="n" aria-hidden="true">1</span>
				<div>
					<h3>The treadmill&#39;s <strong>remote</strong>, stop button or safety key</h3>
					<p>Walka is built to treat that as final, and not to restart the belt.</p>
				</div>
			</li>
			<li>
				<span class="n" aria-hidden="true">2</span>
				<div>
					<h3><span class="keys"><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd></span> anywhere on the computer, even inside the game</h3>
					<p><span class="keys"><kbd>Control</kbd>+<kbd>Option</kbd>+<kbd>X</kbd></span> on a Mac; change it under <em>Settings → Safety limits</em>.</p>
				</div>
			</li>
			<li>
				<span class="n" aria-hidden="true">3</span>
				<div>
					<h3>The red <span class="stop">STOP</span> on the dashboard</h3>
				</div>
			</li>
			<li>
				<span class="n" aria-hidden="true">4</span>
				<div>
					<h3><em>Stop</em> on the HUD - the small Walka box in the game - or <code>/walka stop</code></h3>
				</div>
			</li>
		</ol>
		<div class="with-it">
			<Callout kind="warning" title="Bluetooth is not an emergency stop: keep the remote within reach">
				<p>Use the safety key if your pad has one. If anything feels wrong, stop the belt at the treadmill itself.</p>
			</Callout>
		</div>
		<p>Only the first way is the treadmill&#39;s own. The other three go through the Walka program on your computer and reach the belt over Bluetooth - and software has bugs, Bluetooth drops and computers freeze. So Walka must not be the only thing between you and a moving belt.</p>
		<p>What to know about Walka&#39;s own stops:</p>
		<ul>
			<li><strong>The key works from inside the game.</strong> It is a system-wide hotkey that Walka registers. It works while the game has focus, and the key press is not passed on to the game.</li>
			<li><strong>The dashboard shows the key on its STOP button</strong> once the key is set up. If it is not shown there, do not count on the key: use the remote or the STOP button. <em>Activity</em> on the dashboard says when the key could not be set up.</li>
			<li><strong>STOP latches.</strong> The STOP button and the hotkey are built to stop the belt immediately, and nothing - not a session still running in the game, not the game coming back into view - restarts it until you resume.</li>
			<li><strong>If the dashboard says &quot;The Walka companion is not running&quot;</strong>, that page cannot see or control the belt. If the belt is moving, stop it with the pad&#39;s own remote.</li>
		</ul>
		<p>Try the remote, the key and the STOP button while you stand beside the belt, before you ever stand on it. That is step 2 of <a href="#before-your-first-walk">Before your first walk</a>. <code>/walka stop</code> is among the in-game checks of step 4.</p>
	</section>

	<section id="rules" class="prose">
		<h2>What Walka is built to do</h2>
		<p>Short version. Walka is built so that:</p>
		<ul>
			<li>nothing moves until you have accepted the <a href={LINKS.disclaimer}>disclaimer</a> on the dashboard and pressed Start;</li>
			<li>a hard speed cap (3.0 mph until you raise it, at most 4.0 mph) limits what any game state can ask for, and speed changes are gentle and rate-limited;</li>
			<li>if the companion loses sight of the game it holds, then slows, then pauses the belt - it does not speed up on a lost signal;</li>
			<li>a belt you stop at the treadmill is left stopped;</li>
			<li>after any pause it did not watch you start, the belt waits for your character to move - and after ten minutes away, for you to press Resume;</li>
			<li>the belt is stopped before the computer goes to sleep, and stays stopped until you resume;</li>
			<li>if Walka itself is killed or crashes while the belt runs, a small second process (the <em>guard</em>) reaches for the treadmill and stops the belt.</li>
		</ul>
		<p>These rules are what Walka is designed to do, and what its tests check against a simulated treadmill. They are not a guarantee, and Walka is not a safety device: the treadmill&#39;s own stop button, remote and safety key are.</p>
		<p>The rest of this section says more about each rule. Three words come up all the time. The <em>addon</em> is the part of Walka in the game. The <em>companion</em> is the program on your computer (<code>Walka.exe</code>, or <code>Walka</code> on a Mac) that talks to the treadmill and shows the dashboard. The <em>game signal</em> is a thin strip of squares that the addon draws in the top-left corner of the game window, and that the companion reads off the screen. More on <a href={resolve('how-it-works/')}>how it works</a>.</p>
		<p>The companion&#39;s rules live in one small part of it, and each is covered by automated tests - against a simulated treadmill, not a real one.</p>

		<nav class="within" aria-labelledby="rules-parts">
			<p class="label" id="rules-parts">In this section</p>
			<ol>
				{#each RULES as rule (rule.id)}
					<li><a href="#{rule.id}">{rule.label}</a></li>
				{/each}
			</ol>
		</nav>

		<h3 id="before-you-press-start">Before you press Start</h3>
		<p><strong>Hands off unless a session is active.</strong> Until you press <em>Start</em> (on the HUD in the game, or on the dashboard), Walka is built never to send the treadmill a command. You can use the pad with its remote as if Walka were not there. It will still log the walk.</p>
		<p>And until you have accepted the disclaimer on the dashboard, Walka is built not to start or steer the belt, whatever is pressed. Of its commands only a stop (STOP, the hotkey) is sent.</p>

		<h3 id="speed-cap">The speed cap</h3>
		<p><strong>Your speed cap comes first.</strong> The companion has a hard maximum speed: 3.0 mph out of the box. You change it on the dashboard under <em>Settings → Safety limits</em>. It can be raised, but not above 6.5 km/h (4.0 mph), the top of a pad&#39;s desk mode. Walka changes speed by itself under someone who is looking at a game; running speeds are not for that.</p>
		<p>The companion is written so that no game state, addon setting or corrupted frame can make it command more than the cap, nor more than the range the treadmill itself advertises. If you lower the cap during a walk, the belt starts coming down to it at once - at the gentle rate below, not in one jump.</p>
		<p>The addon has a maximum of its own as well: 2.5 mph by default, in <code>/walka options</code>. The companion&#39;s cap is the hard one.</p>

		<h3 id="speed-changes">How fast the speed changes</h3>
		<p><strong>Changes are built to be gentle.</strong> Speed commands go out at most once a second. They move the belt by at most 0.2 km/h per second up and 0.4 km/h per second down - on a US pad that is one 0.1 mph step per second up, two down.</p>
		<p>Speed-ups are measured from what the belt <em>reports</em>, not from what Walka asked for. No command is written to be more than one step above the speed the belt is really doing, so a command that got lost cannot turn into a jump later. The addon also smooths the game&#39;s instant speed changes before they reach the companion, and holds your pace through short stops (looting, talking) so the belt does not surge and sag.</p>
		<p><strong>By default the belt keeps moving when your character stands still.</strong> It does not stop: it drops to the <em>standing</em> pace (0.8 mph). Two options change that. <em>Keep walking</em> holds your walking pace instead. <em>Stop the belt when my character stands still</em> pauses it - every restart then costs the treadmill&#39;s countdown, and the belt starts when your character moves.</p>

		<h3 id="signal-lost">When the game signal is lost</h3>
		<p><strong>Losing the game signal is built to slow the belt, never to speed it up.</strong> The signal is lost whenever the companion cannot see the strip in the corner of the game window: a loading screen, the game minimised, another window on top of that corner, the game frozen or closed. Counted from the last picture the companion saw:</p>
		<div class="lost">
			<p class="lost-legend"><span>Since the last picture</span><span class="visually-hidden">: </span><span>The belt</span></p>
			<dl>
				<div><dt>after 1 second</dt><dd>may still slow down, but is no longer sped up - and is not started</dd></div>
				<div><dt>until 5 seconds</dt><dd>holds its speed</dd></div>
				<div><dt>then</dt><dd>slows to the <em>safe speed</em> (0.8 mph by default) - never faster than it was already going, and never faster than the belt reports</dd></div>
				<div><dt>after 2 minutes of that</dt><dd>pauses</dd></div>
			</dl>
		</div>
		<p>So a lost signal does not stop the belt at once: it holds, then slows, then pauses. If you want the belt stopped, <a href="#stopping">stop it</a>.</p>
		<p>Three more cases the rule is written for:</p>
		<ul>
			<li>If the game window disappears altogether, the session ends and the belt is stopped - also if the treadmill was out of Bluetooth reach at that moment: the stop is delivered when it is back.</li>
			<li>If you start the belt with the remote while the game is out of view, that walk is yours. Walka leaves the belt alone until it can see the game again.</li>
			<li>After a quarter of an hour without the game, with the belt off, Walka lets go of the session altogether.</li>
		</ul>

		<h3 id="stopped-at-the-treadmill">When you stop the belt at the treadmill</h3>
		<p><strong>A stop at the treadmill is treated as final.</strong> If the belt is stopped or paused with the pad&#39;s own button, its remote or its safety key - or if it simply stops moving, or is found stopped when the Bluetooth link comes back - Walka is built not to start it again by itself. To carry on, pause and resume the session yourself (HUD or dashboard), start a new session, or press start on the remote.</p>
		<p>The addon&#39;s <em>automatic</em> pause when you go AFK does not count as you resuming. Stop the belt at the pad, walk away, come back and touch a key: it is built to stay stopped.</p>
		<p><strong>A speed you set at the treadmill is a ceiling.</strong> If you slow the belt with the remote, Walka is built not to fight you: it keeps following your character below that speed and does not go above it. The dashboard says so (&quot;held at the speed you set&quot;). The ceiling is lifted by <em>Resume</em>, by pausing and resuming in game, by a new session - or by you raising the speed at the pad again.</p>
		<p>The other way round is different. If you speed the belt up with the remote beyond what the game asks for, Walka walks it back down at the gentle rate.</p>

		<h3 id="what-starts-the-belt">What starts the belt</h3>
		<p><strong>The belt is built to start only on a deliberate act.</strong> Pressing <em>Start</em> starts it - after the treadmill&#39;s own 3-2-1 countdown, at its minimum speed. That is what is known of UREVO pads from the manual and from other projects. Whether the Strol 2E itself counts down before starting is still an open question in the <a href={LINKS.hardware}>hardware notes</a>.</p>
		<p>In every other situation where the belt is stopped but a session is still marked active - the companion was started mid-session, the treadmill reconnected, the belt was paused after a long signal loss - Walka is built to wait until <strong>your character starts moving</strong> or you press <em>Resume</em>.</p>
		<p>&quot;Starts moving&quot; means Walka saw the character stand still and then move, after any stretch in which it could not watch. A character that is already being carried along when the picture returns (a flight path, auto-run) pressed no key for you. A <em>Resume</em> that cannot be acted on - the game is out of view, the treadmill out of reach - counts for one minute; after that it has to be pressed again.</p>
		<p>What follows from this:</p>
		<ul>
			<li><strong>Going AFK pauses the session and the belt automatically.</strong> Coming back does not restart it by itself: the session resumes when your character next starts moving. So typing a chat line does not start a belt, and neither does a flight path. With auto-run or /follow, stop and go again, or press Resume. You can turn the automatic pause off.</li>
			<li><strong>That only holds for ten minutes.</strong> After a longer break nobody can say who is at the keyboard or what stands on the belt by now - a chair rolled onto the pad, a child, a pet. The pause then becomes one that only <em>Resume</em> ends (the play button on the HUD, or <code>/walka resume</code>). The HUD says &quot;Paused&quot; instead of &quot;Paused (AFK)&quot;, and moving the character does nothing to the belt.</li>
			<li><strong>In dungeons, raids and battlegrounds</strong> the game hides its AFK flag from addons. There Walka keeps its own clock: five minutes without your character moving or fighting count as away, and the first movement after that as back.</li>
			<li><strong>Being attacked is not meant to start the belt.</strong> The option <em>In combat, never drop below running pace</em> only applies once your character has moved in that fight.</li>
			<li><strong>Ending a manual session on the dashboard is built to stop the belt</strong>, even if a game session is running behind it. The game session then waits for the same deliberate act.</li>
		</ul>
		<Callout kind="warning">
			<p>Within those ten minutes the belt starts again when the character moves. A belt that starts when someone touches the keyboard is a hazard - think of children and pets. Do not leave a session running when you walk away: stop it when you step off.</p>
		</Callout>

		<h3 id="command-not-through">When a command does not get through</h3>
		<p><strong>Starts and speed changes are not repeated on a guess; stops are built to be repeated until they work.</strong> If a start or a speed command gets no acknowledgement, it may or may not have been applied, and Walka is built not to send it again blindly. A stop is the opposite case. After any pause or stop of its own, Walka watches the speed the belt reports, and sends a stop every few seconds for as long as the belt is still moving and not slowing down.</p>
		<p>A stop that could not be delivered because the Bluetooth link dropped stays owed. Walka keeps trying to reconnect (for up to half an hour) and is built to stop the belt as soon as it can reach it. Until then, expect the belt to keep the speed it was last given - and stop it at the treadmill.</p>

		<h3 id="closed-or-asleep">When Walka is closed, or the computer sleeps</h3>
		<p><strong>Closing the companion is built to stop the belt it was driving</strong> - before anything else is tidied up, and including a belt whose earlier stop had not been confirmed. Closing means <span class="keys"><kbd>Ctrl</kbd>+<kbd>C</kbd></span> or closing its window; on a Mac also logging out or shutting down. <em>Disconnect</em> on the dashboard does the same: a belt in use is stopped first.</p>
		<p>On Windows, logging off or shutting down is meant to stop the belt too, but that has not been tried on a real PC yet. Stop the belt yourself before you shut down.</p>
		<p><strong>A sleeping computer is not meant to drive a belt.</strong> Asleep, the companion can watch neither the game nor the belt, and the treadmill would keep the speed it was last given. So when the computer is about to sleep, Walka is built to stop the belt first, exactly as by STOP: it stays stopped until you resume.</p>
		<p>Not every computer says in time that it is going to sleep - a laptop with &quot;Modern Standby&quot; may not. So the companion also notices on waking that it has not been running (20 seconds or more without a look at the belt, which is also what a frozen program looks like), and is built to stop the belt then, again until you resume.</p>

		<h3 id="guard">The guard, and its limits</h3>
		<p>A companion that is killed cannot stop anything - a crash, <em>End task</em> in Task Manager. For that there is the <em>guard</em>: a second, small process that the companion starts and keeps informed of whether a belt of its own may be turning. When the companion vanishes without saying goodbye while one is, the guard is built to connect to that treadmill itself and stop the belt. It does nothing else: a stop is the only command it has.</p>
		<p>The guard keeps trying for three minutes, and the next time Walka starts, the dashboard says what happened. The same guard takes over a stop that the companion could not deliver when it was closed (the treadmill out of Bluetooth reach).</p>
		<aside class="heed" role="note">
			<span class="heed-icon"><Icon name="warning" size={22} /></span>
			<p><strong>The guard is a net, not a promise.</strong> Reaching the pad takes several seconds at best, and nothing stops the belt if the guard goes down with the companion (<em>End process tree</em>, a power cut, a computer that freezes). Then the belt keeps its speed until you stop it at the treadmill.</p>
		</aside>
		<p>If there are two &quot;Walka&quot; entries in Task Manager, one of them is the guard. It ends when you close Walka.</p>

		<h3 id="three-more-things">Three more things</h3>
		<ul>
			<li><strong>One treadmill.</strong> The first treadmill Walka connects to is remembered, and from then on Walka is built to reconnect only to that one, so that a second pad in Bluetooth range cannot be driven by mistake. <em>Forget this treadmill</em> on the dashboard (refused while a belt is in use) lets you move to another.</li>
			<li><strong>Incline is left alone.</strong> Set it on the treadmill. And whatever the treadmill can do, the speed cap cannot be set above 6.5 km/h (4.0 mph).</li>
			<li><strong>The dashboard is only reachable from the computer itself.</strong> It can start and stop the belt, so it is not offered to other devices on your network.</li>
		</ul>

		<h3 id="as-walka-comes">These are the rules as Walka comes</h3>
		<p>The numbers in this section are the ones Walka comes with. Some of them are settings on the dashboard, and if you have changed them, yours apply:</p>
		<ul>
			<li>Under <em>Settings → Safety limits</em>: the speed cap, how fast the belt may speed up and slow down, how long it holds its speed after the signal is lost, the safe speed, and how long it stays there before it pauses. Folded away under <em>Advanced timing</em> in the same place: how often a speed command may go out.</li>
			<li>Also there, a switch: <em>After a pause, the belt restarts only when the character moves</em>. It is on as Walka comes. Switched off, in the dashboard&#39;s own words, the belt &quot;restarts as soon as the signal is back&quot;.</li>
			<li>Under <em>Settings → Treadmill</em>: <em>Stop the belt when the companion exits</em>. It is on as Walka comes, and the dashboard marks it &quot;Recommended&quot;. Stopping the belt when Walka is closed, and the guard, depend on it.</li>
		</ul>
	</section>

	<section id="not-a-guarantee" class="prose">
		<h2>A design, not a guarantee</h2>
		<p><strong>This page describes a design, not a guarantee.</strong> The rules above are what the software is built to do, and what its automated tests check against a simulated treadmill. Software has bugs, Bluetooth drops and computers freeze, so Walka is not a safety device and must not be the only thing between you and a moving belt.</p>
		<p>Read every &quot;never&quot;, &quot;always&quot; and &quot;cannot&quot; on this page that way: as what the code is written to do, not as a promise. You use Walka at your own risk and it comes with no warranty: see the <a href={LINKS.disclaimer}>disclaimer</a>.</p>

		<h3 id="checked">What has been checked</h3>
		<ul>
			<li>The logic above is exercised by a large automated test-suite, against a simulated treadmill that mimics the UREVO firmware&#39;s documented behaviour.</li>
			<li>The Bluetooth driver follows the same command sequence as open-source projects that control UREVO pads, including one that lists the Strol 2E (URTM030) as verified on hardware.</li>
			<li>The Mac version is built on GitHub&#39;s Macs, which run its tests and check that the finished program starts, drives the simulated belt and stops it when it is closed.</li>
		</ul>
		<p>Walka&#39;s own hardware notes call the evidence from those other projects moderate. For the Strol 2E itself there is one person&#39;s report and a community-reported list. Everything else comes from sibling models, which share a firmware family but are not the same pad.</p>

		<h3 id="not-checked">What has not</h3>
		<ul>
			<li><strong>A real treadmill.</strong> This software has <strong>not yet been run against a physical treadmill</strong> by its author. That goes for every treadmill Walka names - UREVO, WELLFIT or any other.</li>
			<li><strong>The game itself.</strong> The addon was tested under a mock of the game client - never in the game itself.</li>
			<li><strong>A real Mac.</strong> Nobody has yet tried the Mac version with the game and a walking pad on a real Mac.</li>
			<li><strong>Shutting Windows down.</strong> Stopping the belt when Windows logs off or shuts down has not been tried on a real PC yet.</li>
			<li><strong>Some of what the Strol 2E does over Bluetooth.</strong> Still unknown for this pad: whether it counts down before starting and how fast the belt accelerates, how it reports a pause or stop that was sent over Bluetooth, and whether it stops by itself when nobody is walking.</li>
		</ul>

		<h3 id="other-makes">Treadmills of other makes</h3>
		<p>A WELLFIT, or any other treadmill found by its Fitness Machine Service, is driven by the same commands and the same rules. But the simulated treadmill is modelled on UREVO firmware: how another make rounds a speed, announces a stop or behaves after one has not been seen at all.</p>
		<p>One example from the hardware notes: on firmware that rounds a speed to the nearest step, some targets would land 0.1 mph high - including at the speed cap. Watch for this in the first manual session, and report it.</p>
		<p>The rules that do not depend on the firmware are written to hold all the same: Walka&#39;s own speed cap (never above 6.5 km/h, whatever the treadmill can do), slowing and then pausing when the game&#39;s signal is lost, and never restarting a belt that was stopped at the machine. A full-size treadmill is faster and heavier than a walking pad, so the first session beside the belt matters more, not less.</p>
		<p>That is why the checks come first. Before your first real session, run the probe - it only reads; it sends the treadmill no commands - and then try a manual session from the dashboard while standing beside the pad, not on it. The steps are under <a href="#before-your-first-walk">Before your first walk</a>.</p>
	</section>

	<section id="before-you-use-it" class="prose">
		<h2>Before you use it</h2>
		<p>Walka is not a medical device and nothing in it is medical advice. Its calories, steps and heart rate are estimates, for interest only.</p>
		<ul>
			<li><strong>Ask a doctor first</strong> if you have a heart condition, high blood pressure, trouble with balance or dizziness, an injury, if you are pregnant, if you take medicine that affects your balance or your heart rate, if you have not exercised for a long time - or if you are in any doubt.</li>
			<li><strong>Stop at once</strong> if you feel dizzy, faint, short of breath, have pain in your chest, or anything hurts. Stop the belt at the treadmill and step off.</li>
			<li><strong>Follow your treadmill&#39;s own manual:</strong> its weight limit, its safety key or clip, the free space it asks for behind and beside the belt, the floor it stands on, what to wear on your feet.</li>
			<li><strong>Adults only.</strong> Keep children and pets away from the treadmill, and never leave a session running when you step off.</li>
			<li><strong>Your eyes are on a game.</strong> Walking while you play takes more care than walking. Start slowly, keep the treadmill&#39;s remote within reach, and do not use Walka when you are tired or have been drinking.</li>
			<li><strong>Do the checks under <a href="#before-your-first-walk">Before your first walk</a></strong>, standing beside the belt, before you ever stand on it.</li>
		</ul>
	</section>

	<section id="before-your-first-walk" class="prose">
		<h2>Before your first walk</h2>
		<p>The pad and the game have not been tested against this code. Do these, in order:</p>
		<ol class="steps">
			<li>
				<h3><code>Walka.exe probe</code></h3>
				<p>On a Mac: <code>Walka probe</code>, typed in Terminal - drag the <code>Walka</code> file into a Terminal window, type a space and <code>probe</code>, press Return.</p>
				<p>Read-only: it lists what the pad exposes and listens while you operate it with the remote. It sends the treadmill no commands. Keep the report - it settles the open questions in the <a href={LINKS.hardware}>hardware notes</a>.</p>
			</li>
			<li>
				<h3>A manual session from the dashboard while standing next to the pad, not on it</h3>
				<p>Start, change speed, pause, stop, press STOP, press <span class="keys"><kbd>Ctrl</kbd>+<kbd>Alt</kbd>+<kbd>X</kbd></span> <span class="keys">(<kbd>Control</kbd>+<kbd>Option</kbd>+<kbd>X</kbd></span> on a Mac). Stop it with the remote and check Walka leaves it stopped.</p>
			</li>
			<li>
				<h3><code>Walka.exe beacon</code> with the game running</h3>
				<p>On a Mac: <code>Walka beacon</code>.</p>
				<p>Checks that the strip can be read from your screen.</p>
			</li>
			<li>
				<h3>In game</h3>
				<p>The checks in the <a href={LINKS.checklist}>in-game checklist</a>.</p>
			</li>
			<li>
				<h3>Then walk - slowly at first</h3>
			</li>
		</ol>
		<p>Keep the pad&#39;s remote in your hand the first time. You walk at your own risk, and Walka has not yet been tried on a real walking pad: read the <a href={LINKS.disclaimer}>disclaimer</a> first.</p>

		<h3 id="when-you-do-walk">When you do walk</h3>
		<ul>
			<li><strong>Start slow.</strong> The defaults sit where people settle on treadmill desks (1-2 mph), and the cap is 3.0 mph. Raise things gradually. Expect your aim with the mouse to be worse than seated.</li>
			<li><strong>Do the first sessions out of combat</strong>, somewhere quiet, until you know how the belt responds to your play style.</li>
			<li><strong>Use the <em>Steady</em> feel preset</strong> if the speed changes distract you.</li>
			<li><strong>Keep the top-left corner of the game window uncovered</strong>, and run the game windowed or borderless.</li>
			<li><strong>Leave the pad&#39;s buzzer on.</strong> Its beeps at a speed change can be a nuisance, but on most pads the same buzzer is the countdown before the belt starts - the one warning that it is about to move, for you and for whoever else is in the room.</li>
			<li><strong>Do not leave a session running when you walk away:</strong> stop it (or let the AFK pause do it).</li>
			<li><strong>Children and pets:</strong> a belt that starts when someone touches the keyboard is a hazard. Stop the session when you step off.</li>
		</ul>
	</section>

	<section id="is-and-is-not" class="prose">
		<h2>What Walka is, and is not</h2>
		<ul>
			<li><strong>A free hobby project, and an early one.</strong> Its author has not yet run it against a physical treadmill (see <a href="#not-a-guarantee">what has and has not been checked</a>).</li>
			<li><strong>Not a guarantee.</strong> The <a href={LINKS.safety}>long safety page</a> describes what the software is designed to do, and what its automated tests check against a simulated treadmill. It does not promise how Walka behaves with your treadmill, your computer or your Bluetooth. Software has bugs, Bluetooth drops, computers freeze.</li>
			<li><strong>Not a safety device.</strong> Nothing in Walka replaces the treadmill&#39;s own stop button, remote and safety key. Bluetooth is not an emergency stop.</li>
			<li><strong>Not a medical device, and not medical advice.</strong> Calories, steps, heart rate and everything worked out from them are estimates, for interest only. Do not use them to decide anything about your health, your diet, your medication or your training.</li>
			<li><strong>Not made, tested or approved by the maker of your treadmill.</strong> Driving a treadmill from software other than its maker&#39;s own may be something the maker does not support, and may affect its warranty. That is yours to check.</li>
			<li><strong>Not approved by Blizzard.</strong> See <a href="{resolve('faq/')}#is-this-allowed">Is this allowed?</a></li>
		</ul>
		<p>Walka is a fan-made tool. It is not affiliated with or endorsed by Blizzard Entertainment, UREVO, WELLFIT or any other maker of treadmills. World of Warcraft is a trademark of Blizzard Entertainment, Inc.; the other names belong to their owners.</p>
	</section>

	<section id="your-decision" class="prose">
		<h2>It is your decision</h2>
		<p>By downloading, installing or using Walka you accept that you do so at your own risk. Whether it is safe for you, for your treadmill and for the room you use it in is for you to decide - and so is whether to let anyone else use it on your equipment.</p>
		<p><strong>No warranty, and a limit of liability.</strong> In plain words: Walka is provided as is and as available, with no warranty of any kind, express or implied - not of safety, accuracy or fitness for a particular purpose, nor any other - and nothing in Walka, its documentation or its dashboard is a promise that it will work without fault or without interruption. To the fullest extent the law permits, its authors, contributors and copyright holders are not liable for any claim, damages or other liability arising from, out of or in connection with Walka or the use of it - in contract, in tort (including negligence) or otherwise - and that includes personal injury, death, damage to property or equipment, loss of data, and action taken against a game account. The law of some places does not allow all of this; nothing here takes away a right that the law says cannot be taken away, and where that is so, the above applies as far as the law allows.</p>
		<p>That is a summary, and it changes nothing in the text itself. The full text is <a href={LINKS.disclaimer}>DISCLAIMER.md</a>: please read it before your first walk.</p>
		<p>The dashboard shows the short form of the disclaimer the first time. Until you tick the box and press <em>I accept</em>, Walka does not start or steer a belt. It asks again when the disclaimer changes.</p>
	</section>

	<section id="report" class="prose">
		<h2>Found a safety or security problem?</h2>
		<p>Walka moves a treadmill belt, so a hole in it is not only a matter of data. If you have found a way to make Walka do something to the belt that its user did not ask for, please say so in private first.</p>
		<p><strong>How to report.</strong> On GitHub, open the Security tab of <a href={LINKS.repo}>Walka&#39;s repository</a> and choose <strong>Report a vulnerability</strong> (<a href={LINKS.reportVulnerability}>direct link</a>). Only the maintainer sees the report. Please do not open a public issue for it, and do not post the details anywhere else until there is a fix.</p>
		<p>Say what you did, what happened, on which version (the dashboard&#39;s footer and <code>Walka.exe --version</code> show it) and on which system. A way to repeat it is worth more than anything else.</p>
		<p>Walka is a hobby project with one maintainer: there is no bounty, and no promised time to answer. A report that concerns the belt is looked at before everything else. You will be told what was found and when a fixed version is out, and named in its notes if you want to be.</p>
		<p><strong>What counts.</strong> Anything that lets someone or something other than the person at the computer:</p>
		<ul>
			<li>start the belt, speed it up, or raise the speed cap - for example another web page open in the same browser, another device on the network, or a picture or video on the screen that is taken for the game&#39;s signal;</li>
			<li>keep STOP, the STOP hotkey or a stop at the treadmill from working, or restart a belt that was stopped;</li>
			<li>get past the disclaimer that has to be accepted before a belt is driven;</li>
			<li>read what Walka stores (walks, weight and height, heart rate) from outside the computer, or make Walka send anything anywhere;</li>
			<li>write files outside Walka&#39;s own folders and the game&#39;s addon folder;</li>
			<li>put something into a release that is not built from the repository&#39;s code.</li>
		</ul>
		<p>A case where Walka breaks one of its own rules is welcome too, even if no attacker is involved. If it could hurt someone before it is fixed, report it this way rather than in public.</p>
		<p><strong>What does not.</strong> A program that already runs on the same computer, someone with physical access to the computer or the treadmill, other software on a treadmill&#39;s Bluetooth, and antivirus programs that flag <code>Walka.exe</code> without naming anything. Ordinary bugs - the belt does not follow, a number is wrong, a treadmill is not found - go to the <a href={LINKS.issues}>issue tracker</a>.</p>
		<p>Only the latest release is fixed. If you run an older one, update first and try again. The whole policy is in <a href={LINKS.security}>SECURITY.md</a>.</p>
	</section>

	<section id="read-more" class="prose">
		<h2>The long versions</h2>
		<ul>
			<li><a href={LINKS.safety}>docs/SAFETY.md</a> - every rule the belt is built to follow, and what has and has not been verified.</li>
			<li><a href={LINKS.disclaimer}>DISCLAIMER.md</a> - risk, health, no warranty, limit of liability, names.</li>
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

	/* ---- stopping the belt: the four ways, fastest first ---- */
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

	.ways kbd {
		font-size: 0.8em;
	}

	/* A combination of keys stays on one line, and so does a short command. */
	.keys,
	code {
		white-space: nowrap;
	}

	/* Keys inside running text: small enough not to push the lines apart. */
	p kbd {
		font-size: 0.8em;
	}

	/* the dashboard's own red button, in small */
	.stop {
		display: inline-block;
		padding: 0.08em 0.6em;
		border-radius: 6px;
		background: var(--stop);
		color: #fff;
		font-size: 0.82em;
		font-weight: 700;
		letter-spacing: 0.08em;
	}

	/* the remark that belongs to the four ways stands right under them */
	.with-it {
		margin-top: 0.75rem;
	}

	/* ---- the parts of the long section ---- */
	.within {
		margin-top: 2.25rem;
		padding-block: 1.15rem 1.25rem;
		border-block: 1px solid var(--line);
	}

	.within .label {
		color: var(--ink-3);
	}

	.within ol {
		columns: 2;
		column-gap: 2.5rem;
		margin-top: 0.65rem;
		padding: 0;
		list-style: none;
		font-size: var(--text-small);
		line-height: 1.4;
	}

	.within li {
		margin: 0;
		break-inside: avoid;
	}

	.within a {
		display: block;
		padding-block: 0.4rem;
		text-decoration: none;
	}

	.within a:hover {
		text-decoration: underline;
	}

	.within + h3 {
		margin-top: 1.75em;
	}

	/* ---- a lost signal, step by step: a line of time, read downwards ---- */
	.lost {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.lost-legend,
	.lost dl > div {
		display: grid;
		grid-template-columns: 12.5rem minmax(0, 1fr);
		gap: 0 1.25rem;
		padding: 0.85rem 1.15rem 0.85rem 2.75rem;
	}

	.lost-legend {
		border-bottom: 1px solid var(--line);
		color: var(--ink-3);
		font: 600 var(--text-label) / 1.4 var(--font-text);
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	.lost dl > div {
		position: relative;
	}

	.lost dl > div + div {
		border-top: 1px solid var(--line);
	}

	.lost dt {
		color: var(--ink);
		font-weight: 600;
	}

	/* the moment on the line ... */
	.lost dl > div::before {
		content: '';
		position: absolute;
		left: 1.15rem;
		top: 1.3rem;
		z-index: 1;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 50%;
		background: var(--gold);
	}

	/* ... and the line, from the first moment to the last */
	.lost dl > div::after {
		content: '';
		position: absolute;
		left: calc(1.4rem - 0.5px);
		top: -1px;
		bottom: 0;
		width: 1px;
		background: var(--gold-soft);
	}

	.lost dl > div:first-child::after {
		top: 1.5rem;
	}

	.lost dl > div:last-child::after {
		bottom: auto;
		height: 1.5rem;
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
		.within ol {
			columns: 1;
		}

		.within a {
			padding-block: 0.55rem;
		}

		/* time above, what the belt does below it */
		.lost-legend,
		.lost dl > div {
			grid-template-columns: minmax(0, 1fr);
			gap: 0.2rem;
			padding-left: 2.5rem;
		}

		.lost dl > div::before {
			left: 1rem;
		}

		.lost dl > div::after {
			left: calc(1.25rem - 0.5px);
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
