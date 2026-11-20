<script lang="ts">
	import { resolve } from '$app/paths';
	import Article from '#lib/components/Article.svelte';
	import Callout from '#lib/components/Callout.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import PageHero from '#lib/components/PageHero.svelte';
	import Picture from '#lib/components/Picture.svelte';
	import Seo from '#lib/components/Seo.svelte';
	import ThemedPicture from '#lib/components/ThemedPicture.svelte';
	import ShareThemes from '#lib/components/how-it-works/ShareThemes.svelte';
	import SignalDiagram from '#lib/components/how-it-works/SignalDiagram.svelte';
	import StripDrawing from '#lib/components/how-it-works/StripDrawing.svelte';
	import { DOWNLOADS, LINKS } from '#lib/site.ts';

	const SECTIONS = [
		{ id: 'two-pieces', label: 'Two pieces' },
		{ id: 'only-listens', label: 'Walka only listens' },
		{ id: 'signal', label: 'How the signal travels' },
		{ id: 'what-walka-looks-at', label: 'What Walka looks at' },
		{ id: 'get-started', label: 'Get started' },
		{ id: 'using-it', label: 'Using it' },
		{ id: 'numbers', label: 'The numbers' },
		{ id: 'share', label: 'A picture to share' },
		{ id: 'road-map', label: 'The road map' },
		{ id: 'extras', label: 'Heart rate, other apps, other games' },
		{ id: 'read-more', label: 'Where to read more' }
	];

	// How wide a picture that fills the text column is drawn.
	const COLUMN = '(min-width: 60rem) 54.5rem, calc(100vw - 2.5rem)';
</script>

