import { describe, it, expect, beforeEach } from 'vitest';
import { LinkRepository } from '~/adapters/database/repositories/LinkRepository';
import { dbManager } from '~/adapters/database/DatabaseManager';
import { InMemoryAdapter } from '~/adapters/database/InMemoryAdapter';

describe('LinkRepository', () => {
  let repo: LinkRepository;
  let inMemoryAdapter: InMemoryAdapter;

  beforeEach(async () => {
    inMemoryAdapter = new InMemoryAdapter();
    dbManager.setAdapter(inMemoryAdapter);
    repo = new LinkRepository();
  });

  it('should save a new link with automated domain, title fallback and favicon', async () => {
    const saved = await repo.save({
      id: 'link-1',
      url: 'https://github.com/torvalds/linux',
      title: 'Linux Kernel'
    });

    expect(saved.id).toBe('link-1');
    expect(saved.title).toBe('Linux Kernel');
    expect(saved.domain).toBe('github.com');
    expect(saved.favicon).toContain('google.com/s2/favicons');
    expect(saved.sync_status).toBe('pending');

    const retrieved = await repo.getById('link-1');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Linux Kernel');
  });

  it('should fallback title to domain when title is omitted', async () => {
    const saved = await repo.save({
      id: 'link-2',
      url: 'vuejs.org'
    });

    expect(saved.url).toBe('https://vuejs.org');
    expect(saved.title).toBe('vuejs.org');
    expect(saved.domain).toBe('vuejs.org');
  });

  it('should filter links by folder, tag and search keyword', async () => {
    await repo.save({
      id: 'link-1',
      url: 'https://nuxt.com',
      title: 'Nuxt 3 Framework',
      folder: 'Frontend',
      tags: ['vue', 'web']
    });

    await repo.save({
      id: 'link-2',
      url: 'https://expressjs.com',
      title: 'Express Node',
      folder: 'Backend',
      tags: ['node', 'api']
    });

    const all = await repo.getAll();
    expect(all.length).toBe(2);

    const frontendOnly = await repo.getAll({ folder: 'Frontend' });
    expect(frontendOnly.length).toBe(1);
    expect(frontendOnly[0].id).toBe('link-1');

    const searchResults = await repo.getAll({ search: 'express' });
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].id).toBe('link-2');

    const tagResults = await repo.getAll({ tag: 'vue' });
    expect(tagResults.length).toBe(1);
    expect(tagResults[0].id).toBe('link-1');
  });

  it('should delete a link', async () => {
    await repo.save({
      id: 'link-to-delete',
      url: 'https://delete-me.com',
      title: 'Delete Me'
    });

    await repo.delete('link-to-delete');
    const item = await repo.getById('link-to-delete');
    expect(item).toBeNull();
  });
});
