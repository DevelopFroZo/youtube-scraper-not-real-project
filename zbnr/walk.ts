import { readdirSync, lstatSync, unlinkSync, rmdirSync } from "fs";

import { resolve } from "path";

import { isFile } from "./isFile";

function dash( count: number ){
  return "-".repeat( count );
}

function walkRecursive( path: string, isClear: boolean, isNoTreeShow: boolean, level: number = 0 ): [number, number]{
  let items: string[] = [];
  let totalSize = 0;
  let totalFiles = 0;

  try{
    items = readdirSync( path );
  } catch( error ) {
    if( !isNoTreeShow ){
      console.log( `> \x1b[36m|- \x1b[31m${path}\x1b[0m` );
    }

    return [ 0, 0 ];
  }

  if( level === 0 && !isNoTreeShow ){
    console.log( `> \x1b[36m|- Start scan \x1b[35m${path}\x1b[36m...\x1b[0m` );
  }

  for( const item of items ){
    const newPath = resolve( path, item );

    if( isFile( newPath ) ){
      const size = lstatSync( newPath ).size / 1024;

      if( !isNoTreeShow ){
        console.log( `> \x1b[36m|-${dash( level )} \x1b[35m${item} \x1b[36m(\x1b[35m${size.toFixed( 2 )} Kb\x1b[36m)\x1b[0m` );
      }

      totalSize += size;
      totalFiles++;

      if( isClear ){
        unlinkSync( newPath );
      }

      continue;
    }

    if( !isNoTreeShow ){
      console.log( `> \x1b[36m|-${dash( level )} \x1b[35m${item}\x1b[0m` );
    }
    
    const [ totalSize_, totalFiles_ ] = walkRecursive( newPath, isClear, isNoTreeShow, level + 2 );

    totalSize += totalSize_;
    totalFiles += totalFiles_;
  }

  if( isClear ){
    rmdirSync( path );
  }

  if( level === 0 && !isNoTreeShow ){
    console.log( `> \x1b[36m|- Total size: \x1b[35m${totalSize.toFixed( 2 )} Kb\x1b[0m` );
  }

  return [ totalSize, totalFiles ];
}

const isClear = process.argv.some( arg => arg === "--clear" || arg === "-c" );
const isNoTreeShow = process.argv.some( arg => arg === "--no-tree-show" || arg === "-nts" );
const [ backendSize, backendFiles ] = walkRecursive( "build", isClear, isNoTreeShow );

if( !isNoTreeShow ){
  console.log( `> \x1b[36m|\x1b[0m` );
}

console.log( `> \x1b[36m|- \x1b[31mBackend\x1b[36m size: \x1b[35m${backendSize.toFixed( 2 )} Kb\x1b[36m, backend files: \x1b[35m${backendFiles}\x1b[0m` );