<!-- The play button of the HUD, drawn: Walka's README shows it as a symbol. -->
{#snippet play()}
	<svg class="play" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
		<circle cx="8" cy="8" r="7.25" />
		<path d="M6.4 4.9v6.2L11.3 8z" />
	</svg>
{/snippet}

<Seo
	title="How Walka works"
	description="What Walka is, what it looks at, and how to get from download to first walk. It only listens to your treadmill. Experimental, and at your own risk."
/>

<PageHero label="The long version" title="How Walka works">
	<p>
		An addon in the game knows which character you are playing, and a small program on your computer listens to your
		walking pad. This page says what each one does, what Walka looks at, and how to get from download to your first
		walk.
	</p>
	<p class="risk">
		<span class="risk-icon"><Icon name="warning" size={20} /></span>
		<span>
			<strong>Experimental.</strong> Walka has not yet been tried on a real walking pad. Walking while you play is at
			your own risk: read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.
		</span>
	</p>
</PageHero>

<Article sections={SECTIONS}>
	<section id="two-pieces" class="prose">
		<h2>Two pieces</h2>
		<p>
			Walka is a walking log for people who walk on an under-desk pad while they play
			<strong>World of Warcraft: Forever</strong>. You walk at the speed you set on the pad; Walka counts your time,
			steps, distance and calories - for this walk and every one before it - shows them in an in-game HUD, and keeps
			them per character.
		</p>
		<p>It is two pieces, and you need both:</p>
		<ul class="pieces">
			<li>
				<span class="piece-icon"><Icon name="addon" size={26} /></span>
				<p class="label">In the game</p>
				<h3>The addon</h3>
				<p>
					Marks your walking sessions, knows which character they belong to, and shows the HUD, history, journey and
					road map in game.
				</p>
			</li>
			<li>
				<span class="piece-icon"><Icon name="window" size={26} /></span>
				<p class="label">On your computer</p>
				<h3>The companion</h3>
				<p>
					<code>Walka.exe</code>, or <code>Walka</code> on a Mac - a small app that reads the addon's signal off the
					screen, listens to the treadmill over Bluetooth, records your walks, and shows a live dashboard in your
					browser.
				</p>
			</li>
		</ul>
		<p>
			Neither of them moves the belt. You start it, stop it and set its speed at the treadmill itself: see
			<a href="#only-listens">Walka only listens</a>.
		</p>
		<p>
			Walka is built around the <strong>UREVO Strol 2E (URTM030)</strong>, and made to read any treadmill that reports
			its data over standard Bluetooth FTMS. The treadmill does not have to be one that apps can control: Walka controls
			nothing. None of them has been tried by Walka's author on the real machine yet. See
			<a href="{resolve('downloads/')}#which-treadmills-work">which treadmills work</a>; the
			<a href={LINKS.hardware}>hardware notes</a> say what is known, and where it comes from.
		</p>
		<p>
			The companion also works without any game: a walk is recorded whenever the belt moves. See
			<a href="#no-game">Other games, or no game</a>.
		</p>
		<p>
			Walka is a fan-made tool. It is not affiliated with or endorsed by Blizzard Entertainment, UREVO, WELLFIT or any
			other maker of treadmills.
		</p>
	</section>

	<section id="only-listens" class="prose">
		<h2>Walka only listens</h2>
		<p class="pledge">
			<strong>Walka does not start, stop, pause or steer the belt.</strong> Not from the game, not from the dashboard,
			not when something goes wrong.
		</p>
		<ul>
			<li>
				<strong>You start the belt</strong> with the treadmill's remote or buttons, and <strong>you stop it</strong> the
				same way - or with its safety key. Keep the remote where your hand finds it without looking.
			</li>
			<li><strong>The speed is the one you set</strong> at the treadmill. Walka reads it; it cannot change it.</li>
			<li>
				<strong>Closing Walka, or pressing <em>Disconnect</em>,</strong> ends the recording and lets go of the
				treadmill. The belt goes on doing what it was doing.
			</li>
			<li><strong>When you step off, stop the belt.</strong> Nothing else will.</li>
		</ul>
		<p>
			What Walka does to a treadmill is this, and no more: it connects, reads the speed range the treadmill says it has,
			and switches on the notifications through which the treadmill reports its speed, distance and status. The channel
			through which an app could control the belt (the <em>Fitness Machine Control Point</em>) is never written to, and
			the code that once did has been deleted - there is no setting that brings it back. How that is checked:
			<a href={LINKS.safety}>docs/SAFETY.md</a>.
		</p>
		<p>
			So the belt is entirely yours - and so is stopping it. Walka is not a safety device and cannot stop a belt: the
			treadmill's own stop button, remote and safety key are what does. You are walking while you look at a game, and
			that is at your own risk: see <a href={resolve('safety/')}>Safety</a> and the
			<a href={LINKS.disclaimer}>disclaimer</a>.
		</p>

		<h3 id="older-versions">Older versions</h3>
		<p>
			Versions before 0.7 were different: the belt followed your character, and the companion started, stopped and
			steered it. That has been taken out, not switched off. A motorised belt under someone who is looking at a game was
			not worth the risk of a program getting it wrong. Those versions have been withdrawn: do not use one.
		</p>
		<p>
			<strong>If you have one,</strong> it could move the belt. Those downloads have been removed; replace it with
			<a href={resolve('downloads/')}>the current one</a> and delete the old <code>Walka.exe</code>. Your walks and
			settings are kept (the settings that were about steering the belt are simply no longer read), and the addon is
			updated with <em>Install</em> on the dashboard.
		</p>
		<p>
			The current one is experimental: it has not yet been tried on a real walking pad, and walking while you play is at
			your own risk. Read the <a href={LINKS.disclaimer}>disclaimer</a> before you download.
		</p>
	</section>

	<section id="signal" class="prose">
		<h2>How the signal travels</h2>
		<p>
			An addon cannot use Bluetooth, files or the network. The one thing it can do that the outside world can see is
			draw. So the signal goes like this:
		</p>
		<div class="wide">
			<SignalDiagram />
		</div>
		<ol class="round">
			<li>
				<strong>The addon draws, the companion reads.</strong> The addon draws its state as a thin strip of black and
				white squares in the top-left corner of the game window, ten times a second. The companion takes a tiny
				screenshot of that corner and decodes it.
			</li>
			<li>
				<strong>The pad reports, the companion listens.</strong> Over Bluetooth the walking pad reports its speed, its
				distance and, on some pads, its steps. That goes one way only: the companion sends the pad no commands.
			</li>
			<li>
				<strong>A file back to the game.</strong> An addon cannot receive live data either. So the companion writes its
				<em>measured</em> numbers to a file that the game loads at login or on <code>/reload</code>.
			</li>
		</ol>
		<p class="pledge">
			<strong>Walka never sends input to the game</strong> - no key presses, no mouse input, no memory reading.
		</p>
		<p>
			The strip is small: 86 squares in a row, 4 pixels each unless you change the size. That is 344 pixels wide and 4
			high.
		</p>
		<p>
			Nothing on the strip reaches the treadmill. The one thing on it that the companion acts on is which walking
			session a walk belongs to, and so which character. The rest is for display.
		</p>
		<p>
			Because nothing live comes back into the game, the HUD shows the addon's own estimate, counted from the pace you
			tell it. The dashboard always shows the measured numbers live. More under <a href="#your-pace">Your pace</a> and
			<a href="#numbers">The numbers</a>.
		</p>
		<p>
			If the companion cannot see the strip - a loading screen, the game minimised, another window on top of that corner
			- that is expected, and nothing depends on it but the filing: the walk is recorded all the same. In the middle of
			a session the walk stays with that session; when the game is closed, the session is over.
		</p>
		<p>
			None of this is the same as permission. Walka is not approved by Blizzard, and you use it at your own risk. The
			<a href="{resolve('faq/')}#is-this-allowed">FAQ</a> has the honest answer to "Is this allowed?".
		</p>
	</section>

	<section id="what-walka-looks-at" class="prose">
		<h2>What Walka looks at, exactly</h2>
		<p>Walka looks at the corner of the game window, the way a screenshot tool does.</p>
		<StripDrawing />
		<p>This is what it looks at, when, and what becomes of it:</p>
		<ul>
			<li>
				<strong>The top-left corner of the game window</strong> - a picture about 700 pixels wide and 12 high, some
				fifteen times a second. On Windows and on a Mac Walka asks the system where the game window is, and once it has
				found the game it looks nowhere else. If the game is then minimised or closed, nothing is read.
			</li>
			<li>
				<strong>From when Walka is started until it first finds the game window</strong> - that is, while the game is
				not running yet - it also looks at the top-left corner of each monitor and, every five seconds, takes one
				picture of the whole screen to search it for the strip. (So does a system that cannot say where a window is, all
				the time.) <code>Walka.exe beacon</code>, the command that checks whether the strip can be read, does the same
				once.
			</li>
			<li>
				<strong>What happens to a picture:</strong> it is searched for the strip, in the computer's memory, and then
				dropped. No picture is saved or sent anywhere, and of what is on it nothing is kept but the strip's ten bytes.
			</li>
			<li>
				<strong>What the strip says:</strong> whether a walking session is running or paused, how fast the character is
				going and how (on foot, mounted, swimming, flying, on a flight path), whether you are AFK, and the numbers of
				your character's <a href="#share">journey</a>.
			</li>
			<li>
				<strong>What the strip does not say:</strong> whether your character is fighting, dead or resting. The
				companion does not need to know, so the addon does not say.
			</li>
		</ul>
		<p>
			<a href={LINKS.protocol}>The protocol</a> lists every field of the strip. One is worth knowing about here: among
			the journey numbers is your character's name, without the realm. The realm is never drawn on screen: the companion
			is only sent a number that tells your characters apart.
		</p>
		<p>
			Of the game's files the companion touches only Walka's own: the addon folder (it installs the addon and writes
			<code>CompanionData.lua</code> there) and the addon's saved file
			<code class="long">WTF\<wbr />Account\<wbr />...\<wbr />SavedVariables\<wbr />Walka.lua</code>, which it only reads.
		</p>
		<p>
			Nothing is uploaded. Your settings and walks are kept on your own computer, in <code>%APPDATA%\Walka</code> on
			Windows and <code class="long">~/Library/<wbr />Application Support/<wbr />Walka</code> on a Mac. The dashboard
			is only reachable from the computer itself: it shows your walks, weight and height and has no password, so it is
			not offered to other devices on your network.
		</p>
	</section>

	<section id="get-started" class="prose">
		<h2>Get started</h2>
		<Callout kind="warning" title="Early version - not yet tried on a real walking pad">
			<p>
				The pad and the game have not been tested against this code. Nothing in Walka can move the belt, so what there
				is to check is whether your walk is <em>counted right</em>: see
				<a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a>. And for you, not for Walka:
				start slow, and know where the remote is.
			</p>
		</Callout>
		<Callout kind="caution" title="Walking while you play is at your own risk">
			<p>
				Your eyes are on a game, not on your feet. Walka comes with no warranty, and it is not a safety device or a
				medical device. If you have a health condition, are pregnant or are in any doubt, ask a doctor first - and stop
				if you feel dizzy or unwell. The whole of it: the <a href={LINKS.disclaimer}>disclaimer</a>.
			</p>
		</Callout>
		<p>
			<strong>You need:</strong> a Windows 10 or 11 PC or a Mac (Apple silicon or Intel), with Bluetooth; a walking pad
			or treadmill that shows its numbers to apps over Bluetooth (a UREVO Strol 2E, a WELLFIT TM029 Pro, or another
			Bluetooth FTMS treadmill - see <a href="{resolve('downloads/')}#which-treadmills-work">which treadmills work</a>);
			and World of Warcraft: Forever.
		</p>
		<p>
			<em>
				These steps are for Windows. On a Mac, steps 1 and 2 are different - see <a href="#on-a-mac">On a Mac</a> - and
				the rest is the same.
			</em>
		</p>
		<ol class="steps">
			<li>
				<h3>Download <code>Walka.exe</code></h3>
				<p>
					From the <a href={resolve('downloads/')}>downloads page</a>. It goes to your <em>Downloads</em> folder. If the
					browser says it "isn't commonly downloaded", choose <strong>Keep</strong> (in Edge: <strong>...</strong> →
					<strong>Keep</strong> → <strong>Show more</strong> → <strong>Keep anyway</strong>).
				</p>
			</li>
			<li>
				<h3>Double-click it</h3>
				<p>
					There is nothing to install: it is one file, and you just open it. A black window opens: that is Walka.
					<strong>Leave it open while you walk</strong> - closing it ends the recording (the belt is not touched). The
					<em>dashboard</em> page opens in your browser (if not, go to <code>127.0.0.1:8787</code>).
				</p>
				<p>
					The first time, Windows may say <em>"Windows protected your PC"</em>. Click <strong>More info</strong>, then
					<strong>Run anyway</strong>. Walka is not signed by a company, so Windows does not recognise it yet. It does
					not mean that anything was found: see
					<a href="{resolve('downloads/')}#is-the-download-safe">Is the download safe?</a>
				</p>
			</li>
			<li>
				<h3>Follow <em>Getting started</em> on the dashboard</h3>
				<p>It is a list that ticks each step off as you do it:</p>
				<ul>
					<li>
						<strong>Connect the treadmill.</strong> Switch it on and close its own phone app (UREVO, WELLFIT Fitness,
						...): most treadmills accept only one Bluetooth connection. Don't pair it in Windows Bluetooth settings -
						Walka finds it by itself.
					</li>
					<li>
						<strong>Install the game addon.</strong> Click <em>Install</em> on the dashboard, then restart the game and
						tick <em>Walka</em> in the AddOns list. (By hand instead: unzip the
						<a href={DOWNLOADS.addon}>addon download</a> into
						<code class="long">World of Warcraft\<wbr />_forever_\<wbr />Interface\<wbr />AddOns</code>.)
					</li>
					<li>
						<strong>Let Walka see the game.</strong> Start World of Warcraft in <em>Windowed</em> or
						<em>Windowed (Fullscreen)</em> mode and keep the top-left corner of the game uncovered. This step ticks
						itself when the first signal arrives.
					</li>
					<li>
						<strong>Enter your weight and height.</strong> Calories depend on your weight; the step estimate on your
						height.
					</li>
				</ul>
			</li>
			<li>
				<h3>Walk</h3>
				<p>
					In the game, click the play button {@render play()} on the small Walka box, the HUD (or type
					<code>/walka start</code>): that says "this walk is for this character". Then step onto the pad and start the
					belt <strong>with the treadmill's own remote</strong>, at the speed you like.
				</p>
			</li>
		</ol>
		<p class="pledge">
			<strong>The belt is yours.</strong> Start it, stop it and change its speed at the treadmill - its remote, its
			buttons, its safety key. Walka has no button for any of that.
		</p>

		<h3 id="on-a-mac">On a Mac</h3>
		<Callout kind="warning" title="The Mac version is new">
			<p>
				GitHub's Macs build it, run its tests and check that the finished program starts, records a walk on a simulated
				pad and saves it when it is closed. Nobody has yet tried it with the game and a walking pad on a real Mac. Do
				everything under <a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a> - and if you
				do, <a href={LINKS.issues}>say how it went</a>.
			</p>
		</Callout>
		<p>
			Steps 1 and 2 are different on a Mac. You download the zip for your Mac (Apple chip or Intel processor), and the
			first time macOS has to be told to open the <code>Walka</code> file inside it. The
			<a href="{resolve('downloads/')}#first-time-mac">downloads page</a> has those first-run steps.
		</p>
		<p>
			A Terminal window then opens: that is Walka. Leave it open while you walk - closing it ends the recording (the
			belt is not touched). From there it is step 3 above.
		</p>
		<p>
			macOS asks before a program may use Bluetooth or look at the screen. Walka runs inside Terminal, so it asks about
			<strong>Terminal</strong>: <em>Bluetooth</em>, to listen to the walking pad, and <em>Screen Recording</em>, to see
			the strip the addon draws.
		</p>
		<p>What is different from Windows:</p>
		<ul>
			<li>
				<strong>The game</strong> is looked for in <code class="long">/Applications/<wbr />World of Warcraft</code>. If yours is somewhere
				else, choose the addon folder yourself under <em>Settings → Game addon</em>.
			</li>
			<li><strong>Your settings and walks</strong> are in <code class="long">~/Library/<wbr />Application Support/<wbr />Walka</code>.</li>
			<li>
				<strong>Commands</strong> like <code>probe</code> and <code>beacon</code> are typed in Terminal: drag the
				<code>Walka</code> file into a Terminal window, type a space and <code>probe</code>, press Return.
			</li>
		</ul>
	</section>

	<section id="using-it" class="prose">
		<h2>Using it</h2>
		<p>
			Walking while you look at a game is at your own risk, and Walka has not yet been tried on a real walking pad. Read
			the <a href={LINKS.disclaimer}>disclaimer</a> first, and do the checks under
			<a href="{resolve('safety/')}#before-your-first-walk">Before your first walk</a>.
		</p>
		<p>
			In game, press the play button {@render play()} on the HUD (or type <code>/walka start</code>): a walking session
			starts for the character you are playing. Step onto the pad and start the belt with the treadmill's remote, at
			whatever speed you like. <code>/walka</code> shows or hides the HUD.
		</p>
		<p>The companion records the walk from what the treadmill reports. A walk is whatever the belt does:</p>
		<ul>
			<li>it is counted while the belt moves, and not while it stands still;</li>
			<li>with a session running in the game it is filed under that session, and so under your character;</li>
			<li>
				with no session - another game, no game at all - it is recorded all the same, as a walk of its own
				(<em>No game session</em> in the dashboard's history).
			</li>
		</ul>
		<figure class="figure wide">
			<ThemedPicture
				name="dashboard"
				narrow="dashboard-phone"
				sizes={COLUMN}
				narrowSizes="calc(100vw - 2.75rem)"
				alt="The dashboard's Live view while a walk is recorded: the belt's speed as the treadmill reports it. On a wide screen it also shows this walk's time, distance, steps, calories and heart rate, and the state of the connections."
			/>
			<figcaption>The dashboard's Live view, with the demo character.</figcaption>
		</figure>

		<h3 id="your-pace">Your pace</h3>
		<p>
			<strong>Tell the addon your pace.</strong> An addon cannot be told what the treadmill is doing while the game
			runs, so the HUD counts with the speed you say the belt is set to: <code>/walka pace 1.5</code>, the
			<strong>-</strong> and <strong>+</strong> buttons on the HUD, or <em>Your pace</em> in <code>/walka options</code>.
		</p>
		<p>
			It starts at 1.5 mph - people settle at 1-2 mph on a treadmill desk. The speed on the HUD is that pace: it is
			yours, not your character's, and it is not read from the belt.
		</p>
		<p>
			Your pace only feeds the HUD's estimate; it changes nothing at the treadmill, and the measured numbers replace the
			estimate later: see <a href="#estimated">Estimated now, measured later</a>.
		</p>

		<h3 id="pause">Pause, stop and going AFK</h3>
		<p>
			<strong>Pause</strong> and <strong>Stop</strong> are on the HUD too. They pause and end the <em>session</em> - the
			addon's count - and nothing else: stop the belt yourself, at the treadmill, when you step off. The companion
			records for as long as the belt moves, paused in the game or not.
		</p>
		<p>
			Going AFK pauses the session automatically (you can turn that off); it carries on when your character next moves.
			A pause you asked for yourself lasts until you press the play button {@render play()} (or type
			<code>/walka resume</code>).
		</p>

		<h3 id="commands">Commands</h3>
		<div class="table stack commands">
			<table>
				<thead>
					<tr><th scope="col">Command</th><th scope="col">What it does</th></tr>
				</thead>
				<tbody>
					<tr><th scope="row"><code>/walka</code></th><td>show or hide the HUD</td></tr>
					<tr>
						<th scope="row"><code>/walka start</code>, <code>pause</code>, <code>resume</code>, <code>stop</code></th>
						<td>mark the walking session</td>
					</tr>
					<tr>
						<th scope="row"><code>/walka pace 1.5</code></th>
						<td>the speed your treadmill is set to, for the HUD's estimate</td>
					</tr>
					<tr><th scope="row"><code>/walka history</code></th><td>past sessions, totals, 7-day chart</td></tr>
					<tr><th scope="row"><code>/walka journey</code></th><td>your character's journey so far</td></tr>
					<tr>
						<th scope="row"><code>/walka map</code></th>
						<td>open the world map with your character's road on it</td>
					</tr>
					<tr><th scope="row"><code>/walka options</code></th><td>settings</td></tr>
					<tr><th scope="row"><code>/walka status</code></th><td>what the addon is doing right now</td></tr>
					<tr>
						<th scope="row"><code>/walka weight 180lb</code>, <code>/walka height 5'11</code></th>
						<td>your body, if you do not run the companion</td>
					</tr>
					<tr><th scope="row"><code>/walka units mph</code> or <code>kmh</code></th><td>display units</td></tr>
					<tr>
						<th scope="row"><code>/walka beacon on</code>, <code>off</code> or <code>size 2-8</code></th>
						<td>the signal strip</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section id="numbers" class="prose">
		<h2>The numbers</h2>
		<p>
			Walka is not a medical device, and nothing in it is medical advice. Calories, steps and heart rate are estimates,
			for interest only. Do not use them to decide anything about your health, your diet, your medication or your
			training.
		</p>

		<h3 id="estimated">Estimated now, measured later</h3>
		<p>
			The HUD's live numbers are marked <code>~</code>: they are the addon's estimate, counted from
			<a href="#your-pace">your pace</a>. After a walk, press <strong>Sync</strong> in the history window (it reloads
			the interface; a session in progress carries on) or just log in next time. The history then switches that session
			to what the treadmill measured.
		</p>
		<p>The dashboard shows measured values the whole time - put it on a second monitor.</p>

		<h3 id="in-combat">In combat</h3>
		<p>
			WoW: Forever hides your character's exact speed from addons during combat, and Walka does not work around that.
			While it is hidden the addon estimates: moving or not, at your last known run speed. That only matters for the
			road and the journey's "character steps" - your own walk is counted from the treadmill, not from the character.
			The HUD tooltip tells you when this is happening.
		</p>

		<h3 id="calories-and-steps">Calories and steps</h3>
		<ul>
			<li>
				<strong>Calories</strong> come from belt speed and your weight, using an equation validated at slow desk-walking
				speeds (the usual treadmill formula reads 11-35% low there). Expect roughly ±10% for an individual. The dashboard
				also shows how much of it is <em>on top of</em> what sitting would have burned.
			</li>
			<li>
				<strong>Steps</strong> are the treadmill's own count if it reports one; otherwise they are estimated from belt
				speed and your height. People differ by 6-20% at slow speeds, so there is a <em>step calibration</em> setting:
				count your steps for a minute, divide by what Walka counted.
			</li>
			<li>
				A <strong>wrist watch will not count these steps</strong> - with your hands on the keyboard your arm does not
				swing. Walka's count is the record.
			</li>
		</ul>
	</section>

	<section id="share" class="prose">
		<h2>Your journey, and a picture to share</h2>
		<p>
			Walka keeps a record for every character you play: the level it has reached, its time played and how far it has
			travelled on foot - and next to that the real walking <em>you</em> did while playing it.
			<code>/walka journey</code> shows it in game, and the dashboard's <strong>Share</strong> page turns it into a
			picture you can post.
		</p>
		<div class="wide">
			<ShareThemes />
		</div>
		<ol>
			<li>
				Log in with the companion running. The character's numbers reach the companion within about ten seconds (over
				the same strip as everything else) and are remembered there, so the picture can also be made later, with the
				game closed.
			</li>
			<li>
				Dashboard → <em>Share</em>. Pick the character if you have several, change the words, tick what should be on the
				picture, and choose a theme (Sapphire, Ember, Wildwood, Frost or Parchment) and a size: portrait 1080×1350,
				square 1080×1080, story 1080×1920 or wide 1200×675.
			</li>
			<li><strong>Download PNG</strong> - or <strong>Copy image</strong> and paste it straight into a post or a chat.</li>
		</ol>
		<figure class="figure wide">
			<ThemedPicture
				name="share-page"
				sizes={COLUMN}
				alt="The dashboard's Share page: the picture as it will be, with Download PNG and Copy image under it, and beside it the choices for the numbers and the words"
			/>
			<figcaption>The dashboard's Share page, with the demo character.</figcaption>
		</figure>

		<h3 id="on-the-picture">What is on it</h3>
		<div class="table stack on-it">
			<table>
				<thead>
					<tr><th scope="col">On the picture</th><th scope="col">What it is</th></tr>
				</thead>
				<tbody>
					<tr>
						<th scope="row"><strong>My steps</strong></th>
						<td>
							Your real-world steps, and under them the distance you walked. With <em>This character's walks</em> these
							are the walks you did while playing that character, as the addon counts them; with <em>All my walks</em>
							they are everything the companion has recorded, with any game or none.
						</td>
					</tr>
					<tr>
						<th scope="row"><strong>My road</strong></th>
						<td>
							The road your character has travelled, as a line: see
							<a href="#road-on-the-picture">The road on the picture</a>.
						</td>
					</tr>
					<tr>
						<th scope="row"><strong>Character level</strong></th>
						<td>The level, and the level cap of the game.</td>
					</tr>
					<tr>
						<th scope="row"><strong>Time played</strong></th>
						<td>The game's own <code>/played</code> for this character.</td>
					</tr>
					<tr>
						<th scope="row"><strong>Character steps</strong></th>
						<td>
							How far the character has gone on foot since Walka began tracking it, as steps, with the in-game distance
							under it.
						</td>
					</tr>
					<tr>
						<th scope="row"><strong>Calories</strong></th>
						<td>
							The same estimate as everywhere else in Walka (see <a href="#calories-and-steps">Calories and steps</a>),
							rounded.
						</td>
					</tr>
					<tr>
						<th scope="row"><em>Totals through ...</em></th>
						<td>The day the numbers were last received from the game.</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p>A <code>~</code> in front of a number means "about":</p>
		<ul>
			<li>
				<strong>Character steps are a convention.</strong> The game does not count steps, so Walka says a character
				takes 2,000 steps to the in-game mile of 1,760 yards - 0.88 yards a step. "On foot" is moving while not mounted,
				not on a flight path, not flying and not swimming; running back as a ghost and jumping count. In combat, where
				the game hides the exact speed, the addon's estimate is used. Distance is counted from the day the addon was
				installed, not from level 1.
			</li>
			<li><strong>Calories</strong> are always an estimate.</li>
			<li>
				<strong>Your own steps</strong> carry a <code>~</code> only while part of them is still the addon's estimate,
				until the game has loaded what the treadmill measured (<em>Sync</em>, or the next login).
			</li>
		</ul>

		<h3 id="road-on-the-picture">The road on the picture</h3>
		<p>
			The road the addon records is drawn on the picture over a small map of the continent - not the game's map, but a
			low-poly drawing of Walka's own.
		</p>
		<div class="wide road">
			<ul>
				<li>
					The stretches you walked <strong>on the treadmill</strong> - a walking session was running in the game - are a
					bright line; what the character travelled without one is the same line in a quieter colour; flight paths are
					fine dashes. A key under the map shows a piece of each kind of line with what it means - and how much of the
					road you walked for real.
				</li>
				<li>
					<em>START</em> marks where the road begins, a gem marked <em>NOW</em> with the character's level where it is,
					and a small numbered stud every tenth level reached on the way.
				</li>
				<li>Under the map: the length of the road in in-game miles (flights not counted).</li>
			</ul>
			<figure class="road-detail">
				<!-- The Sapphire Share picture again, showing only its "My road" tile. -->
				<div class="detail">
					<Picture
						name="share-sapphire"
						sizes="(min-width: 70rem) 42rem, 50rem"
						alt="The road on a Share picture: a small low-poly map of two continents with the road on it as a line, START where it begins, numbered studs at levels 10 and 20, a gem marked NOW with the level, and under the map the length of the road and a key to the kinds of line"
					/>
				</div>
				<figcaption>The road on a Share picture, with the demo character.</figcaption>
			</figure>
		</div>
		<p>
			The road is far too much for the strip on the screen, so it takes the slow way: the game saves it when you log out
			or type <code>/reload</code>, and the companion reads it from the game's own file. So the road on the picture is
			as of your last logout or <code>/reload</code> - the Share page says when that was - while the numbers next to it
			are live. Type <code>/reload</code> before you make the picture and both are current.
		</p>
		<p>
			The file is only ever read, never changed. Untick <em>My road</em> and the picture is as it was without it.
		</p>

		<h3 id="private-by-default">Private by default</h3>
		<ul>
			<li>
				The picture is drawn in your browser from numbers that are already on your computer. Nothing is uploaded and
				nothing is posted for you.
			</li>
			<li>
				The road is read from a file on your computer and goes no further than the page that draws it. On the picture it
				is a line on a simplified map and the names of the continents (or of another land your road is on, such as
				Zephras Isle) - no zones, no place names, no coordinates.
			</li>
			<li>
				Your character's name, and the small line with your weight and average pace, are <strong>off</strong> until you
				tick them. The realm never leaves the game: the companion is only sent a number that tells your characters
				apart.
			</li>
			<li>The downloaded file is named after the date, never after the character.</li>
			<li>
				The design is Walka's own and is drawn by the page itself: no game artwork, logos or fonts are used. The
				continents on the map are Walka's own drawing too (see the
				<a href={LINKS.thirdParty}>third-party notices</a> for how their outlines were made).
			</li>
		</ul>
	</section>

	<section id="road-map" class="prose">
		<h2>The road map</h2>
		<p>
			From the moment the addon is installed it keeps the road your character travels - install it before you start a
			character and the road begins at level 1. It is drawn <strong>on the game's own world map</strong>: open the map
			as you always do (or type <code>/walka map</code>, or pick <em>Road map</em> in the HUD's right-click menu) and the
			road is on it, on every map of the world - all of Azeroth, a continent, or a zone in the game's full detail.
		</p>
		<p>What the colours and the brightness mean:</p>
		<ul>
			<li>the road is coloured by level, a colour for every ten levels;</li>
			<li>
				the stretches you walked <strong>on the treadmill</strong> - a walking session was running - are bright, with a
				soft glow; what your character travelled without one is dimmer;
			</li>
			<li>flight paths are thin and pale;</li>
			<li>
				it lies over the map's picture and under what the map marks (quest icons, your arrow), and it takes no clicks:
				the map works as it did.
			</li>
		</ul>
		<p>
			<strong>What is recorded:</strong> a point every twenty yards (fewer on flight paths, more where the road bends).
			Nothing while you stand still, and nothing inside dungeons, raids and battlegrounds - the game does not say where
			you are there. A road from level 1 to 60 comes to about a megabyte.
		</p>
		<p>
			<strong>Where it stays:</strong> it is saved per character with your other addon settings and never leaves your
			computer. The companion reads it there, to draw it on the Share picture.
		</p>
		<p>
			<strong>Switching it off:</strong> <code>/walka road off</code> stops the recording (<code>on</code> starts it
			again); what is recorded so far is kept. To hide the road and keep recording, use the small
			<em>Walka road</em> button in the top-left corner of the map, or <code>/walka map off</code> and
			<code>/walka map on</code>. The options page (<em>Your road</em>) has these as tick boxes.
		</p>
		<Callout kind="note">
			<p>
				The addon has been tested under a mock of the game client, not in the game itself. The road recorder and the
				maps use game calls that could only be checked against Blizzard's documentation and other addons' source. If the
				road does not show, <code>/walka mapcheck</code> prints what the game answered when Walka asked for its maps.
			</p>
		</Callout>
		<p>
			The way the road is recorded and drawn follows
			<a href="https://github.com/Jordanburch101/road-to-sixty">Road to Sixty</a> by Jordan Burch (MIT licence, see the
			<a href={LINKS.thirdParty}>third-party notices</a>) - an addon made for exactly this, with a replay of the whole
			journey, a journal of quests and kills, and much more. It runs fine next to Walka.
		</p>
		<p>
			With <a href="https://github.com/openmap-world/openmap">OpenMap</a> installed the road is drawn on OpenMap's map
			in the same way. Nothing has to be set up, and nothing of OpenMap is in Walka: it only calls OpenMap when OpenMap
			is there.
		</p>
	</section>

	<section id="extras" class="prose">
		<h2>Heart rate, other apps, other games</h2>

		<h3 id="heart-rate">Heart rate (optional)</h3>
		<p>
			Any Bluetooth heart-rate sensor works: a chest strap, an arm band, or a watch that can broadcast. Dashboard →
			<em>Settings → Heart-rate sensor → Scan</em>. Watch-to-Windows Bluetooth is known to be hit-and-miss, so a cheap
			Bluetooth chest strap or arm band is the dependable option.
		</p>
		<p>
			Heart rate is shown live and stored with each walk. It only drives the calorie figure when you have entered age
			and sex <em>and</em> your heart rate is in real exercise territory (above 60% of the maximum for your age, for a
			minute). At desk-walking heart rates the heart-rate formula would read up to double.
		</p>

		<h3 id="tcx">Garmin Connect, Strava and others</h3>
		<p>
			Each walk can be downloaded as a <strong>TCX</strong> file (dashboard → <em>History</em> → a walk →
			<em>Download TCX</em>) and imported by hand. On connect.garmin.com that is <em>Activities</em> → <em>Import</em>.
			Imported walks show time, distance, calories and heart rate; Garmin does not add their steps to your daily step
			total.
		</p>
		<figure class="figure wide">
			<ThemedPicture
				name="history"
				sizes={COLUMN}
				alt="The dashboard's History view: steps today, in the last 7 days and all time, a chart of steps per day, and the list of walks"
			/>
			<figcaption>The dashboard's History view, with the demo character.</figcaption>
		</figure>

		<h3 id="no-game">Other games, or no game</h3>
		<p>
			Nothing to set up: the companion records a walk whenever the belt moves. Start the belt with the treadmill's
			remote and play anything, or nothing. Such a walk is in the dashboard's history as <em>No game session</em>, and
			in your totals.
		</p>
		<p>
			Such a walk is at your own risk like any other, and Walka has not yet been tried on a real walking pad: see the
			<a href={LINKS.disclaimer}>disclaimer</a>.
		</p>
	</section>

	<section id="read-more" class="prose">
		<h2>Where to read more</h2>
		<ul class="reading">
			<li>
				<a href={LINKS.readme}>The README</a>
				<span>Everything on this page and more, with troubleshooting.</span>
			</li>
			<li>
				<a href={LINKS.safety}>docs/SAFETY.md</a>
				<span>What Walka does to a treadmill, all of it, and how that is made sure of.</span>
			</li>
			<li>
				<a href={LINKS.protocol}>docs/PROTOCOL.md</a>
				<span>The strip, bit by bit, and when the companion believes what it reads.</span>
			</li>
			<li>
				<a href={LINKS.hardware}>docs/HARDWARE.md</a>
				<span>
					What is known about reading the Strol 2E and other treadmills, and what still needs confirming on a real unit.
				</span>
			</li>
			<li>
				<a href={resolve('safety/')}>Safety</a>
				<span>What Walka is and is not, what to do before you walk, and what has and has not been verified.</span>
			</li>
			<li>
				<a href={resolve('faq/')}>FAQ</a>
				<span>Short answers to common questions.</span>
			</li>
			<li>
				<a href={LINKS.disclaimer}>The disclaimer</a>
				<span>The whole of it.</span>
			</li>
		</ul>
	</section>
</Article>

<style>
	/* ---- the hero's second line: the standing warning, smaller ---------- */
	.risk {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 0.7rem;
		max-width: 36rem;
		margin-top: 0.35rem;
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.6;
	}

	.risk-icon {
		margin-top: 0.1rem;
		color: var(--warn);
	}

	/* ---- the column ---------------------------------------------------------
	   Text keeps to a comfortable line; a drawing or a picture marked .wide
	   takes the whole column. (min-width: a table or a row of pictures that
	   is wider than a phone then scrolls in its own box, not the page.) */
	section {
		max-width: none;
		min-width: 0;
	}

	section > :global(*) {
		max-width: var(--measure);
	}

	section > .wide {
		max-width: none;
		margin-block: clamp(2rem, 4.5vw, 3rem);
	}

	section > figure.wide + :global(h3) {
		margin-top: clamp(2.5rem, 5vw, 3.25rem);
	}

	/* a heading straight under the section's heading */
	h2 + h3 {
		margin-top: 1.4em;
	}

	/* ---- the two pieces ------------------------------------------------------ */
	.pieces {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		margin-block: 1.6rem;
		padding: 0;
	}

	.pieces > li {
		display: grid;
		align-content: start;
		gap: 0.35rem;
		margin: 0;
		padding: 1.4rem 1.4rem 1.5rem;
		border: 1px solid var(--line);
		border-top: 2px solid var(--gold-soft);
		border-radius: var(--radius-s) var(--radius-s) var(--radius) var(--radius);
		background: var(--surface);
	}

	.pieces > li::before {
		content: none;
	}

	.piece-icon {
		margin-bottom: 0.6rem;
		color: var(--gold);
	}

	.pieces h3 {
		margin: 0;
	}

	.pieces h3 + p {
		margin-top: 0.3rem;
		font-size: var(--text-small);
		line-height: 1.6;
	}

	/* ---- the three steps of the signal: numbered as the drawing numbers them - */
	.round {
		padding-left: 2.5rem;
		list-style: none;
		counter-reset: round;
	}

	.round > li {
		position: relative;
		counter-increment: round;
	}

	.round > li + li {
		margin-top: 0.8em;
	}

	.round > li::before,
	.round > li::after {
		position: absolute;
		top: 0.34rem;
		left: -2.3rem;
		width: 1.0625rem;
		height: 1.0625rem;
	}

	.round > li::before {
		content: '';
		border: 1.25px solid var(--gold);
		transform: rotate(45deg);
	}

	.round > li::after {
		content: counter(round);
		color: var(--gold);
		font: 700 0.6875rem/1.0625rem var(--font-text);
		text-align: center;
	}

	/* the one sentence of a section to remember */
	.pledge {
		margin-block: 1.6em;
		padding: 0.15rem 0 0.15rem 1.15rem;
		border-left: 2px solid var(--gold-soft);
		color: var(--ink);
		font-size: var(--text-lede);
		line-height: 1.5;
	}

	/* ---- get started ----------------------------------------------------------- */
	.steps > li > h3 + p {
		margin-top: 0;
	}

	/* ---- small things inside the text ---------------------------------------- */
	/* A command stays in one piece; a long file name may break. */
	code {
		white-space: nowrap;
	}

	code.long {
		white-space: normal;
	}

	.play {
		display: inline-block;
		width: 1.05em;
		height: 1.05em;
		vertical-align: -0.17em;
		color: var(--ink);
	}

	.play circle {
		fill: none;
		stroke: currentColor;
		stroke-width: 1.25;
	}

	.play path {
		fill: currentColor;
	}

	/* ---- tables ---------------------------------------------------------------- */
	.commands tbody th {
		font-weight: 400;
		line-height: 1.9;
	}

	@media (min-width: 36.01rem) {
		.commands tbody th {
			white-space: nowrap;
		}
	}

	.on-it tbody th {
		white-space: nowrap;
	}

	/* the one row that is a line on the picture, not a tile */
	.on-it th em {
		font-weight: 400;
	}

	/* On a phone the two tables with long words in them put each row's two
	   cells under one another, so nothing has to be squeezed or scrolled. */
	@media (max-width: 36rem) {
		.stack table,
		.stack tbody,
		.stack tr,
		.stack tbody th,
		.stack td {
			display: block;
		}

		.stack thead {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}

		.stack tr {
			padding: 0.85rem 1rem 0.9rem;
			border-bottom: 1px solid var(--line);
		}

		.stack tr:last-child {
			border-bottom: 0;
		}

		.stack tbody th,
		.stack td {
			padding: 0;
			border: 0;
		}

		.stack td {
			margin-top: 0.2rem;
		}

		.on-it tbody th {
			white-space: normal;
		}
	}

	/* ---- the road on the picture: the words, and the tile they describe ------- */
	.road {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 16.5rem;
		align-items: start;
		gap: 2rem clamp(2rem, 4vw, 3.5rem);
	}

	section > .road {
		margin-block: 1.6rem clamp(1.75rem, 4vw, 2.5rem);
	}

	.road-detail {
		margin-top: 0.3rem;
	}

	/* The whole picture is 1080 wide; the tile is 426 by 578 of it, 48 from
	   the left and 628 from the top. */
	.detail {
		aspect-ratio: 426 / 578;
		overflow: hidden;
		border-radius: 6px;
		box-shadow:
			0 18px 40px -20px var(--shadow),
			0 0 0 1px var(--line);
	}

	.detail :global(picture) {
		width: 253.52%;
		max-width: none;
		margin: -147.42% 0 0 -11.27%;
	}

	.road-detail figcaption {
		margin-top: 0.9rem;
		color: var(--ink-3);
		font-size: var(--text-fine);
		text-align: center;
	}

	@media (max-width: 70rem) {
		.road {
			grid-template-columns: 1fr;
		}

		.road-detail {
			width: min(20rem, 100%);
			margin-inline: auto;
		}
	}

	/* ---- where to read more: a list of doors ---------------------------------- */
	.reading {
		padding: 0;
		border-top: 1px solid var(--line);
	}

	.reading > li {
		display: grid;
		grid-template-columns: 11.5rem minmax(0, 1fr);
		gap: 0.15rem 1.5rem;
		margin: 0;
		padding: 0.85rem 0;
		border-bottom: 1px solid var(--line);
	}

	.reading > li::before {
		content: none;
	}

	.reading a {
		font-weight: 600;
	}

	.reading span {
		font-size: var(--text-small);
		line-height: 1.6;
	}

	@media (max-width: 36rem) {
		.pieces {
			grid-template-columns: 1fr;
		}

		.reading > li {
			grid-template-columns: 1fr;
		}
	}
</style>
