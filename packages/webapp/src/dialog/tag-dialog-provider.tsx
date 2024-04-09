import * as React from "react";

import { Tag, FaceTag } from "../api/models";

import { MultiTagDialog, SingleTagDialog } from './tag-dialog'
import { SingleFaceTagDialog } from './face-tag-dialog'

export type TagDialogConfig = {
  initialTags?: Tag[];
  initialFaceTags?: FaceTag[];
  onTagsSubmit: ({tags}: {tags: Tag[]}) => void;
  onFaceTagsSubmit: ({tags}: {tags: FaceTag[]}) => void;
}

const initialTagDialogConfig: TagDialogConfig = {
  initialTags: [],
  initialFaceTags: [],
  onTagsSubmit: () => false,
  onFaceTagsSubmit: () => false
}


export type TagDialogContextType = {
  setTagsDialogVisible: (visible: boolean) => void;
  openTagsDialog: ({initialTags, onTagsSubmit}: TagDialogConfig) => void

  setFaceTagsDialogVisible: (visible: boolean) => void;
  openFaceTagsDialog: ({initialTags, onFaceTagsSubmit}: TagDialogConfig) => void
}

const initialTagDialogContextValue: TagDialogContextType = {
  setTagsDialogVisible: () => false,
  openTagsDialog: () => false,

  setFaceTagsDialogVisible: () => false,
  openFaceTagsDialog: () => false
}


export const TagDialogContext = React.createContext<TagDialogContextType>(initialTagDialogContextValue)
export const FaceTagDialogContext = React.createContext<TagDialogContextType>(initialTagDialogContextValue)

export const MultiTagDialogProvider = ({children}) => {
  const [ dialogVisible, setTagsDialogVisible ] = React.useState(false);
  const [ config, setTagsConfig ] = React.useState<TagDialogConfig>(initialTagDialogConfig);

  const [ faceDialogVisible, setFaceTagsDialogVisible ] = React.useState(false);
  const [ facesConfig, setFacesConfig ] = React.useState<TagDialogConfig>(initialTagDialogConfig);

  const openTagsDialog = (dialgConfig: TagDialogConfig) => {
    setTagsDialogVisible(true);
    setFaceTagsDialogVisible(false);
    setTagsConfig((prev) => ({...prev, ...dialgConfig}));
  };

  const onTagsSubmit = ({tags}) => {
    config.onTagsSubmit({tags})
  }

  const openFaceTagsDialog = (dialgConfig: TagDialogConfig) => {
    setTagsDialogVisible(true);
    setFaceTagsDialogVisible(false);
    
    setFacesConfig((prev) => ({...prev, ...dialgConfig}));
  };

  // const onFaceTagsSubmit = ({tags}) => {
  //   facesConfig.onFaceTagsSubmit({tags})
  // }

  return (
    <TagDialogContext.Provider value={{ setTagsDialogVisible, openTagsDialog, setFaceTagsDialogVisible, openFaceTagsDialog }}>
      {children}
      { dialogVisible && (
        <MultiTagDialog onSubmit={onTagsSubmit} onCancel={() => setTagsDialogVisible(false)}></MultiTagDialog>
      )}
      {/* {children}
      { faceDialogVisible && (
        <MultiFaceTagDialog onSubmit={onFaceTagsSubmit} onCancel={() => setFaceTagsDialogVisible(false)}></MultiFaceTagDialog>
      )} */}
    </TagDialogContext.Provider>
  )
}

export const SingleTagDialogProvider = ({children}) => {
  const [ tagsDialogVisible, setTagsDialogVisible ] = React.useState(false);
  const [ facesDialogVisible, setFaceTagsDialogVisible ] = React.useState(false);

  const [ tagsConfig, setTagsConfig ] = React.useState<TagDialogConfig>(initialTagDialogConfig);


  const openTagsDialog = ({ initialTags: tags, initialFaceTags: faceTags, onTagsSubmit, onFaceTagsSubmit }: TagDialogConfig) => {
    setTagsDialogVisible(true);
    setFaceTagsDialogVisible(false);
    setTagsConfig({ initialTags: tags, initialFaceTags: faceTags, onTagsSubmit, onFaceTagsSubmit });
  };

  const openFaceTagsDialog = ({ initialTags: tags, initialFaceTags: faceTags, onTagsSubmit, onFaceTagsSubmit }: TagDialogConfig) => {
    setTagsDialogVisible(false);
    setFaceTagsDialogVisible(true);
    setTagsConfig({ initialTags: tags, initialFaceTags: faceTags, onTagsSubmit, onFaceTagsSubmit });
  };

  const onTagsSubmit = ({tags}) => {
    tagsConfig.onTagsSubmit({tags})
  }

  const onFaceTagsSubmit = ({tags}) => {
    tagsConfig.onFaceTagsSubmit({tags})
  }


  return (
    <TagDialogContext.Provider value={{ setTagsDialogVisible, openTagsDialog, setFaceTagsDialogVisible, openFaceTagsDialog }}>
      {children}
      { tagsDialogVisible && (
        <SingleTagDialog tags={tagsConfig.initialTags || []} onSubmit={onTagsSubmit} onCancel={() => setTagsDialogVisible(false)}></SingleTagDialog>
      )}
      { facesDialogVisible && (
        <SingleFaceTagDialog faceTags={tagsConfig.initialFaceTags || []} onSubmit={onFaceTagsSubmit} onCancel={() => setFaceTagsDialogVisible(false)}></SingleFaceTagDialog>
      )}
    </TagDialogContext.Provider>
  )
}


