async function getFromYoutube( method, query ){
  const uri =
    "/youtube/" +
    `${method}?` +
    new URLSearchParams( query ).toString();

  const response = await fetch( uri );
  const { payload } = await response.json();

  return payload;
}

async function getPlaylists( channelId ){
  const playlists = await getFromYoutube( "playlists", {
    channelId,
    part: "snippet",
    maxResults: 10
  } );

  return playlists;
}

async function getPlaylistItems( playlistId ){
  const playlistItems = await getFromYoutube( "playlistItems", {
    playlistId,
    part: "snippet",
    maxResults: 10
  } );

  return playlistItems;
}

async function getVideos( videosIds ){
  const videos = await getFromYoutube( "videos", {
    part: "snippet,statistics,contentDetails",
    id: videosIds.join( "," )
  } );

  return videos;
}