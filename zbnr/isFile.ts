import { lstatSync } from "fs";

function isFile( path: string ): boolean{
  try{
    return lstatSync( path ).isFile();
  } catch( error ) {
    const { errno } = error;

    if( errno === -4058 || errno === -2 ){
      return false;
    }

    throw error;
  }
}

export { isFile };