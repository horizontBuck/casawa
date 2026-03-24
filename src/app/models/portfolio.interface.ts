export interface Portfolio {
  id?: string;
  collectionId?: string;
  collectionName?: string;
  created?: string;
  updated?: string;

  name: string;
  tag: 'residencial' | 'comercial';
  type: 'img' | 'video';
  images?: string[]; // file names
}
