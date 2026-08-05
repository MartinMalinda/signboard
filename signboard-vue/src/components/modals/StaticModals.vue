<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import Modal from '../../lib/components/Modal.vue'
import FeatherIcon from '../FeatherIcon.vue'
import { getShortcutAriaKeyshortcuts, getShortcutKeycapText, isMacPlatform } from '../../../lib/shortcutLabels.js'
import { useStaticModalStore } from '../../stores/useStaticModalStore'
import { useSponsorStore } from '../../stores/useSponsorStore'

const modals = useStaticModalStore()
const sponsor = useSponsorStore()
const appInfo = ref({ appName: 'Signboard', appVersion: '', authorName: 'Colin Devroe', authorUrl: 'https://cdevroe.com/', copyright: '© 2025-2026 Colin Devroe', license: 'MIT', websiteUrl: 'https://cdevroe.com/signboard/' })
const PAY_URL = 'https://buy.stripe.com/7sY4gAaT14WO3dY2mg8N205'
const TIP_URL = 'https://donate.stripe.com/14A3cw1ircpgeWGf928N206'
const modifierLabel = isMacPlatform() ? 'Command' : 'Control'
const shortcutRows: Array<{ section: string; items: Array<[string, string]> }> = [
  { section: 'Create', items: [['Quick add card', 'addCard'], ['Add list', 'addList']] },
  { section: 'Switch Views', items: [['Kanban board', 'kanbanView'], ['Table board', 'tableView']] },
  { section: 'Board', items: [['Switch board', 'switchBoard'], ['Settings', 'boardSettings'], ['Toggle light/dark mode', 'toggleTheme'], ['Cycle color scheme', 'cycleColorScheme'], ['Open archive', 'archiveBrowser']] },
  { section: 'Card', items: [['Move card left', 'moveCardLeft'], ['Move card right', 'moveCardRight'], ['Archive card', 'archiveCard']] },
  { section: 'Search', items: [['Focus search', 'focusSearch']] },
  { section: 'Modals', items: [['Keyboard shortcuts', 'keyboardShortcuts'], ['Close open modals', 'closeModals']] },
]
function sectionId(section: string) { return `keyboard-shortcuts-section-${section.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` }

function dismissPill() {
  sponsor.dismiss()
}
async function openExternal(url: string) {
  if (window.electronAPI.openExternal) await window.electronAPI.openExternal(url)
}
function openSponsorFromAbout() { modals.closeAll(); modals.openSponsor() }

onMounted(async () => {
  sponsor.initialize()
  if (window.electronAPI.getAppInfo) {
    try { appInfo.value = { ...appInfo.value, ...(await window.electronAPI.getAppInfo()) } } catch { /* fallback copy stays visible */ }
  }
})
onBeforeUnmount(() => sponsor.dispose())
</script>

