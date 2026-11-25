// The facts about Walka that more than one page needs: names and addresses.
// The download links are the ones Walka's own README uses. They always give
// the files of the latest release.

export const WALKA_REPO = 'https://github.com/AntonyPerez0/walka-addon';
export const WEBSITE_REPO = 'https://github.com/AntonyPerez0/walka-website';

const latest = `${WALKA_REPO}/releases/latest/download`;

export const DOWNLOADS = {
	windows: `${latest}/Walka.exe`,
	macAppleSilicon: `${latest}/Walka-mac-apple-silicon.zip`,
	macIntel: `${latest}/Walka-mac-intel.zip`,
	addon: `${latest}/Walka-addon.zip`,
	checksums: `${latest}/SHA256SUMS.txt`,
	virusScan: `${latest}/virus-scan.json`
} as const;

export const LINKS = {
	repo: WALKA_REPO,
	readme: `${WALKA_REPO}#readme`,
	// three sections of the README, by their headings
	isThisAllowed: `${WALKA_REPO}/blob/HEAD/README.md#is-this-allowed`,
	troubleshooting: `${WALKA_REPO}/blob/HEAD/README.md#troubleshooting`,
	walkaAccount: `${WALKA_REPO}/blob/HEAD/README.md#your-walka-account-on-walkadev`,
	releases: `${WALKA_REPO}/releases`,
	latestRelease: `${WALKA_REPO}/releases/latest`,
	issues: `${WALKA_REPO}/issues`,
	disclaimer: `${WALKA_REPO}/blob/HEAD/DISCLAIMER.md`,
	safety: `${WALKA_REPO}/blob/HEAD/docs/SAFETY.md`,
	hardware: `${WALKA_REPO}/blob/HEAD/docs/HARDWARE.md`,
	protocol: `${WALKA_REPO}/blob/HEAD/docs/PROTOCOL.md`,
	checklist: `${WALKA_REPO}/blob/HEAD/docs/IN-GAME-CHECKLIST.md`,
	security: `${WALKA_REPO}/blob/HEAD/SECURITY.md`,
	reportVulnerability: `${WALKA_REPO}/security/advisories/new`,
	thirdParty: `${WALKA_REPO}/blob/HEAD/THIRD-PARTY-NOTICES.md`,
	licence: `${WALKA_REPO}/blob/HEAD/LICENSE`,
	build: `${WALKA_REPO}/actions/workflows/ci.yml`,
	// where anyone can have a downloaded file scanned
	virusTotal: 'https://www.virustotal.com/gui/home/upload',
	websiteRepo: WEBSITE_REPO,
	websiteIssues: `${WEBSITE_REPO}/issues`
} as const;
