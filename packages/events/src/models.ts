export interface Event {
  type: 'userAction';
  id: string;
  date?: string;
  targetIds: string[];
  // means that can't be more than one same object in one file.
  // made for faces, so seems useful
  // for example we have file 02f3p with faces 0, 1, 2
  // in one event we can put only one faceTag. So in case we will make bulk renaming we will get three events:
  // targetIds[02f3p], tagretSubIds[0]
  // targetIds[02f3p], tagretSubIds[1]
  // targetIds[02f3p], tagretSubIds[2]
  // 
  // espesially important for multiedit of many files, for example files 02f3p, jhr65, 3lh7a
  // they have same person, but it have different places in each file, then we will get ONE event:
  // targetIds[02f3p, jhr65, 3lh7a], tagretSubIds[5, 0, 3]
  //
  // this approach is kind of trade off and we loose some benefits in single file/many faces edit
  // but makes multifiles edit better

  subtargetCoords?: Rect[]; 
  actions: EventAction[];
}

export interface EventAction {
  action: string;
  value: string;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EventListener = (event: Event) => void;
