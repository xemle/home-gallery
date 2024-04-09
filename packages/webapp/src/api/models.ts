export interface Tag {
  name: string;
  remove: boolean;
}

export interface FaceTag extends Tag {
  descriptorIndex: number;
}

