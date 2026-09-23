import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import JournalView from '~/components/notes/JournalView.vue';
import { dbManager } from '~/adapters/database/DatabaseManager';
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter';
import { resetJournalMemory } from '~/composables/useJournal';

describe('JournalView Component', () => {
  let inMemoryAdapter: InMemoryAdapter;

  beforeEach(() => {
    inMemoryAdapter = new InMemoryAdapter();
    dbManager.setAdapter(inMemoryAdapter);
    resetJournalMemory();
  });

  it('renders journal header, today date, and editor textarea', async () => {
    const wrapper = mount(JournalView, {
      global: {
        stubs: {
          AiMarkdown: {
            template: '<div class="stub-markdown">{{ content }}</div>',
            props: ['content']
          }
        }
      }
    });

    expect(wrapper.text()).toContain('Diário Sequencial');
    expect(wrapper.find('textarea').exists()).toBe(true);
    expect(wrapper.find('input[type="date"]').exists()).toBe(true);
  });

  it('allows formatting text with bold button', async () => {
    const wrapper = mount(JournalView, {
      global: {
        stubs: {
          AiMarkdown: true
        }
      }
    });

    const textarea = wrapper.find('textarea');
    expect(textarea.exists()).toBe(true);

    const boldBtn = wrapper.find('button[title*="Negrito"]');
    expect(boldBtn.exists()).toBe(true);
    await boldBtn.trigger('click');

    expect(textarea.element.value).toContain('**texto**');
  });
});
