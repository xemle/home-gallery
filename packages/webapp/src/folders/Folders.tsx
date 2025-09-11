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
  faCamera,
} from "@fortawesome/free-solid-svg-icons";
import { NavBar } from "../navbar/NavBar";
import { useEntryStore } from "../store/entry-store";

/* ============================================================   CONFIG   ============================================================ */
const SHOW_UNKNOWN_MAKES = false;

/* ============================================================   TYPES   ============================================================ */
interface FolderNode {
  name: string;
  path: string;
  images: number;
  videos: number;
  thumbnail?: string | null;
  children: string[];
  shortId?: string;
  virtual?: boolean;
  filterQuery?: string;
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
  const base = withBase(`./files/${last}`);
  const { protocol, host } = window.location;
  return `${protocol}//${host}${base}`;
}

/* ============================================================   FILTERS   ============================================================ */
function buildFilters(entries: any[]): { root: string[]; map: FolderMap } {
  const map: FolderMap = {};
  const root: string[] = [];

  function ensureNode(displayName: string, path: string, parentPath?: string, virtual = true): FolderNode {
    if (!map[path]) {
      map[path] = { name: displayName, path, images: 0, videos: 0, children: [], thumbnail: null, virtual };
      if (parentPath) {
        if (!map[parentPath]) {
          map[parentPath] = {
            name: parentPath.split("/").pop() || parentPath,
            path: parentPath,
            images: 0,
            videos: 0,
            children: [],
            thumbnail: null,
            virtual: true,
          };
        }
        if (!map[parentPath].children.includes(path)) map[parentPath].children.push(path);
      } else {
        root.push(path);
      }
    }
    return map[path];
  }

  const filtersRoot = ensureNode("Filters", "Filters");
  const makeDisplayByKey = new Map<string, string>();
  const modelDisplayByKey = new Map<string, string>();

  entries.forEach((entry) => {
    const makeRaw = entry.exif?.Make ?? entry.make ?? entry.camera?.make ?? null;
    const modelRaw = entry.exif?.Model ?? entry.model ?? entry.camera?.model ?? null;
    const makeTrimmed = (makeRaw || "").toString().trim();
    const modelTrimmed = (modelRaw || "").toString().trim();
    const makeKey = makeTrimmed ? makeTrimmed.toUpperCase() : "UNKNOWN_MAKE";
    const modelKey = modelTrimmed ? modelTrimmed.toUpperCase() : "UNKNOWN_MODEL";

    if (!SHOW_UNKNOWN_MAKES) {
      if (!makeTrimmed || /^unknown$/i.test(makeTrimmed) || makeKey === "UNKNOWN_MAKE") return;
      if (!modelTrimmed || /^unknown$/i.test(modelTrimmed) || modelKey === "UNKNOWN_MODEL") return;
    } else {
      if (!makeTrimmed) return;
    }

    if (!makeDisplayByKey.has(makeKey) && makeTrimmed) makeDisplayByKey.set(makeKey, makeTrimmed);
    const makeDisplayName = makeDisplayByKey.get(makeKey) || makeTrimmed || "Unknown";

    const makePath = `Filters/${makeKey}`;
    ensureNode(makeDisplayName, makePath, filtersRoot.path);

    if (modelTrimmed) {
      const mmKey = `${makeKey}|${modelKey}`;
      if (!modelDisplayByKey.has(mmKey)) modelDisplayByKey.set(mmKey, modelTrimmed);
      const modelDisplayName = modelDisplayByKey.get(mmKey) || modelTrimmed;

      const modelPath = `${makePath}/${modelKey}`;
      const modelNode = ensureNode(modelDisplayName, modelPath, makePath);

      modelNode.filterQuery = `model:"${encodeURIComponent(modelTrimmed)}"`;
      modelNode.images++;
      if (map[makePath]) map[makePath].images++;
    }
  });

  return { root, map };
}

/* ============================================================   INDEX   ============================================================ */
function buildFolderIndex(entries: any[]): { root: string[]; map: FolderMap } {
  const map: FolderMap = {};
  const root: string[] = [];

  function createOrFindNode(name: string, path: string): FolderNode {
    if (!map[path]) {
      map[path] = { name, path, images: 0, videos: 0, children: [], thumbnail: null };
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

        if (idx === 0 && !root.includes(accPath)) root.push(accPath);
        if (file.type === "image") node.images++;
        if (file.type === "video") node.videos++;

        if (idx === parts.length - 1) {
          node.thumbnail = thumbnail;
          node.shortId = entry.shortId;
        }

        if (idx > 0) {
          const parentPath = parts.slice(0, idx).join("/");
          const parent = map[parentPath];
          if (parent && !parent.children.includes(accPath)) parent.children.push(accPath);
        }
      });
    });
  });

  return { root, map };
}

/* ============================================================   SORT HELPER   ============================================================ */
function sortNodes(aPath: string, bPath: string, map: FolderMap) {
  if (aPath.startsWith("Filters")) return -1;
  if (bPath.startsWith("Filters")) return 1;
  const a = map[aPath];
  const b = map[bPath];
  const aIsFolder = a.children.length > 0;
  const bIsFolder = b.children.length > 0;
  if (aIsFolder && !bIsFolder) return -1;
  if (!aIsFolder && bIsFolder) return 1;
  return a.name.localeCompare(b.name, undefined, { numeric: true });
}

/* ============================================================   ICONS   ============================================================ */

function FolderIcon({
  isFolder,
  isOpen,
  virtual,
}: {
  isFolder: boolean;
  isOpen: boolean;
  virtual?: boolean;
}) {
  if (!isFolder) return null;
  return (
    <FontAwesomeIcon
      icon={isOpen ? faFolderOpen : faFolder}
      className={virtual ? "text-purple-300 text-sm" : "text-yellow-400 text-sm"}
    />
  );
}

