'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useCreateCategory } from '@/features/tv/api/create-category';
import { useCreateVideo } from '@/features/tv/api/create-video';
import { useDeleteVideo } from '@/features/tv/api/delete-video';
import { useTvCategories } from '@/features/tv/api/get-categories';
import { useTvVideos } from '@/features/tv/api/get-videos';
import { useUpdateVideo } from '@/features/tv/api/update-video';
import { useUser } from '@/lib/auth';
import { canManageTV } from '@/lib/authorization';

type VideoFormState = {
  title: string;
  youtube_url: string;
  category_slug: string;
  is_live: boolean;
  is_pinned_live: boolean;
};

const EMPTY_VIDEO_FORM: VideoFormState = {
  title: '',
  youtube_url: '',
  category_slug: '',
  is_live: false,
  is_pinned_live: false,
};

export default function AdminTvPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: cats, isLoading: catsLoading } = useTvCategories();
  const { data: videos, isLoading: videosLoading } = useTvVideos();

  const [videoForm, setVideoForm] = useState<VideoFormState>(EMPTY_VIDEO_FORM);
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [confirmDeleteVideoId, setConfirmDeleteVideoId] = useState<number | null>(null);

  const [catForm, setCatForm] = useState({
    name: '',
    order: 0,
    is_clergy_only: false,
  });
  const [showCatForm, setShowCatForm] = useState(false);

  const { mutate: createVideo, isPending: creatingVideo } = useCreateVideo({
    onSuccess: () => {
      setShowVideoForm(false);
      setVideoForm(EMPTY_VIDEO_FORM);
    },
  });
  const { mutate: updateVideo, isPending: updatingVideo } = useUpdateVideo({
    onSuccess: () => {
      setShowVideoForm(false);
      setEditingVideoId(null);
      setVideoForm(EMPTY_VIDEO_FORM);
    },
  });
  const { mutate: deleteVideo } = useDeleteVideo();
  const { mutate: createCategory, isPending: creatingCategory } =
    useCreateCategory({
      onSuccess: () => {
        setShowCatForm(false);
        setCatForm({ name: '', order: 0, is_clergy_only: false });
      },
    });

  useEffect(() => {
    if (!userLoading && !canManageTV(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, userLoading, router]);

  if (userLoading || !canManageTV(user)) return null;

  const handleVideoSubmit = () => {
    if (!videoForm.youtube_url || !videoForm.category_slug) return;
    if (editingVideoId !== null) {
      updateVideo({ videoId: editingVideoId, ...videoForm });
    } else {
      createVideo(videoForm);
    }
  };

  const handleEditVideo = (v: {
    id: number;
    title: string;
    youtube_url: string;
    category: { slug: string };
    is_live: boolean;
    is_pinned_live: boolean;
  }) => {
    setVideoForm({
      title: v.title,
      youtube_url: v.youtube_url,
      category_slug: v.category.slug,
      is_live: v.is_live,
      is_pinned_live: v.is_pinned_live,
    });
    setEditingVideoId(v.id);
    setShowVideoForm(true);
  };

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader title="TV — Administration" />
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8 space-y-6">
        {/* Categories section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Catégories</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCatForm((v) => !v)}
            >
              {showCatForm ? 'Annuler' : '+ Catégorie'}
            </Button>
          </div>

          {showCatForm && (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50">
              <input
                id="cat-name"
                type="text"
                placeholder="Nom de la catégorie"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                id="cat-order"
                type="number"
                placeholder="Ordre (0 = premier)"
                value={catForm.order}
                onChange={(e) =>
                  setCatForm((f) => ({
                    ...f,
                    order: parseInt(e.target.value, 10) || 0,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <label
                htmlFor="cat-clergy-only"
                className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer"
              >
                <input
                  id="cat-clergy-only"
                  type="checkbox"
                  checked={catForm.is_clergy_only}
                  onChange={(e) =>
                    setCatForm((f) => ({
                      ...f,
                      is_clergy_only: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                Clergé uniquement (Formation)
              </label>
              <Button
                size="sm"
                onClick={() => createCategory(catForm)}
                disabled={creatingCategory || !catForm.name}
              >
                {creatingCategory ? 'Création…' : 'Créer'}
              </Button>
            </div>
          )}

          {catsLoading && <p className="text-xs text-gray-400">Chargement…</p>}
          <ul className="space-y-1">
            {cats?.results.map((cat) => (
              <li
                key={cat.id}
                className="flex items-center justify-between rounded-md border border-gray-100 px-3 py-2 text-sm"
              >
                <span>{cat.name}</span>
                <div className="flex items-center gap-2">
                  {cat.is_clergy_only && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700">
                      Clergé
                    </span>
                  )}
                  <span className="text-xs text-gray-400">#{cat.order}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Videos section */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Vidéos</h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowVideoForm((v) => !v);
                setEditingVideoId(null);
                setVideoForm(EMPTY_VIDEO_FORM);
              }}
            >
              {showVideoForm && editingVideoId === null ? 'Annuler' : '+ Vidéo'}
            </Button>
          </div>

          {showVideoForm && (
            <div className="rounded-lg border border-gray-200 p-3 space-y-2 bg-gray-50">
              <input
                id="video-title"
                type="text"
                placeholder="Titre (optionnel)"
                value={videoForm.title}
                onChange={(e) =>
                  setVideoForm((f) => ({ ...f, title: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <input
                id="video-url"
                type="url"
                placeholder="URL YouTube"
                value={videoForm.youtube_url}
                onChange={(e) =>
                  setVideoForm((f) => ({ ...f, youtube_url: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                id="video-category"
                value={videoForm.category_slug}
                onChange={(e) =>
                  setVideoForm((f) => ({ ...f, category_slug: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">Choisir une catégorie…</option>
                {cats?.results.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-4">
                <label
                  htmlFor="video-is-live"
                  className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer"
                >
                  <input
                    id="video-is-live"
                    type="checkbox"
                    checked={videoForm.is_live}
                    onChange={(e) =>
                      setVideoForm((f) => ({ ...f, is_live: e.target.checked }))
                    }
                    className="rounded"
                  />
                  En direct
                </label>
                <label
                  htmlFor="video-is-pinned"
                  className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer"
                >
                  <input
                    id="video-is-pinned"
                    type="checkbox"
                    checked={videoForm.is_pinned_live}
                    onChange={(e) =>
                      setVideoForm((f) => ({
                        ...f,
                        is_pinned_live: e.target.checked,
                      }))
                    }
                    className="rounded"
                  />
                  Épingler
                </label>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleVideoSubmit}
                  disabled={
                    creatingVideo ||
                    updatingVideo ||
                    !videoForm.youtube_url ||
                    !videoForm.category_slug
                  }
                >
                  {creatingVideo || updatingVideo
                    ? 'Enregistrement…'
                    : editingVideoId
                      ? 'Modifier'
                      : 'Créer'}
                </Button>
                {editingVideoId !== null && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowVideoForm(false);
                      setEditingVideoId(null);
                      setVideoForm(EMPTY_VIDEO_FORM);
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          )}

          {videosLoading && (
            <p className="text-xs text-gray-400">Chargement…</p>
          )}
          <ul className="space-y-2">
            {videos?.results.map((video) => (
              <li
                key={video.id}
                className="rounded-lg border border-gray-100 p-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {video.title || '(sans titre)'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {video.youtube_url}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {video.category.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {video.is_live && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                        LIVE
                      </span>
                    )}
                    {video.is_pinned_live && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700">
                        Épinglé
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleEditVideo(video)}
                      className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                    >
                      Éditer
                    </button>
                    {confirmDeleteVideoId === video.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            deleteVideo(video.id);
                            setConfirmDeleteVideoId(null);
                          }}
                          className="rounded px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700"
                        >
                          Confirmer
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteVideoId(null)}
                          className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100"
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteVideoId(video.id)}
                        className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Suppr.
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
        </div>
      </div>
    </AppShell>
  );
}
