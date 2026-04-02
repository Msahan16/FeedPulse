import { model, Schema } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    role: { type: String, default: "admin" },
  },
  { timestamps: true },
);

export const UserModel = model("User", UserSchema);
