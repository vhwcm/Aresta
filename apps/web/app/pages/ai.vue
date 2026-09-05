<template>
  <div class="flex flex-col gap-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto w-full">
    <header class="flex flex-col gap-2">
      <div class="font-technical text-[10px] uppercase font-semibold tracking-widest text-textSecondary flex items-center gap-2">
        <BrainIcon class="w-3.5 h-3.5 text-accent" />
        Inteligência Artificial
      </div>
      <h1 class="font-editorial text-4xl md:text-5xl font-light text-textPrimary leading-tight">
        Assistente Aresta
      </h1>
      <p class="font-interface text-textSecondary text-sm md:text-base max-w-xl leading-relaxed">
        Interaja com o conhecimento dos seus livros, faça perguntas sobre os tópicos que você está estudando e receba insights conectados em tempo real.
      </p>
    </header>

    <div class="h-px bg-divider w-full"></div>

    <section class="flex flex-col gap-6">
      <div class="flex flex-col min-h-[420px] bg-bgPanel/60 border border-divider rounded-3xl relative overflow-hidden backdrop-blur-xl">
        <div class="absolute inset-0 bg-grid-pattern bg-grid-size opacity-10 pointer-events-none"></div>

        <div v-if="messages.length === 0" class="flex-1 flex flex-col justify-center items-center text-center gap-6 p-8 relative z-10 my-auto">
          <div class="relative w-20 h-20 flex items-center justify-center">
            <div class="absolute inset-0 border border-dashed border-accent/30 rounded-full animate-[spin_15s_linear_infinite]"></div>
            <div class="absolute inset-2 border border-accent/20 rounded-full animate-[spin_20s_linear_infinite_reverse]"></div>
            <div class="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center border border-accent/30 shadow-[0_0_30px_rgba(229,123,85,0.15)]">
              <BrainIcon class="w-5 h-5 text-accent animate-pulse" />
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <h2 class="font-editorial text-2xl md:text-3xl font-light text-textPrimary">Como posso ajudar hoje?</h2>
            <p class="font-interface text-sm text-textSecondary max-w-sm mx-auto">
              Tente perguntar sobre um conceito de algum dos seus livros, ou peça um resumo das suas últimas leituras.
            </p>
          </div>

          <div class="flex flex-wrap justify-center gap-3 mt-2">
            <button
              v-for="(prompt, index) in suggestedPrompts"
              :key="index"
              @click="sendSuggestedPrompt(prompt)"
              class="px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 border border-divider text-xs font-interface text-textSecondary hover:text-textPrimary hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <div v-else class="flex-1 flex flex-col gap-6 p-6 md:p-8 overflow-y-auto relative z-10 max-h-[600px]">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="flex flex-col gap-2"
            :class="msg.role === 'user' ? 'items-end' : 'items-start'"
          >
            <div
              class="flex items-center gap-2 font-technical text-[11px] uppercase tracking-wider text-textSecondary"
            >
              <template v-if="msg.role === 'user'">
                <span>Você</span>
                <UserIcon class="w-3.5 h-3.5 text-textSecondary" />
              </template>
              <template v-else>
                <BrainIcon class="w-3.5 h-3.5 text-accent" />
                <span class="text-accent font-semibold">Assistente Aresta</span>
              </template>
            </div>

            <div
              class="max-w-[88%] md:max-w-[80%] rounded-2xl p-4 md:p-5 shadow-sm"
              :class="msg.role === 'user'
                ? 'bg-accent/15 border border-accent/30 text-textPrimary rounded-tr-sm'
                : 'bg-white/[0.03] border border-divider text-textPrimary rounded-tl-sm w-full'"
            >
              <div v-if="msg.role === 'user'" class="font-interface text-sm md:text-base whitespace-pre-wrap">
                {{ msg.content }}
              </div>
              <AiMarkdown v-else :content="msg.content" />
            </div>
          </div>

          <div v-if="isLoading" class="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-divider w-max">
            <BrainIcon class="w-4 h-4 text-accent animate-pulse" />
            <span class="font-interface text-xs text-textSecondary animate-pulse">Assistente Aresta está gerando a resposta...</span>
          </div>
        </div>
      </div>

      <form @submit.prevent="sendMessage" class="relative group">
        <div class="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <MessageSquareIcon class="w-5 h-5 text-textSecondary group-focus-within:text-accent transition-colors" />
        </div>
        <input
          v-model="inputQuery"
          type="text"
          placeholder="Pergunte algo sobre sua biblioteca..."
          :disabled="isLoading"
          class="w-full bg-bgPanel border border-divider rounded-full py-5 pl-16 pr-32 text-textPrimary font-interface placeholder:text-textSecondary/50 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-lg disabled:opacity-50"
        >
        <button
          type="submit"
          :disabled="isLoading || !inputQuery.trim()"
          class="absolute inset-y-2 right-2 px-6 bg-white text-black font-interface font-medium text-sm rounded-full hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span>Enviar</span>
          <SendIcon class="w-3.5 h-3.5" />
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { BrainIcon, MessageSquareIcon, SendIcon, UserIcon } from 'lucide-vue-next'
import AiMarkdown from '~/components/AiMarkdown.vue'
import { isProductionMode, logError } from '~/utils/logger'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const suggestedPrompts = [
  'Explique "Paradigmas" segundo Kuhn',
  'Resuma "Meditações"',
]

