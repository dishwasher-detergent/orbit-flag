import { Models } from "node-appwrite";

export interface Context extends Models.Row {
  teamId: string;
  context: string;
}
