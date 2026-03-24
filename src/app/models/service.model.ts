export interface Inspection {
  id?: string;
  collectionId?: string;
  collectionName?: string;
  created?: string;
  updated?: string;

  name: string;
  description: string;
  items: string[]; // JSON array
  images?: string[]; // file names
}