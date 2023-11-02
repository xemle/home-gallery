import * as React from "react";

import { Tag } from "../api/models";

import { MultiTagDialog, SingleTagDialog } from './tag-dialog'

export type TagDialogConfig = {
  initialTags?: Tag[];
  onSubmit: ({tags}: {tags: Tag[]}) => void
}

const initialTagDialogConfig: TagDialogConfig = {
  initialTags: [],
  onSubmit: () => false
}

export type TagDialogContextType = {
  setDialogVisible: (visible: boolean) => void;
  openDialog: ({initialTags, onSubmit}: TagDialogConfig) => void
}

const initialTagDialogContextValue: TagDialogContextType = {
  setDialogVisible: () => false,
  openDialog: () => false
}

export const TagDialogContext = React.createContext<TagDialogContextType>(initialTagDialogContextValue)

export const MultiTagDialogProvider = ({children}) => {
  const [ dialogVisible, setDialogVisible ] = React.useState(false);
  const [ config, setConfig ] = React.useState<TagDialogConfig>(initialTagDialogConfig);

  const openDialog = (dialgConfig: TagDialogConfig) => {
    setDialogVisible(true);
    setConfig((prev) => ({...prev, ...dialgConfig}));
  };

  const onSubmit = ({tags}) => {
    config.onSubmit({tags})
  }

  return (
    <TagDialogContext.Provider value={{ setDialogVisible, openDialog }}>
      {children}
      { dialogVisible && (
        <MultiTagDialog onSubmit={onSubmit} onCancel={() => setDialogVisible(false)}></MultiTagDialog>
      )}
    </TagDialogContext.Provider>
  )
}

export const SingleTagDialogProvider = ({children}) => {
  const [ dialogVisible, setDialogVisible ] = React.useState(false);
  const [ config, setConfig ] = React.useState<TagDialogConfig>(initialTagDialogConfig);

  const openDialog = ({ initialTags: tags, onSubmit }: TagDialogConfig) => {
    setDialogVisible(true);
    setConfig({ initialTags: tags, onSubmit });
  };

  const onSubmit = ({tags}) => {
    config.onSubmit({tags})
  }

  return (
    <TagDialogContext.Provider value={{ setDialogVisible, openDialog }}>
      {children}
      { dialogVisible && (
        <SingleTagDialog tags={config.initialTags || []} onSubmit={onSubmit} onCancel={() => setDialogVisible(false)}></SingleTagDialog>
      )}
    </TagDialogContext.Provider>
  )
}
