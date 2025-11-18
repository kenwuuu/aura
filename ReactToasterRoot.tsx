// ReactToasterRoot.tsx
import React from "react";
import { Toaster } from "@/components/ui/sonner";

// TODO: this is to glue the Toaster component into index.html. the moment we refactor to be a full react app,
//  this should be removed and toaster just called in app root as a normal react component
export function ReactToasterRoot() {
  return <Toaster />;
}
