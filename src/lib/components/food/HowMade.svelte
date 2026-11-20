<script lang="ts">
	// "How these numbers are made": the longer note on what an estimate is,
	// and each number of the summary in plain words. It says what
	// docs/data-model.md says ("The numbers on the food page").
	import Icon from '#lib/components/Icon.svelte';
</script>

<details>
	<summary>
		<span>How these numbers are made</span>
		<span class="mark"><Icon name="chevron" size={20} /></span>
	</summary>
	<div class="text">
		<p>
			These are estimates. The calories in a food come from its label or from a public food list, and both can be off. What your
			body burns is worked out from your weight, height, age and sex, and people differ. Use the numbers for a rough picture, not
			to decide what to eat. This is not medical advice. If food or your weight is on your mind a lot, talk to a doctor.
		</p>
		<dl>
			<div>
				<dt>Eaten</dt>
				<dd>What you wrote down for the day, added up.</dd>
			</div>
			<div>
				<dt>Walked</dt>
				<dd>
					For each walk in your account on that day, the calories on top of sitting, if the walk has that number. Otherwise its
					calories, minus what sitting for the same time would have cost.
				</dd>
			</div>
			<div>
				<dt>At rest</dt>
				<dd>
					What a body burns in a day without the walks: the Mifflin-St Jeor estimate of the resting rate from weight, height, age
					and sex, times 1.2 for a day mostly spent sitting. Without an age or a sex it is 24 kcal for each kilogram of weight,
					and that is rough.
				</dd>
			</div>
			<div>
				<dt>Left to walk off</dt>
				<dd>
					Calories eaten, minus those two, minus your goal. It is never less than zero. A goal is never applied so far that it
					would ask for less than about 1,200 kcal a day (1,500 where the estimate was made for a man). As time, it is shown at
					your own pace - the middle one of your last ten walks of five minutes or more - and not past two hours. More than that
					is more than a walk covers, and nothing carries over to the next day.
				</dd>
			</div>
		</dl>
	</div>
</details>

<style>
	details {
		border-block: 1px solid var(--line);
	}

	summary {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		align-items: center;
		gap: 1rem;
		min-height: 3rem;
		padding-block: 0.5rem;
		color: var(--ink);
		font-size: var(--text-small);
		font-weight: 600;
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	summary:hover {
		color: var(--accent);
	}

	.mark {
		color: var(--gold);
		transition: transform 0.25s var(--ease);
	}

	details[open] .mark {
		transform: rotate(180deg);
	}

	.text {
		display: grid;
		gap: 1rem;
		padding-bottom: 1.25rem;
		color: var(--ink-2);
		font-size: var(--text-small);
		line-height: 1.6;
	}

	dl {
		display: grid;
		gap: 0.75rem;
	}

	dt {
		color: var(--ink);
		font-weight: 600;
	}

	@media (prefers-reduced-motion: reduce) {
		.mark {
			transition: none;
		}
	}
</style>
