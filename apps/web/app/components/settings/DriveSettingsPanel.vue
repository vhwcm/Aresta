<template>
  <section class="flex flex-col gap-3">
    <span class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary opacity-60">Sincronização pessoal</span>
    <div class="rounded-xl bg-white/[0.02] border border-divider p-4 flex items-center justify-between gap-4">
      <div>
        <p class="font-interface text-sm text-textPrimary font-medium">Drive do usuário</p>
        <p class="font-interface text-xs text-textSecondary">
          <template v-if="isSyncing">Sincronizando dados locais…</template>
          <template v-else-if="driveProvider">{{ driveProvider }} · {{ lastSyncAt ? `sincronizado em ${new Date(lastSyncAt).toLocaleString()}` : 'aguardando primeira sincronização' }}</template>
          <template v-else>Conecte Google Drive ou OneDrive para manter seus dados pessoais.</template>
        </p>
        <p v-if="syncError" class="font-interface text-xs text-rose-400 mt-1">{{ syncError }}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button v-if="driveProvider" class="px-3 py-1.5 text-xs rounded-lg bg-accent text-white disabled:opacity-60" :disabled="isSyncing" @click="sync">Sincronizar</button>
        <button v-if="driveProvider" class="px-3 py-1.5 text-xs rounded-lg border border-divider text-textSecondary" @click="disconnect">Desconectar</button>
        <template v-else>
          <button class="px-3 py-1.5 text-xs rounded-lg bg-accent text-white" @click="connect('google')">Google</button>
          <button class="px-3 py-1.5 text-xs rounded-lg border border-divider text-textSecondary" @click="connect('onedrive')">OneDrive</button>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDriveSync } from '~/composables/useDriveSync'
const { isSyncing, lastSyncAt, driveProvider, syncError, sync, connect, disconnect } = useDriveSync()
</script>
