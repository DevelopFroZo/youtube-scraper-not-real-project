type Filter = ( path: string ) => void | false;

class CachePurger {
  constructor(
    private _filter?: Filter
  ){}

  purgeParents( childPath: string ): string[]{
    const result: string[] = [];

    for( const path in require.cache ){
      if( this._filter && this._filter( path ) === false ) continue;

      if( require.cache[ path ]!.children.some( ( { id } ) => id === childPath ) ){
        result.push( path );

        delete require.cache[ path ];

        result.push( ...this.purgeParents( path ) );
      }
    }

    return result;
  }

  purge( ...paths: string[] ): string[]{
    const result: string[] = [];

    for( const path of paths ){
      if(
        this._filter && this._filter( path ) === false ||
        !( path in require.cache )
      ) continue;

      delete require.cache[ path ];

      result.push( path, ...this.purgeParents( path ) );
    }

    return result;
  }
}

export type { Filter };
export { CachePurger };