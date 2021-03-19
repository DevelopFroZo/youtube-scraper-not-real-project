import type { Request, Response } from "express";

import { getFromYoutube } from "@u/getFromYoutube";

async function get(
  {
    query
  }: Request,
  res: Response
){
  const playlists = await getFromYoutube( "playlistItems", query as any );

  res.json( {
    payload: playlists
  } );
}

export { get };