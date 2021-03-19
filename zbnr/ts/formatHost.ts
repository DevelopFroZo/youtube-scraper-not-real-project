import ts from "typescript";

const formatHost = {
  getCanonicalFileName: ( path: string ) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};

export { formatHost };