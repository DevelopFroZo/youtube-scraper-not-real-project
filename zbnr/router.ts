import type { Express, RequestHandler } from "express";

type Group = "before" | "middle" | "after";
type Wrapper = ( middleware: RequestHandler ) => RequestHandler;

class Router {
  private _app: Express;
  private _basePath: string;
  private _filters: RegExp[];
  private _idx: Record<string, any> = {};
  private _groupsMaxs: Record<string, number> = {};

  constructor( app: Express, basePath: string, filters: RegExp[] = [ /\/_/ ] ){
    this._app = app;
    this._basePath = basePath;
    this._filters = filters;
  }

  filterAndMakeUri( path: string ): false | string{
    if( !path.startsWith( this._basePath ) ){
      return false;
    }

    let uri = path
      .replace( this._basePath, "" )
      .replace( /\\/g, "/" )
      .replace( /\.js$/, "" )
      .replace( /\/index$/, "" )
      .replace( /\[(.*?)\]/g, ":$1" );

    if( uri === "" ) uri = "/";

    if( this._filters.some( filter => filter.test( uri ) ) ){
      return false;
    }

    return uri;
  }

  remove( uri: string, hashes: string[] = [] ): boolean{
    const regexp = new RegExp( `^${uri}#` );
    const filtered = [];
    let isRemoved = false;

    for( const layer of this._app._router.stack ){
      if( hashes.includes( layer.hash ) || ( regexp && !regexp.test( layer.hash ) ) ){
        filtered.push( layer );

        continue;
      }

      delete this._idx[ layer.hash ];

      const [ group, orderString ] = layer.hash.match( /(.*)\[(.*)\]/ ).slice( 1, 3 );

      if( group in this._groupsMaxs ){
        const order = Number( orderString );

        if( order === 0 ){
          delete this._groupsMaxs[ group ];
        }
        else if( this._groupsMaxs[ group ] >= order ){
          this._groupsMaxs[ group ] = Number( order ) - 1;
        }
      }

      isRemoved = true;
    }

    this._app._router.stack = filtered;

    return isRemoved;
  }

  addMiddleware( uri: string, method: string, middleware: RequestHandler, hash: string ): void{
    if( method === "use" ){
      ( this._app as any ).use( uri, middleware );
    } else {
      ( this._app as any )[ method ]( uri, middleware );
    }

    const layer = this._app._router.stack[ this._app._router.stack.length - 1 ];

    layer.hash = hash;
    this._idx[ hash ] = method === "use" ? layer : layer.route.stack[0];
  }

  addOrUpdateMiddleware( uri: string, method: string, group: Group, order: number, middleware: RequestHandler ): string{
    if( method === "del" ){
      method = "delete";
    }

    const hash = `${uri}#${method}.${group}[${order}]`;

    if( hash in this._idx ){
      this._idx[ hash ].handle = middleware;

      return hash;
    }

    this.addMiddleware( uri, method, middleware, `${uri}#${method}.${group}[${order}]` );

    let regexpsParams: [ string, Group, 0 | "max", 0 | 1 ][];

    if( method === "use" ){
      regexpsParams = [
        [ "use", "before", "max", 1 ],
        [ ".*", "before", 0, 0 ]
      ];
    }
    else if( group === "before" ){
      regexpsParams = [
        [ method, "middle", 0, 0 ],
        [ method, "before", "max", 1 ],
        [ method, "after", 0, 0 ]
      ];
    }
    else if( group === "middle" ){
      regexpsParams = [
        [ method, "after", 0, 0 ],
        [ method, "before", "max", 1 ]
      ];
    } else {
      regexpsParams = [
        [ method, "after", "max", 1 ],
        [ method, "middle", 0, 1 ],
        [ method, "before", "max", 1 ]
      ];
    }

    let index = -1;

    for( const [ method_, group_, order_, indexModificator ] of regexpsParams ){
      let regexp: undefined | RegExp;

      if( order_ === 0 ){
        regexp = new RegExp( `^${uri}#${method_}.${group_}\\[0\\]$` );
      }
      else if( `${uri}#${method}.${group_}` in this._groupsMaxs ){
        regexp = new RegExp( `^${uri}#${method_}.${group_}\\[${this._groupsMaxs[ `${uri}#${method}.${group_}` ]}\\]$` );
      }

      if( !regexp ) continue;
      
      const newIndex = this._app._router.stack.findIndex( ( layer: any ) => regexp!.test( layer.hash ) );

      if( newIndex === -1 ) continue;

      index = newIndex + indexModificator;

      break;
    }

    if( index > -1 ){
      const layer = this._app._router.stack.splice( -1 )[0];

      this._app._router.stack.splice( index, 0, layer );
    }

    this._groupsMaxs[ `${uri}#${method}.${group}` ] = order;

    return hash;
  }

  handleExports( exprts: Record<string, any>, uri: string, isRemove: boolean ): void{
    const hashes: string[] = [];

    if( "wrappers" in exprts ){
      for( const [ method, wrapper ] of Object.entries<Wrapper>( exprts.wrappers ) ){
        if( method in exprts ){
          exprts[ method ] = wrapper( exprts[ method ] );
        }
      }

      delete exprts.wrappers;
    }

    for( const [ key, value ] of Object.entries( exprts ) ){
      if( key === "extras" ){
        for( const [ method, group, ...middlewares ] of value ){
          for( const [ i, middleware ] of Object.entries<RequestHandler>( middlewares ) ){
            const hash = this.addOrUpdateMiddleware( uri, method, group, Number( i ), middleware );

            hashes.push( hash );
          }
        }

        continue;
      }

      if( key === "uses" ){
        for( const [ i, middleware ] of Object.entries<RequestHandler>( value ) ){
          const hash = this.addOrUpdateMiddleware( uri, "use", "before", Number( i ), middleware );

          hashes.push( hash );
        }

        continue;
      }

      const hash = this.addOrUpdateMiddleware( uri, key, "middle", 0, value );

      hashes.push( hash );
    }

    if( isRemove ){
      this.remove( uri, hashes );
    }
  }

  handlePath( path: string, isRemove: boolean = true ): false | [number, string]{
    let uri = this.filterAndMakeUri( path );

    if( !uri ){
      return false;
    }

    const exprts = require( path );

    if( Object.keys( exprts ).length === 0 ){
      delete require.cache[ path ];

      if( this.remove( uri ) ){
        return [ 0, uri ];
      }

      return false;
    }

    const matched = uri.match( /#(.*)$/ );

    if( matched ){
      const { default: dflt, ...rest } = exprts;
      const method = matched[1];

      uri = uri.replace( /\/?#.*$/, "" );
      this.handleExports( { [method]: dflt, ...rest }, uri, isRemove );
    } else {
      this.handleExports( exprts, uri, isRemove );
    }

    return [ 1, uri ];
  }

  init( paths: string[] ): this{
    for( const path of paths ){
      this.handlePath( path, false );
    }

    return this;
  }

  removePath( path: string ): false | string{
    let uri = this.filterAndMakeUri( path );

    if( !uri ){
      return false;
    }

    if( this.remove( uri ) ){
      return uri;
    }

    return false;
  }
}

export { Router };