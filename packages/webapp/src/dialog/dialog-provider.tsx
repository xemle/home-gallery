import * as React from "react";

import { Tag, FaceTag } from "../api/models";

import { MultiTagDialog, SingleTagDialog } from './tag-dialog'
import { MultiFaceTagDialog, SingleFaceTagDialog } from './face-tag-dialog'

export type TagsConfig = {
  initialTags?: Tag[];
  onTagsSubmit: ({ tags }: { tags: Tag[] }) => void;
}

export type FaceTagsConfig = {
  initialFaceTags?: FaceTag[];
  onFaceTagsSubmit: ({ faceTags }: { faceTags: FaceTag[] }) => void;
}

const initialTagsConfig: TagsConfig = {
  initialTags: [],
  onTagsSubmit: () => false,
}

const initialFaceTagsConfig: FaceTagsConfig = {
  initialFaceTags: [],
  onFaceTagsSubmit: () => false
}

export type DialogContextType = {
  setTagsDialogVisible: (visible: boolean) => void;
  openTagsDialog: ({ initialTags, onTagsSubmit }: TagsConfig) => void

  setFaceTagsDialogVisible: (visible: boolean) => void;
  openFaceTagsDialog: ({ initialFaceTags, onFaceTagsSubmit }: FaceTagsConfig) => void
}

const initialDialogContextValue: DialogContextType = {
  setTagsDialogVisible: () => false,
  openTagsDialog: () => false,

  setFaceTagsDialogVisible: () => false,
  openFaceTagsDialog: () => false
}

export const DialogContext = React.createContext<DialogContextType>(initialDialogContextValue)

export const MultiTagDialogProvider = ({ children }) => {
  const [tagsDialogVisible, setTagsDialogVisible] = React.useState(false);
  const [facesDialogVisible, setFaceTagsDialogVisible] = React.useState(false);

  const [tagsConfig, setTagsConfig] = React.useState<TagsConfig>(initialTagsConfig);
  const [faceTagsConfig, setFaceTagsConfig] = React.useState<FaceTagsConfig>(initialFaceTagsConfig);

  const openTagsDialog = (tagsConfig: TagsConfig) => {
    setTagsDialogVisible(true);
    setFaceTagsDialogVisible(false);

    setTagsConfig((prev) => ({ ...prev, ...tagsConfig }));
  };

  const onTagsSubmit = ({ tags }) => {
    tagsConfig.onTagsSubmit({ tags })
  }

  const openFaceTagsDialog = (faceTagsConfig: FaceTagsConfig) => {
    setTagsDialogVisible(true);
    setFaceTagsDialogVisible(false);

    setFaceTagsConfig((prev) => ({ ...prev, ...faceTagsConfig }));
  };

  const onFaceTagsSubmit = ({ faceTags }) => {
    faceTagsConfig.onFaceTagsSubmit({ faceTags })
  }

  return (
    <DialogContext.Provider value={{ setTagsDialogVisible, openTagsDialog, setFaceTagsDialogVisible, openFaceTagsDialog }}>
      {children}
      {tagsDialogVisible && (
        <MultiTagDialog onSubmit={onTagsSubmit} onCancel={() => setTagsDialogVisible(false)}></MultiTagDialog>
      )}
      { facesDialogVisible && (
        <MultiFaceTagDialog onSubmit={onFaceTagsSubmit} onCancel={() => setFaceTagsDialogVisible(false)}></MultiFaceTagDialog>
      )}
    </DialogContext.Provider>
  )
}

export const SingleTagDialogProvider = ({ children }) => {
  const [tagsDialogVisible, setTagsDialogVisible] = React.useState(false);
  const [facesDialogVisible, setFaceTagsDialogVisible] = React.useState(false);

  const [tagsConfig, setTagsConfig] = React.useState<TagsConfig>(initialTagsConfig);
  const [faceTagsConfig, setFaceTagsConfig] = React.useState<FaceTagsConfig>(initialFaceTagsConfig);


  const openTagsDialog = ({ initialTags, onTagsSubmit }: TagsConfig) => {
    setTagsDialogVisible(true);
    setFaceTagsDialogVisible(false);

    setTagsConfig({ initialTags, onTagsSubmit });
  };

  const openFaceTagsDialog = ({ initialFaceTags, onFaceTagsSubmit }: FaceTagsConfig) => {
    setTagsDialogVisible(false);
    setFaceTagsDialogVisible(true);

    setFaceTagsConfig({ initialFaceTags, onFaceTagsSubmit });
  };

  const onTagsSubmit = ({ tags }) => {
    tagsConfig.onTagsSubmit({ tags })
  }

  const onFaceTagsSubmit = ({ faceTags }) => {
    faceTagsConfig.onFaceTagsSubmit({ faceTags })
  }


  return (
    <DialogContext.Provider value={{ setTagsDialogVisible, openTagsDialog, setFaceTagsDialogVisible, openFaceTagsDialog }}>
      {children}
      {tagsDialogVisible && (
        <SingleTagDialog tags={tagsConfig.initialTags || []} onSubmit={onTagsSubmit} onCancel={() => setTagsDialogVisible(false)}></SingleTagDialog>
      )}
      {facesDialogVisible && (
        <SingleFaceTagDialog faceTags={faceTagsConfig.initialFaceTags || []} onSubmit={onFaceTagsSubmit} onCancel={() => setFaceTagsDialogVisible(false)}></SingleFaceTagDialog>
      )}
    </DialogContext.Provider>
  )
}


