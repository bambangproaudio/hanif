import yts from 'yt-search';
async function test() {
  try {
    const r = await yts('karaoke indonesia');
    console.log(r.videos.length);
    console.log(r.videos[0].title);
  } catch (e) {
    console.error(e);
  }
}
test();
