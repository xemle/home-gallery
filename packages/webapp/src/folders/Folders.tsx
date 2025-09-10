// src/folders/Folders.tsx
import * as React from "react";
import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faFolderOpen,
  faChevronRight,
  faChevronDown,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import { NavBar } from "../navbar/NavBar";
import { useEntryStore } from "../store/entry-store";

/* ============================================================   TYPES   ============================================================ */
interface FolderNode {
  name: string;
  path: string;
  images: number;
  videos: number;
  thumbnail?: string | null;
  children: string[];
  shortId?: string;
}

interface FolderMap {
  [path: string]: FolderNode;
}

/* ============================================================   PATH   ============================================================ */
function getBasePath(): string {
  return (window as any).__homeGallery?.basePath || "/";
}

function withBase(url: string): string {
  const base = getBasePath().replace(/\/$/, "");
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url.replace(/^\.\//, "")}`;
}

/* ============================================================   THUMBNAIL   ============================================================ */
function getThumbnail(entry: any): string | undefined {
  if (!Array.isArray(entry.previews) || !entry.previews.length) return undefined;
  const last = entry.previews[entry.previews.length - 1];
  return withBase(`./files/${last}`) + `?t=${Date.now()}`;
}

/* ============================================================   INDEX   ============================================================ */
function buildFolderIndex(entries: any[]): { root: string[]; map: FolderMap } {
  const map: FolderMap = {};
  const root: string[] = [];

  function createOrFindNode(name: string, path: string): FolderNode {
    if (!map[path]) {
      map[path] = {
        name,
        path,
        images: 0,
        videos: 0,
        children: [],
        thumbnail: null,
      };
    }
    return map[path];
  }

  entries.forEach((entry) => {
    const thumbnail = getThumbnail(entry);

    entry.files.forEach((file: any) => {
      const parts = (file.filename || "").split("/").filter(Boolean);
      if (!parts.length) return;

      let accPath = "";

      parts.forEach((part, idx) => {
        accPath = accPath ? `${accPath}/${part}` : part;
        const node = createOrFindNode(part, accPath);

        if (idx === 0 && !root.includes(accPath)) {
          root.push(accPath);
        }

        if (file.type === "image") node.images++;
        if (file.type === "video") node.videos++;

        if (idx === parts.length - 1) {
          node.thumbnail = thumbnail;
          node.shortId = entry.shortId;
        }

        if (idx > 0) {
          const parentPath = parts.slice(0, idx).join("/");
          const parent = map[parentPath];
          if (parent && !parent.children.includes(accPath)) {
            parent.children.push(accPath);
          }
        }
      });
    });
  });

  return { root, map };
}

/* ============================================================   ICONS   ============================================================ */
function FolderIcon({ isFolder, isOpen }: { isFolder: boolean; isOpen: boolean }) {
  if (!isFolder) return null;
  return (
    <FontAwesomeIcon
      icon={isOpen ? faFolderOpen : faFolder}
      className="text-yellow-400 text-sm"
    />
  );
}

function CountBubbles({ node }: { node: FolderNode }) {
  return (
    <div className="mt-0.5 flex items-center gap-2 text-xs">
      {node.images > 0 && (
        <span className="inline-block px-1 py-0.5 rounded-full bg-green-800 text-green-200">
          {node.images}
        </span>
      )}
      {node.videos > 0 && (
        <span className="inline-block px-1 py-0.5 rounded-full bg-blue-800 text-blue-200">
          {node.videos}
        </span>
      )}
    </div>
  );
}

/* ============================================================  RENDER NODE  ============================================================ */
interface FolderNodeItemProps {
  path: string;
  map: FolderMap;
  level: number;
  openFolders: Set<string>;
  toggleFolder: (path: string) => void;
}

const FolderNodeItem = React.memo(function FolderNodeItem({
  path,
  map,
  level,
  openFolders,
  toggleFolder,
}: FolderNodeItemProps) {
  const navigate = useNavigate();
  const node = map[path];
  const isOpen = openFolders.has(node.path);
  const isFolder = node.children.length > 0;
  const paddingLeft = 8 + level * 12;
  const viewUrl = !isFolder && node.shortId ? `./view/${node.shortId}` : undefined;

  function go(href: string, hard = false) {
    const url = withBase(href.replace(/^\.\//, "")) + (hard ? `?t=${Date.now()}` : "");
    if (hard) window.location.href = url;
    else navigate(url);
  }

  function renderFolderToggle() {
    return (
      <div
        className="flex items-center justify-center w-5 h-5 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          toggleFolder(node.path);
        }}
      >
        <FontAwesomeIcon
          icon={isOpen ? faChevronDown : faChevronRight}
          className="text-gray-300"
        />
      </div>
    );
  }

  function renderThumbnailButton() {
    if (!node.thumbnail) return <div className="w-6 h-6 bg-gray-700 rounded-sm" />;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          viewUrl && go(viewUrl, true);
        }}
        className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
        aria-label={`Open ${node.name}`}
      >
        <img src={node.thumbnail} alt={node.name} className="w-6 h-6 object-cover rounded-sm" />
      </button>
    );
  }

  function renderLabel() {
    if (!isFolder && viewUrl) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(viewUrl, true);
          }}
          className="font-medium text-sm text-white truncate text-left w-full bg-transparent border-0 p-0 cursor-pointer"
        >
          {node.name}
        </button>
      );
    }
    return <span className="font-medium text-sm text-white truncate">{node.name}</span>;
  }

  function renderSearchButton() {
    if (!isFolder) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          go(`./search/index:Pictures%20path~\"${encodeURIComponent(node.path)}\"`, true);
        }}
        className="inline-flex items-center justify-center w-6 h-6 rounded-sm hover:bg-white/5 cursor-pointer"
        title={`Search in ${node.path}`}
      >
        <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-xs" />
      </button>
    );
  }

  return (
    <li>
      <div
        className="flex items-center gap-2 py-1 px-2 rounded-sm select-none"
        style={{
          paddingLeft: `${paddingLeft}px`,
          background: isFolder ? "rgba(255,255,255,0.02)" : "transparent",
        }}
        onClick={() => isFolder && toggleFolder(node.path)}
      >
        {isFolder ? renderFolderToggle() : renderThumbnailButton()}
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <FolderIcon isFolder={isFolder} isOpen={isOpen} />
            {renderLabel()}
            {isFolder && <CountBubbles node={node} />}
          </div>
          {isFolder && <div className="ml-2 flex-shrink-0">{renderSearchButton()}</div>}
        </div>
      </div>

      {isOpen && isFolder && (
        <ul>
          {node.children.map((childPath) => (
            <FolderNodeItem
              key={childPath}
              path={childPath}
              map={map}
              level={level + 1}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </ul>
      )}
    </li>
  );
});
FolderNodeItem.displayName = "FolderNodeItem";

/* ============================================================   FOLDERS   ============================================================ */
export function Folders() {
  const allEntries = useEntryStore((state) => state.allEntries);
  
  const DEBOUNCE_MS = 800;
  const [readyEntries, setReadyEntries] = useState<any[] | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const gw = (window as any).__homeGallery || {};
    const explicitReady =
      gw.dbLoaded || gw.dbPackLoaded || gw.dbComplete || gw.offlineDbLoaded || gw.offlineDbComplete;
    if (explicitReady) {
      setReadyEntries(allEntries);
      return;
    }

    if (!allEntries || allEntries.length === 0) {
      setReadyEntries(null);
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      setReadyEntries(allEntries);
      debounceRef.current = null;
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [allEntries]);

  const { root, map } = useMemo(() => {
    if (!readyEntries) return { root: [], map: {} as FolderMap };
    return buildFolderIndex(readyEntries);
  }, [readyEntries]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem("openFolders");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  function toggleFolder(path: string) {
    setOpenFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      sessionStorage.setItem("openFolders", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }

  // -------------------------------------------------- UI spinner --------------------------------------------------
  const isWaitingForFullPack = !readyEntries && (allEntries?.length ?? 0) > 0;

  return (
    <>
      <NavBar disableEdit={true} />
      <h2 className="m-4 text-sm text-gray-200">Folders</h2>

      {isWaitingForFullPack && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 flex flex-col items-center gap-3 p-6 rounded-md">
            <div
              role="status"
              aria-label="Loading full data pack"
              className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"
            />
            <div className="text-sm text-gray-200">Loading Media…</div>
          </div>
        </div>
      )}
      {readyEntries ? (
        <ul className="m-4 flex flex-col gap-0">
          {root.length === 0 && <li className="p-2 text-gray-500">No folders found</li>}
          {root.map((path) => (
            <FolderNodeItem
              key={path}
              path={path}
              map={map}
              level={0}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
}
