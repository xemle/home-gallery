import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faFolderOpen, faChevronRight, faChevronDown, faSearch } from "@fortawesome/free-solid-svg-icons";
import { NavBar } from "../navbar/NavBar";
import { useEntryStore } from "../store/entry-store";

interface FolderNode {
  name: string;
  path: string;
  images: number;
  videos: number;
  thumbnail?: string | null;
  children: FolderNode[];
  shortId?: string;
}

const getBasePath = () => (window as any).__homeGallery?.basePath || "/";
const withBase = (url: string) => {
  const base = getBasePath().replace(/\/$/, "");
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url.replace(/^\.\//, "")}`;
};

const createOrFindNode = (list: FolderNode[], name: string, path: string): FolderNode => {
  let node = list.find((n) => n.name === name);
  if (!node) {
    node = { name, path, images: 0, videos: 0, thumbnail: null, children: [] };
    list.push(node);
  }
  return node;
};

const getThumbnail = (entry: any): string | undefined => {
  if (!Array.isArray(entry.previews) || !entry.previews.length) return undefined;
  const last = entry.previews[entry.previews.length - 1];
  return withBase(`./files/${last}`) + `?t=${Date.now()}`;
};

const buildFolderTree = (entries: any[]): FolderNode[] => {
  const root: FolderNode[] = [];
  entries.forEach((entry) => {
    const thumbnail = getThumbnail(entry);

    entry.files.forEach((file: any) => {
      const parts = (file.filename || "").split("/").filter(Boolean);
      if (!parts.length) return;

      let currentList = root;
      let accPath = "";

      parts.forEach((part, idx) => {
        accPath = accPath ? `${accPath}/${part}` : part;
        const node = createOrFindNode(currentList, part, accPath);

        if (file.type === "image") node.images++;
        if (file.type === "video") node.videos++;

        if (idx === parts.length - 1) {
          node.thumbnail = thumbnail;
          node.shortId = entry.shortId;
        }

        currentList = node.children;
      });
    });
  });

  return root;
};

interface FolderNodeItemProps {
  node: FolderNode;
  level: number;
  openFolders: Set<string>;
  toggleFolder: (path: string) => void;
}

const FolderIcon = ({ isFolder, isOpen }: { isFolder: boolean; isOpen: boolean }) => {
  if (!isFolder) return null;
  return <FontAwesomeIcon icon={isOpen ? faFolderOpen : faFolder} className="text-yellow-400 text-sm" />;
};

const CountBubbles = ({ node }: { node: FolderNode }) => (
  <div className="mt-0.5 flex items-center gap-2 text-xs">
    {node.images > 0 && <span className="inline-block px-1 py-0.5 rounded-full bg-green-800 text-green-200">{node.images}</span>}
    {node.videos > 0 && <span className="inline-block px-1 py-0.5 rounded-full bg-blue-800 text-blue-200">{node.videos}</span>}
  </div>
);

const FolderNodeItem = React.memo(function FolderNodeItem({ node, level, openFolders, toggleFolder }: FolderNodeItemProps) {
  const navigate = useNavigate();
  const isOpen = openFolders.has(node.path);
  const isFolder = node.children.length > 0;
  const paddingLeft = 8 + level * 12;
  const viewUrl = !isFolder && node.shortId ? `./view/${node.shortId}` : undefined;

  const go = (href: string, hard = false) => {
    const url = withBase(href.replace(/^\.\//, "")) + (hard ? `?t=${Date.now()}` : "");
    if (hard) window.location.href = url;
    else navigate(url);
  };

  return (
    <li>
      <div
        className="flex items-center gap-2 py-1 px-2 rounded-sm select-none"
        style={{ paddingLeft: `${paddingLeft}px`, background: isFolder ? "rgba(255,255,255,0.02)" : "transparent" }}
        onClick={() => isFolder && toggleFolder(node.path)}
      >
        {isFolder ? (
          <div className="flex items-center justify-center w-5 h-5 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggleFolder(node.path); }}>
            <FontAwesomeIcon icon={isOpen ? faChevronDown : faChevronRight} className="text-gray-300" />
          </div>
        ) : node.thumbnail ? (
          <button type="button" onClick={(e) => { e.stopPropagation(); viewUrl && go(viewUrl, true); }} className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer" aria-label={`Open ${node.name}`}>
            <img src={node.thumbnail} alt={node.name} className="w-6 h-6 object-cover rounded-sm" />
          </button>
        ) : <div className="w-6 h-6 bg-gray-700 rounded-sm" />}

        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <FolderIcon isFolder={isFolder} isOpen={isOpen} />
            {!isFolder && viewUrl ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); go(viewUrl, true); }} className="font-medium text-sm text-white truncate text-left w-full bg-transparent border-0 p-0 cursor-pointer">{node.name}</button>
            ) : <span className="font-medium text-sm text-white truncate">{node.name}</span>}
            {isFolder && <CountBubbles node={node} />}
          </div>
          {isFolder && (
            <div className="ml-2 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); go(`./search/index:Pictures%20path~"${encodeURIComponent(node.path)}"`, true); }}
                className="inline-flex items-center justify-center w-6 h-6 rounded-sm hover:bg-white/5 cursor-pointer"
                title={`Search in ${node.path}`}
              >
                <FontAwesomeIcon icon={faSearch} className="text-gray-300 text-xs" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isOpen && isFolder && (
        <ul>
          {node.children.map((child) => (
            <FolderNodeItem key={child.path} node={child} level={level + 1} openFolders={openFolders} toggleFolder={toggleFolder} />
          ))}
        </ul>
      )}
    </li>
  );
});
FolderNodeItem.displayName = "FolderNodeItem";

export const Folders = () => {
  const allEntries = useEntryStore((state) => state.allEntries);

  const [openFolders, setOpenFolders] = useState<Set<string>>(() => {
    const saved = sessionStorage.getItem('openFolders');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const tree = useMemo(() => buildFolderTree(allEntries), [allEntries]);

  const toggleFolder = (path: string) => {
    setOpenFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      sessionStorage.setItem('openFolders', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  return (
    <>
      <NavBar disableEdit={true} />
      <h2 className="m-4 text-sm text-gray-200">Folders</h2>
      <ul className="m-4 flex flex-col gap-0">
        {tree.length === 0 && <li className="p-2 text-gray-500">No folders found</li>}
        {tree.map(node => (
          <FolderNodeItem key={node.path} node={node} level={0} openFolders={openFolders} toggleFolder={toggleFolder} />
        ))}
      </ul>
    </>
  );
};
