const VIDEOS_COUNT_PER_REQUEST = 10;

async function onStartScrapClick(){
  const channelIdInput = document.getElementById( "channelId" );
  const downloadLink = document.getElementById( "download" );
  const channelId = channelIdInput.value;
  const playlists = ( await getPlaylists( channelId ) ).items;
  const videos = [];

  for( const playlist of playlists ){
    const videosIds = ( await getPlaylistItems( playlist.id ) ).items;
    let videosIdsForFetch = [];
    let i = 0;

    while( true ){
      if(
        videosIdsForFetch.length === VIDEOS_COUNT_PER_REQUEST ||
        i === videosIds.length
      ){
        let videos_ = ( await getVideos( videosIdsForFetch ) ).items;

        videos.push( ...videos_.map( video => ( { ...video, playlist_title: playlist.snippet.title } ) ) );
        videosIdsForFetch = [];

        if( i === videosIds.length ){
          break;
        }
      }

      videosIdsForFetch.push( videosIds[i].snippet.resourceId.videoId );
      i++;
    }
  }

  let csv = "Playlist,Name,Published at,Like count,Dislike count,Favorite count,Comment count,Duration in seconds\n";
  console.log( videos.length );

  for( const video of videos ){
    const {
      playlist_title,
      snippet: {
        title: rawTitle,
        publishedAt
      },
      statistics: {
        likeCount,
        dislikeCount,
        favoriteCount,
        commentCount
      },
      contentDetails: {
        duration
      }
    } = video;

    const title = rawTitle.replace( /,/g, "" );

    const days = duration.match( /([0-9]+)D/ );
    const hours = duration.match( /([0-9]+)H/ );
    const minutes = duration.match( /([0-9]+)M/ );
    const seconds = duration.match( /([0-9]+)S/ );
    let durationS = 0;

    if( days ) durationS += Number( days[1] ) * 24 * 60 * 60;
    if( hours ) durationS += Number( hours[1] ) * 60 * 60;
    if( minutes ) durationS += Number( minutes[1] ) * 60;
    if( seconds ) durationS += Number( seconds[1] );

    csv += `${playlist_title},${title},${publishedAt},${likeCount},${dislikeCount},${favoriteCount},${commentCount},${durationS}\n`;
  }

  const file = new Blob( [ csv ], {
    type: "text/plain"
  } );

  const download = URL.createObjectURL( file );

  downloadLink.href = download;
  downloadLink.download = "videos.csv";
  downloadLink.click();
}

function index(){
  const startScrapButton = document.getElementById( "startScrap" );

  startScrapButton.addEventListener( "click", onStartScrapClick );
}

window.addEventListener( "load", index );