function CountBubbles({ node }: { node: FolderNode }) {
  return (
    <div className="mt-0.5 flex items-center gap-2 text-xs">
      {node.images > 0 && (
        <span className="inline-block px-1 py-0.5 rounded-full bg-green-800 text-green-200">{node.images}</span>
      )}
      {node.videos > 0 && (
        <span className="inline-block px-1 py-0.5 rounded-full bg-blue-800 text-blue-200">{node.videos}</span>
      )}
    </div>
  );
}

/* ============================================================   FOLDER NODE ITEM   ============================================================ */
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
  const insideFilters = node.path.startsWith("Filters/");

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
        <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} className="text-gray-300" />
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

  function renderFilterLeafCamera() {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (node.filterQuery) go(`./search/${node.filterQuery}`, true);
        }}
        className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer flex items-center justify-center"
        aria-label={node.filterQuery ? `Filter ${node.name}` : node.name}
      >
        <FontAwesomeIcon icon={faCamera} className="text-purple-300 text-lg" />
      </button>
    );
  }

  function renderLabel() {
    if (node.filterQuery) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            go(`./search/${node.filterQuery}`, true);
          }}
          className="font-medium text-sm text-purple-200 truncate text-left w-full bg-transparent border-0 p-0 cursor-pointer"
        >
          {node.name}
        </button>
      );
    }
    return <span className="font-medium text-sm text-white truncate">{node.name}</span>;
  }

  function renderSearchButton() {
    if (node.path === "Filters") return null;
    if (insideFilters) {
      return (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (node.filterQuery) go(`./search/${node.filterQuery}`, true);
            else go(`./search/index:Pictures%20path~\"${encodeURIComponent(node.path)}\"`, true);
          }}
          className="inline-flex items-center justify-center w-6 h-6 rounded-sm hover:bg-white/5 cursor-pointer"
          title={node.filterQuery ? `Filter by ${node.name}` : `Search in ${node.path}`}
        >
          <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-xs" />
        </button>
      );
    }
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
        style={{ paddingLeft: `${paddingLeft}px`, background: isFolder ? "rgba(255,255,255,0.02)" : "transparent" }}
        onClick={() => isFolder && toggleFolder(node.path)}
      >
        {isFolder ? renderFolderToggle() : insideFilters ? renderFilterLeafCamera() : renderThumbnailButton()}

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {isFolder ? (
              node.path === "Filters" ? (
                <FolderIcon isFolder={isFolder} isOpen={isOpen} virtual={true} />
              ) : insideFilters ? (
                <FontAwesomeIcon icon={faCamera} className="text-purple-300 text-sm" />
              ) : (
                <FolderIcon isFolder={isFolder} isOpen={isOpen} virtual={node.virtual} />
              )
            ) : null}
            {renderLabel()}
            {(isFolder || insideFilters) && <CountBubbles node={node} />}
          </div>
          {isFolder && <div className="ml-2 flex-shrink-0">{renderSearchButton()}</div>}
          {!isFolder && insideFilters && <div className="ml-2 flex-shrink-0">{renderSearchButton()}</div>}
        </div>
      </div>

      {isOpen && isFolder && (
        <ul>
          {node.children
            .slice()
            .sort((a, b) => sortNodes(a, b, map))
            .map((childPath) => (
              <FolderNodeItem key={childPath} path={childPath} map={map} level={level + 1} openFolders={openFolders} toggleFolder={toggleFolder} />
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
    const explicitReady = gw.dbLoaded || gw.dbPackLoaded || gw.dbComplete || gw.offlineDbLoaded || gw.offlineDbComplete;
    if (explicitReady) {
      setReadyEntries(allEntries);
      return;
    }
    if (!allEntries || allEntries.length === 0) {
      setReadyEntries(null);
      return;
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current);
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

  const { root: folderRoot, map: folderMap } = useMemo(
    () => (readyEntries ? buildFolderIndex(readyEntries) : { root: [], map: {} as FolderMap }),
    [readyEntries]
  );

  const { root: filterRoot, map: filterMap } = useMemo(
    () => (readyEntries ? buildFilters(readyEntries) : { root: [], map: {} as FolderMap }),
    [readyEntries]
  );
  const combinedRoot = [...filterRoot, ...folderRoot.filter((r) => !filterRoot.includes(r))];
  const combinedMap = { ...folderMap, ...filterMap };
  const [openFolders, setOpenFolders] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem("openFolders");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  function toggleFolder(path: string) {
    setOpenFolders((prev) => {
      const newSet = new Set(prev);
      newSet.has(path) ? newSet.delete(path) : newSet.add(path);
      sessionStorage.setItem("openFolders", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }

  const isWaitingForFullPack = !readyEntries && (allEntries?.length ?? 0) > 0;

  return (
    <>
      <NavBar disableEdit={true} />
      {isWaitingForFullPack ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center" aria-busy="true" aria-live="polite">
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative z-10 flex flex-col items-center gap-3 p-6 rounded-md">
            <div role="status" aria-label="Loading full data pack" className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <div className="text-sm text-gray-200">Loading Media…</div>
          </div>
        </div>
      ) : (
        <ul className="m-4 flex flex-col gap-0">
          {combinedRoot.length === 0 && <li className="p-2 text-gray-500">No folders found</li>}
          {combinedRoot
            .slice()
            .sort((a, b) => sortNodes(a, b, combinedMap))
            .map((path) => (
              <FolderNodeItem key={path} path={path} map={combinedMap} level={0} openFolders={openFolders} toggleFolder={toggleFolder} />
            ))}
        </ul>
      )}
    </>
  );
}
