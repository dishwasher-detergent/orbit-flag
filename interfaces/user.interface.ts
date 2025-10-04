import { Models } from "node-appwrite";

export interface UserData extends Models.Row {
  name: string;
  about?: string;
}

export interface UserMemberData extends UserData {
  roles: string[];
  confirmed: boolean;
  joinedAt: string;
}

export interface User extends Models.User<Models.Preferences>, UserData {}
