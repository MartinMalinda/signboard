import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStaticModalStore = defineStore('staticModals', () => {
  const aboutOpen = ref(false)
  const sponsorOpen = ref(false)
  const keyboardShortcutsOpen = ref(false)
  const obsidianVaultRequiredOpen = ref(false)
  const obsidianVaultRequiredMessage = ref('This feature only works when the current board folder is stored inside an Obsidian vault.')

  function closeAll() {
    aboutOpen.value = false
    sponsorOpen.value = false
    keyboardShortcutsOpen.value = false
    obsidianVaultRequiredOpen.value = false
  }
  function openAbout() { closeAll(); aboutOpen.value = true }
  function openSponsor() { closeAll(); sponsorOpen.value = true }
  function openKeyboardShortcuts() { closeAll(); keyboardShortcutsOpen.value = true }
  function showObsidianVaultRequired(message = '') {
    closeAll()
    obsidianVaultRequiredMessage.value = message || 'This feature only works when the current board folder is stored inside an Obsidian vault.'
    obsidianVaultRequiredOpen.value = true
  }

  return { aboutOpen, sponsorOpen, keyboardShortcutsOpen, obsidianVaultRequiredOpen, obsidianVaultRequiredMessage, closeAll, openAbout, openSponsor, openKeyboardShortcuts, showObsidianVaultRequired }
})
