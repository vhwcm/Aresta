
import type { DefineComponent, SlotsType } from 'vue'
type IslandComponent<T> = DefineComponent<{}, {refresh: () => Promise<void>}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, SlotsType<{ fallback: { error: unknown } }>> & T

type HydrationStrategies = {
  hydrateOnVisible?: IntersectionObserverInit | true
  hydrateOnIdle?: number | true
  hydrateOnInteraction?: keyof HTMLElementEventMap | Array<keyof HTMLElementEventMap> | true
  hydrateOnMediaQuery?: string
  hydrateAfter?: number
  hydrateWhen?: boolean
  hydrateNever?: true
}
type LazyComponent<T> = DefineComponent<HydrationStrategies, {}, {}, {}, {}, {}, {}, { hydrated: () => void }> & T

interface _GlobalComponents {
  AiMarkdown: typeof import("../../app/components/AiMarkdown.vue")['default']
  AppSelect: typeof import("../../app/components/AppSelect.vue")['default']
  ArestaLogoGraph: typeof import("../../app/components/ArestaLogoGraph.vue")['default']
  BottomNavbar: typeof import("../../app/components/BottomNavbar.vue")['default']
  CommandPalette: typeof import("../../app/components/CommandPalette.vue")['default']
  ConfirmModal: typeof import("../../app/components/ConfirmModal.vue")['default']
  ConnectNodesModal: typeof import("../../app/components/ConnectNodesModal.vue")['default']
  CreateNodeModal: typeof import("../../app/components/CreateNodeModal.vue")['default']
  EbbinghausChart: typeof import("../../app/components/EbbinghausChart.vue")['default']
  FolderTagSidebar: typeof import("../../app/components/FolderTagSidebar.vue")['default']
  GraphCanvas: typeof import("../../app/components/GraphCanvas.vue")['default']
  HomeBookReaderDemo: typeof import("../../app/components/HomeBookReaderDemo.vue")['default']
  HomeCanvasNotesDemo: typeof import("../../app/components/HomeCanvasNotesDemo.vue")['default']
  HomeKnowledgeGraphDemo: typeof import("../../app/components/HomeKnowledgeGraphDemo.vue")['default']
  ManageThemesModal: typeof import("../../app/components/ManageThemesModal.vue")['default']
  MilkdownEditor: typeof import("../../app/components/MilkdownEditor.vue")['default']
  NavbarPageConnector: typeof import("../../app/components/NavbarPageConnector.vue")['default']
  NodeDrawer: typeof import("../../app/components/NodeDrawer.vue")['default']
  ReadingStreak: typeof import("../../app/components/ReadingStreak.vue")['default']
  SettingsModal: typeof import("../../app/components/SettingsModal.vue")['default']
  SidebarGraph: typeof import("../../app/components/SidebarGraph.vue")['default']
  StreakCelebrationModal: typeof import("../../app/components/StreakCelebrationModal.vue")['default']
  StreakShareModal: typeof import("../../app/components/StreakShareModal.vue")['default']
  CanvasActionModals: typeof import("../../app/components/canvas/CanvasActionModals.vue")['default']
  CanvasBoard: typeof import("../../app/components/canvas/CanvasBoard.vue")['default']
  CanvasEdgeLayer: typeof import("../../app/components/canvas/CanvasEdgeLayer.vue")['default']
  CanvasEmbedPreview: typeof import("../../app/components/canvas/CanvasEmbedPreview.vue")['default']
  CanvasInkingOverlay: typeof import("../../app/components/canvas/CanvasInkingOverlay.vue")['default']
  CanvasInsertDrawer: typeof import("../../app/components/canvas/CanvasInsertDrawer.vue")['default']
  CanvasNode: typeof import("../../app/components/canvas/CanvasNode.vue")['default']
  CanvasNodeBook: typeof import("../../app/components/canvas/CanvasNodeBook.vue")['default']
  CanvasNodeNote: typeof import("../../app/components/canvas/CanvasNodeNote.vue")['default']
  CanvasNodeShape: typeof import("../../app/components/canvas/CanvasNodeShape.vue")['default']
  CanvasNodeText: typeof import("../../app/components/canvas/CanvasNodeText.vue")['default']
  CanvasSelectionToolbar: typeof import("../../app/components/canvas/CanvasSelectionToolbar.vue")['default']
  CanvasToolbar: typeof import("../../app/components/canvas/CanvasToolbar.vue")['default']
  CanvasCycleWarningPlaceholder: typeof import("../../app/components/canvas/CycleWarningPlaceholder.vue")['default']
  CanvasKnowledgeGraphView: typeof import("../../app/components/canvas/KnowledgeGraphView.vue")['default']
  GraphBookAnnotationsDrawer: typeof import("../../app/components/graph/BookAnnotationsDrawer.vue")['default']
  GraphThemeCanvasOverlay: typeof import("../../app/components/graph/ThemeCanvasOverlay.vue")['default']
  NotesNoteCompositeRenderer: typeof import("../../app/components/notes/NoteCompositeRenderer.vue")['default']
  NotesNoteEditorPane: typeof import("../../app/components/notes/NoteEditorPane.vue")['default']
  ReaderAiOverlayCard: typeof import("../../app/components/reader/ReaderAiOverlayCard.vue")['default']
  ReaderAnnotationModal: typeof import("../../app/components/reader/ReaderAnnotationModal.vue")['default']
  ReaderBookNotesPanel: typeof import("../../app/components/reader/ReaderBookNotesPanel.vue")['default']
  ReaderBottomBar: typeof import("../../app/components/reader/ReaderBottomBar.vue")['default']
  ReaderDictionaryCard: typeof import("../../app/components/reader/ReaderDictionaryCard.vue")['default']
  ReaderGraphPanel: typeof import("../../app/components/reader/ReaderGraphPanel.vue")['default']
  ReaderSavedPagesModal: typeof import("../../app/components/reader/ReaderSavedPagesModal.vue")['default']
  ReaderSelectionTooltip: typeof import("../../app/components/reader/ReaderSelectionTooltip.vue")['default']
  ReaderShell: typeof import("../../app/components/reader/ReaderShell.vue")['default']
  ReaderTypographyPopover: typeof import("../../app/components/reader/ReaderTypographyPopover.vue")['default']
  ReaderUploader: typeof import("../../app/components/reader/Uploader.vue")['default']
  ReaderViewer: typeof import("../../app/components/reader/Viewer.vue")['default']
  ReaderEnginePageCurlCanvas: typeof import("../../app/components/reader/engine/PageCurlCanvas.vue")['default']
  ReaderUploadDropZone: typeof import("../../app/components/reader/upload/DropZone.vue")['default']
  NuxtWelcome: typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']
  NuxtLayout: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']
  NuxtErrorBoundary: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']
  ClientOnly: typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']
  DevOnly: typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']
  ServerPlaceholder: typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']
  NuxtLink: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']
  NuxtLoadingIndicator: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']
  NuxtTime: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']
  NuxtRouteAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']
  NuxtAnnouncer: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']
  NuxtImg: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']
  NuxtPicture: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']
  NuxtPage: typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']
  NoScript: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']
  Link: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']
  Base: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']
  Title: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']
  Meta: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']
  Style: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']
  Head: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']
  Html: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']
  Body: typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']
  NuxtIsland: typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']
  LazyAiMarkdown: LazyComponent<typeof import("../../app/components/AiMarkdown.vue")['default']>
  LazyAppSelect: LazyComponent<typeof import("../../app/components/AppSelect.vue")['default']>
  LazyArestaLogoGraph: LazyComponent<typeof import("../../app/components/ArestaLogoGraph.vue")['default']>
  LazyBottomNavbar: LazyComponent<typeof import("../../app/components/BottomNavbar.vue")['default']>
  LazyCommandPalette: LazyComponent<typeof import("../../app/components/CommandPalette.vue")['default']>
  LazyConfirmModal: LazyComponent<typeof import("../../app/components/ConfirmModal.vue")['default']>
  LazyConnectNodesModal: LazyComponent<typeof import("../../app/components/ConnectNodesModal.vue")['default']>
  LazyCreateNodeModal: LazyComponent<typeof import("../../app/components/CreateNodeModal.vue")['default']>
  LazyEbbinghausChart: LazyComponent<typeof import("../../app/components/EbbinghausChart.vue")['default']>
  LazyFolderTagSidebar: LazyComponent<typeof import("../../app/components/FolderTagSidebar.vue")['default']>
  LazyGraphCanvas: LazyComponent<typeof import("../../app/components/GraphCanvas.vue")['default']>
  LazyHomeBookReaderDemo: LazyComponent<typeof import("../../app/components/HomeBookReaderDemo.vue")['default']>
  LazyHomeCanvasNotesDemo: LazyComponent<typeof import("../../app/components/HomeCanvasNotesDemo.vue")['default']>
  LazyHomeKnowledgeGraphDemo: LazyComponent<typeof import("../../app/components/HomeKnowledgeGraphDemo.vue")['default']>
  LazyManageThemesModal: LazyComponent<typeof import("../../app/components/ManageThemesModal.vue")['default']>
  LazyMilkdownEditor: LazyComponent<typeof import("../../app/components/MilkdownEditor.vue")['default']>
  LazyNavbarPageConnector: LazyComponent<typeof import("../../app/components/NavbarPageConnector.vue")['default']>
  LazyNodeDrawer: LazyComponent<typeof import("../../app/components/NodeDrawer.vue")['default']>
  LazyReadingStreak: LazyComponent<typeof import("../../app/components/ReadingStreak.vue")['default']>
  LazySettingsModal: LazyComponent<typeof import("../../app/components/SettingsModal.vue")['default']>
  LazySidebarGraph: LazyComponent<typeof import("../../app/components/SidebarGraph.vue")['default']>
  LazyStreakCelebrationModal: LazyComponent<typeof import("../../app/components/StreakCelebrationModal.vue")['default']>
  LazyStreakShareModal: LazyComponent<typeof import("../../app/components/StreakShareModal.vue")['default']>
  LazyCanvasActionModals: LazyComponent<typeof import("../../app/components/canvas/CanvasActionModals.vue")['default']>
  LazyCanvasBoard: LazyComponent<typeof import("../../app/components/canvas/CanvasBoard.vue")['default']>
  LazyCanvasEdgeLayer: LazyComponent<typeof import("../../app/components/canvas/CanvasEdgeLayer.vue")['default']>
  LazyCanvasEmbedPreview: LazyComponent<typeof import("../../app/components/canvas/CanvasEmbedPreview.vue")['default']>
  LazyCanvasInkingOverlay: LazyComponent<typeof import("../../app/components/canvas/CanvasInkingOverlay.vue")['default']>
  LazyCanvasInsertDrawer: LazyComponent<typeof import("../../app/components/canvas/CanvasInsertDrawer.vue")['default']>
  LazyCanvasNode: LazyComponent<typeof import("../../app/components/canvas/CanvasNode.vue")['default']>
  LazyCanvasNodeBook: LazyComponent<typeof import("../../app/components/canvas/CanvasNodeBook.vue")['default']>
  LazyCanvasNodeNote: LazyComponent<typeof import("../../app/components/canvas/CanvasNodeNote.vue")['default']>
  LazyCanvasNodeShape: LazyComponent<typeof import("../../app/components/canvas/CanvasNodeShape.vue")['default']>
  LazyCanvasNodeText: LazyComponent<typeof import("../../app/components/canvas/CanvasNodeText.vue")['default']>
  LazyCanvasSelectionToolbar: LazyComponent<typeof import("../../app/components/canvas/CanvasSelectionToolbar.vue")['default']>
  LazyCanvasToolbar: LazyComponent<typeof import("../../app/components/canvas/CanvasToolbar.vue")['default']>
  LazyCanvasCycleWarningPlaceholder: LazyComponent<typeof import("../../app/components/canvas/CycleWarningPlaceholder.vue")['default']>
  LazyCanvasKnowledgeGraphView: LazyComponent<typeof import("../../app/components/canvas/KnowledgeGraphView.vue")['default']>
  LazyGraphBookAnnotationsDrawer: LazyComponent<typeof import("../../app/components/graph/BookAnnotationsDrawer.vue")['default']>
  LazyGraphThemeCanvasOverlay: LazyComponent<typeof import("../../app/components/graph/ThemeCanvasOverlay.vue")['default']>
  LazyNotesNoteCompositeRenderer: LazyComponent<typeof import("../../app/components/notes/NoteCompositeRenderer.vue")['default']>
  LazyNotesNoteEditorPane: LazyComponent<typeof import("../../app/components/notes/NoteEditorPane.vue")['default']>
  LazyReaderAiOverlayCard: LazyComponent<typeof import("../../app/components/reader/ReaderAiOverlayCard.vue")['default']>
  LazyReaderAnnotationModal: LazyComponent<typeof import("../../app/components/reader/ReaderAnnotationModal.vue")['default']>
  LazyReaderBookNotesPanel: LazyComponent<typeof import("../../app/components/reader/ReaderBookNotesPanel.vue")['default']>
  LazyReaderBottomBar: LazyComponent<typeof import("../../app/components/reader/ReaderBottomBar.vue")['default']>
  LazyReaderDictionaryCard: LazyComponent<typeof import("../../app/components/reader/ReaderDictionaryCard.vue")['default']>
  LazyReaderGraphPanel: LazyComponent<typeof import("../../app/components/reader/ReaderGraphPanel.vue")['default']>
  LazyReaderSavedPagesModal: LazyComponent<typeof import("../../app/components/reader/ReaderSavedPagesModal.vue")['default']>
  LazyReaderSelectionTooltip: LazyComponent<typeof import("../../app/components/reader/ReaderSelectionTooltip.vue")['default']>
  LazyReaderShell: LazyComponent<typeof import("../../app/components/reader/ReaderShell.vue")['default']>
  LazyReaderTypographyPopover: LazyComponent<typeof import("../../app/components/reader/ReaderTypographyPopover.vue")['default']>
  LazyReaderUploader: LazyComponent<typeof import("../../app/components/reader/Uploader.vue")['default']>
  LazyReaderViewer: LazyComponent<typeof import("../../app/components/reader/Viewer.vue")['default']>
  LazyReaderEnginePageCurlCanvas: LazyComponent<typeof import("../../app/components/reader/engine/PageCurlCanvas.vue")['default']>
  LazyReaderUploadDropZone: LazyComponent<typeof import("../../app/components/reader/upload/DropZone.vue")['default']>
  LazyNuxtWelcome: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/welcome.vue")['default']>
  LazyNuxtLayout: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-layout")['default']>
  LazyNuxtErrorBoundary: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-error-boundary.vue")['default']>
  LazyClientOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/client-only")['default']>
  LazyDevOnly: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/dev-only")['default']>
  LazyServerPlaceholder: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/server-placeholder")['default']>
  LazyNuxtLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-link")['default']>
  LazyNuxtLoadingIndicator: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-loading-indicator")['default']>
  LazyNuxtTime: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-time.vue")['default']>
  LazyNuxtRouteAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-route-announcer")['default']>
  LazyNuxtAnnouncer: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-announcer")['default']>
  LazyNuxtImg: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtImg']>
  LazyNuxtPicture: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-stubs")['NuxtPicture']>
  LazyNuxtPage: LazyComponent<typeof import("../../node_modules/nuxt/dist/pages/runtime/page")['default']>
  LazyNoScript: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['NoScript']>
  LazyLink: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Link']>
  LazyBase: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Base']>
  LazyTitle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Title']>
  LazyMeta: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Meta']>
  LazyStyle: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Style']>
  LazyHead: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Head']>
  LazyHtml: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Html']>
  LazyBody: LazyComponent<typeof import("../../node_modules/nuxt/dist/head/runtime/components")['Body']>
  LazyNuxtIsland: LazyComponent<typeof import("../../node_modules/nuxt/dist/app/components/nuxt-island")['default']>
}

declare module 'vue' {
  export interface GlobalComponents extends _GlobalComponents { }
}

export {}