<template>
  <div id="sponsorSignboardPill" class="sponsor-signboard-pill" :class="{ hidden: !sponsor.visible }">
    <button id="openSponsorPillButton" class="sponsor-signboard-button" type="button" title="Sponsor Signboard" aria-label="Sponsor Signboard" @click="modals.openSponsor()"><FeatherIcon name="heart" /><span>Sponsor</span></button>
    <button id="dismissSponsorPillButton" class="sponsor-signboard-dismiss" type="button" title="Hide Sponsor button" aria-label="Hide Sponsor button" @click="dismissPill"><FeatherIcon name="x" /></button>
  </div>

  <Modal id="modalAboutSignboard" modal-class="about-signboard-modal" positioning="fixed" :show-chrome="false" labelled-by="aboutSignboardTitle" :is-open="modals.aboutOpen" :on-close="() => modals.closeAll()" initial-focus="#aboutSignboardClose">
    <div class="about-signboard-header"><div><p class="about-signboard-eyebrow">Local-first boards</p><h2 id="aboutSignboardTitle">About Signboard</h2></div><button id="aboutSignboardClose" class="commercial-license-close" type="button" title="Close About Signboard" aria-label="Close About Signboard" @click="modals.closeAll()"><FeatherIcon name="x" /></button></div>
    <div class="about-signboard-copy"><section class="about-signboard-section about-signboard-intro"><div class="about-signboard-badges"><span class="about-signboard-badge" data-about-app-version>Version {{ appInfo.appVersion ? appInfo.appVersion : 'unavailable' }}</span><span class="about-signboard-badge"><span data-about-license>{{ appInfo.license }}</span> License</span></div><p>Signboard writes Markdown files for Kanban and Table board views.</p><p class="about-signboard-meta">Created by <a :href="appInfo.authorUrl" rel="noopener noreferrer">{{ appInfo.authorName }}</a>.</p><div class="about-signboard-actions"><a class="about-signboard-link-button" :href="appInfo.websiteUrl" rel="noopener noreferrer">Visit Website</a><button id="aboutSignboardSupportButton" class="about-signboard-support-button" type="button" @click="openSponsorFromAbout">Sponsor Signboard</button></div></section><section class="about-signboard-section"><h3>Inspiration</h3><p>Thanks to John Gruber for creating Markdown and to Steph Ango for the file-over-app philosophy.</p></section><section class="about-signboard-section"><h3>Bundled Libraries</h3><ul class="about-signboard-library-list"><li><a href="https://github.com/mixmark-io/turndown" rel="noopener noreferrer">Turndown</a><span>MIT License</span></li><li><a href="https://github.com/SortableJS/Sortable" rel="noopener noreferrer">SortableJS</a><span>MIT License</span></li><li><a href="https://github.com/feathericons/feather" rel="noopener noreferrer">Feather Icons</a><span>MIT License</span></li></ul></section></div>
  </Modal>

  <Modal id="modalCommercialLicense" modal-class="commercial-license-modal" positioning="fixed" :show-chrome="false" labelled-by="commercialLicenseTitle" :is-open="modals.sponsorOpen" :on-close="() => modals.closeAll()" initial-focus="#commercialLicenseClose">
    <div class="commercial-license-header"><div><h2 id="commercialLicenseTitle">Sponsor Signboard when it supports your work</h2></div><button id="commercialLicenseClose" class="commercial-license-close" type="button" title="Close commercial use modal" aria-label="Close commercial use modal" @click="modals.closeAll()"><FeatherIcon name="x" /></button></div><div class="commercial-license-copy"><p>Hi, I’m Colin. 👋</p><p>I want Signboard to stay open source and free for personal use.</p><p>If you start using Signboard to manage work that earns you money, I’d really appreciate your sponsorship with a one-time commercial-use payment.</p></div><div class="commercial-license-card"><div class="commercial-license-card-copy"><p class="commercial-license-card-label">Commercial-use sponsorship</p><p class="commercial-license-card-price"><span data-commercial-license-price>$49</span> one-time</p><p class="commercial-license-card-note">No subscription. Pay once and keep using Signboard for commercial work.</p></div><button id="commercialLicensePayButton" class="commercial-license-pay-button" type="button" @click="void openExternal(PAY_URL)">Pay $49</button></div><div class="commercial-license-tip"><div class="commercial-license-tip-copy"><p class="commercial-license-tip-title">Tips are appreciated</p><p class="commercial-license-tip-note">If you want to sponsor development or just want to say thanks, you can leave a tip of any amount.</p></div><button id="commercialLicenseTipButton" class="commercial-license-tip-button" type="button" @click="void openExternal(TIP_URL)">Leave a Tip</button></div>
  </Modal>

  <Modal id="modalKeyboardShortcuts" modal-class="keyboard-shortcuts-modal" positioning="fixed" :show-chrome="false" labelled-by="keyboardShortcutsTitle" :is-open="modals.keyboardShortcutsOpen" :on-close="() => modals.closeAll()" initial-focus="#keyboardShortcutsClose">
    <div class="keyboard-shortcuts-header"><div><h2 id="keyboardShortcutsTitle">Keyboard Shortcuts</h2><p>Press <span class="shortcut-modifier-label">{{ modifierLabel }}</span> + / to open this list.</p></div><button id="keyboardShortcutsClose" class="commercial-license-close" type="button" title="Close keyboard shortcuts" aria-label="Close keyboard shortcuts" @click="modals.closeAll()"><FeatherIcon name="x" /></button></div>
    <div class="keyboard-shortcuts-grid"><section v-for="group in shortcutRows" :key="group.section" class="keyboard-shortcuts-section" :aria-labelledby="sectionId(group.section)"><h3 :id="sectionId(group.section)">{{ group.section }}</h3><ul class="keyboard-shortcuts-list"><li v-for="(item, itemIndex) in group.items" :key="`${item[1]}-${itemIndex}`"><span>{{ item[0] }}</span><kbd :data-shortcut-action="item[1]" :aria-keyshortcuts="getShortcutAriaKeyshortcuts(item[1])">{{ getShortcutKeycapText(item[1]) }}</kbd></li></ul></section></div>
  </Modal>

  <Modal id="modalObsidianVaultRequired" modal-class="obsidian-vault-required-modal" positioning="fixed" :show-chrome="false" labelled-by="obsidianVaultRequiredTitle" :is-open="modals.obsidianVaultRequiredOpen" :on-close="() => modals.closeAll()" initial-focus="#obsidianVaultRequiredOk">
    <div class="obsidian-vault-required-header"><div><p class="obsidian-vault-required-eyebrow">Obsidian</p><h2 id="obsidianVaultRequiredTitle">Obsidian vault required</h2></div><button id="obsidianVaultRequiredClose" class="obsidian-vault-required-close" type="button" title="Close" aria-label="Close" @click="modals.closeAll()"><FeatherIcon name="x" /></button></div><div class="obsidian-vault-required-copy"><p id="obsidianVaultRequiredMessage">{{ modals.obsidianVaultRequiredMessage }}</p><p>Move this board into a vault, or create/open a board inside a vault, then try again.</p></div><div class="obsidian-vault-required-actions"><button id="obsidianVaultRequiredOk" type="button" @click="modals.closeAll()">OK</button></div>
  </Modal>
</template>
