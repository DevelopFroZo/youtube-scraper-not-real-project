import type { Request, Response } from "express";

import { getFromYoutube } from "@u/getFromYoutube";

async function get(
  {
    query
  }: Request,
  res: Response
){
  const playlists = await getFromYoutube( "playlists", query as any );

  res.json( {
    payload: playlists
  } );
}

export { get };