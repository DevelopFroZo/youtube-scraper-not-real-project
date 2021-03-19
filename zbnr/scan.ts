import { readdirSync } from "fs";
import { resolve } from "path";

import { isFile } from "./isFile";

function scan( path: string ): string[]{
  const items = readdirSync( path );
  const result: string[] = [];
  const dirs: string[] = [];

  for( const item of items ){
    const newPath = resolve( path, item );

    if( isFile( newPath ) ){
      result.push( newPath );

      continue;
    }

    dirs.push( newPath );
  }

  for( const dir of dirs ){
    result.push( ...scan( dir ) );
  }

  return result;
}

export { scan };