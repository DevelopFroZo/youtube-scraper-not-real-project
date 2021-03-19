import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";

import { matchedToArray } from "./matchedToArray";

type Alias = {
  test: RegExp,
  replacement: string
};

class Aliases {
  private _aliases: Alias[];

  constructor( tsconfigPath: string ){
    const tsconfigDir = dirname( tsconfigPath );
    let { compilerOptions: { outDir, paths } } = JSON.parse( readFileSync( tsconfigPath, "utf8" ) );
    const aliases: Alias[] = [];

    outDir = resolve( tsconfigDir, outDir || "." );

    for( let test in paths ){
      let replacement = resolve( outDir, paths[ test ][0] );
      let c = 1;

      replacement = replacement.replace( /\*/g, () => `$${c++}` ).replace( /\\/g, "/" );

      aliases.push( {
        test: new RegExp( `^${test.replace( /\*/g, "(.*)" )}` ),
        replacement
      } );
    }

    this._aliases = aliases;
  }

  replaceInRequire( path: string ): [boolean, string]{
    let isModified = false;
  
    for( const { test, replacement } of this._aliases ){
      if( test.test( path ) ){
        isModified = true;
        path = path.replace( test, replacement );
  
        break;
      }
    }
  
    return [ isModified, path ];
  }

  replaceInText( txt: string ): [boolean, string]{
    const matched = matchedToArray( txt, /require.*"(.*)"/g );
    let offset = 0;
    let isModified = false;

    for( const value of matched ){
      const [ isModified_, path_ ] = this.replaceInRequire( value[1] );

      if( isModified_ ){
        isModified = true;

        const index = value.index + value[0].indexOf( value[1] ) + offset;

        offset += path_.length - value[1].length;
        txt = `${txt.slice( 0, index )}${path_}${txt.slice( index + value[1].length )}`;
      }
    }

    return [ isModified, txt ];
  }

  replaceInFile( path: string ){
    const txt = readFileSync( path, "utf8" );
    const [ isModified, txt_ ] = this.replaceInText( txt );

    if( isModified ){
      writeFileSync( path, txt_ );
    }
  }

  replaceInFiles( ...paths: string[] ){
    for( const path of paths ){
      this.replaceInFile( path );
    }
  }
}

export type { Alias };
export { Aliases };