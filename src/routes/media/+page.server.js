
export const load = async(loadEvent) => {

    const { fetch } = loadEvent;
    
    let media_data = new Object({media: []});

    const media_req = await fetch(`/api/media`, {
        headers: { 'Authorization': import.meta.env.VITE_REVIEWER_PLUS_MASTER_API_KEY}
    });

    let media = await media_req.json();

    media.sort((a, b) => a.media_name.localeCompare(b.media_name));
    
    media_data.media = media;
    return {media_data};

}