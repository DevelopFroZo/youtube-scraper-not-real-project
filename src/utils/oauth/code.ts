import type { RequestHandler, Response } from "express";

import type {
  AuthEndpoint,
  ClientId,
  ResponseType,
  Params,
  BeforeCodeRequestFunction
} from "./types";

function getCodeMiddleware(
  redirect_uri: string,
  auth_endpoint: AuthEndpoint,
  client_id: ClientId,
  response_type: ResponseType,
  codeRequestOptions: Params | undefined,
  beforeCodeRequestFunction: BeforeCodeRequestFunction | undefined
): RequestHandler{
  return async ( req: any, res: Response ) => {
    let params: Params = { client_id, redirect_uri, response_type };

    if( codeRequestOptions ){
      params = { ...params, ...codeRequestOptions };
    }

    if( beforeCodeRequestFunction ){
      const result = await beforeCodeRequestFunction( params, req, res );

      if( result === false ) return;

      params = result;
    }

    const paramsString = Object.entries( params ).map( pair => pair.join( "=" ) ).join( "&" );

    res.redirect( `${auth_endpoint}?${paramsString}` );
  };
}

export { getCodeMiddleware };