const messages = ref<Message[]>([])
const inputQuery = ref('')
const isLoading = ref(false)

const getBestModel = async (apiKey: string): Promise<string> => {
  const preferredModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro',
    'gemini-flash-latest',
  ]
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    if (res.ok) {
      const data = await res.json()
      const models = data?.models || []

      for (const pref of preferredModels) {
        const found = models.find((m: any) => m.name === `models/${pref}` || m.name === pref)
        if (found) return pref
      }

      const validModel = models.find((m: any) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent') &&
        m.name &&
        !m.name.includes('2.5') &&
        !m.name.includes('embedding') &&
        !m.name.includes('imagen') &&
        !m.name.includes('tts') &&
        !m.name.includes('veo')
      )
      if (validModel && validModel.name) {
        return validModel.name.replace(/^models\//, '')
      }
    }
  } catch (_err) {
    // Fallback silencioso em caso de falha ao listar modelos
  }
  return 'gemini-2.0-flash'
}

const sendSuggestedPrompt = (promptText: string) => {
  inputQuery.value = promptText
  sendMessage()
}

const sendMessage = async () => {
  const query = inputQuery.value.trim()
  if (!query || isLoading.value) return

  messages.value.push({
    role: 'user',
    content: query,
  })

  inputQuery.value = ''
  isLoading.value = true

  try {
    let responseText = ''
    try {
      const res = await $fetch<{ text?: string; error?: boolean; message?: string }>('/api/ai', {
        method: 'POST',
        body: { prompt: query },
      })
      responseText = res?.text || res?.message || 'Sem resposta gerada.'
    } catch (apiErr: any) {
      const config = useRuntimeConfig()
      const apiKey = (config.public?.aiKey || config.aiKey || '') as string
      const modelName = await getBestModel(apiKey)
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(query)
      const response = await result.response
      responseText = response.text()
    }

    messages.value.push({
      role: 'assistant',
      content: responseText,
    })
  } catch (err: any) {
    logError('[AI Page Error]', err)
    const isProd = isProductionMode()
    const isQuotaError = err?.message?.includes('quota') || err?.message?.includes('RESOURCE_EXHAUSTED')
    const errorContent = isProd
      ? 'Não foi possível obter uma resposta do serviço de IA.'
      : isQuotaError
        ? `### Limite de Cota Excedido (API Gemini)\n\nA chave de API atingiu o limite de cota do plano gratuito do Google.\n\n\`\`\`text\n${err?.message || err}\n\`\`\`\n\n> **Instrução:** Gere uma nova chave no [Google AI Studio](https://aistudio.google.com/) e atualize a chave \`AI_KEY\` no arquivo \`.env\`.`
        : `### Erro de Comunicação com a IA\n\nNão foi possível obter uma resposta do serviço da IA.\n\n\`\`\`text\n${err?.message || err}\n\`\`\``

    messages.value.push({
      role: 'assistant',
      content: errorContent,
    })
  } finally {
    isLoading.value = false
  }
}
</script>
